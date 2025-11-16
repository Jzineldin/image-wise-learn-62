-- =============================================
-- Migration: Unified Credits & Chapters Model
-- Date: 2025-11-16
-- Description: Implements hybrid chapters+credits model
--   - Chapters = daily quota for text/image (4/day free)
--   - Credits = universal currency for TTS/Animate/Video
--   - Subscribers get unlimited chapters + 500 monthly credits
-- =============================================

-- Add new columns to profiles for chapter tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS chapters_used_today INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS chapters_reset_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_daily_credit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_state JSONB DEFAULT '{}'::jsonb;

-- Add subscriber credit tracking to user_credits
ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS monthly_credits_granted INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_credits_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ;

-- Create daily quotas tracking table (partitioned for auto-cleanup)
CREATE TABLE IF NOT EXISTS public.daily_quotas (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_date DATE NOT NULL,
  chapters_used INT DEFAULT 0,
  credits_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, quota_date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_quotas_user_date ON public.daily_quotas(user_id, quota_date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_chapters_reset ON public.profiles(chapters_reset_at) WHERE chapters_used_today > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_last_daily_credit ON public.profiles(last_daily_credit_at);

-- Add constraint to prevent negative credits
ALTER TABLE public.user_credits
ADD CONSTRAINT check_positive_balance CHECK (current_balance >= 0);

-- =============================================
-- RPC Functions
-- =============================================

/**
 * Get current quota status for a user
 * Returns chapter and credit information
 */
CREATE OR REPLACE FUNCTION public.get_user_quotas(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  user_credits RECORD;
  is_subscriber BOOLEAN;
  result JSONB;
BEGIN
  -- Get profile data
  SELECT
    chapters_used_today,
    chapters_reset_at,
    last_daily_credit_at,
    subscription_status
  INTO user_profile
  FROM public.profiles
  WHERE id = user_uuid;

  -- Check subscription status
  is_subscriber := user_profile.subscription_status = 'active';

  -- Get credit balance
  SELECT
    current_balance,
    monthly_credits_granted,
    monthly_credits_used,
    credits_reset_at
  INTO user_credits
  FROM public.user_credits
  WHERE user_id = user_uuid;

  -- Build response
  result := jsonb_build_object(
    'credits', jsonb_build_object(
      'balance', COALESCE(user_credits.current_balance, 0),
      'monthly_granted', COALESCE(user_credits.monthly_credits_granted, 0),
      'monthly_used', COALESCE(user_credits.monthly_credits_used, 0),
      'next_daily_drip_at', CASE
        WHEN is_subscriber THEN NULL
        ELSE (user_profile.last_daily_credit_at + INTERVAL '1 day')
      END
    ),
    'chapters', jsonb_build_object(
      'used_today', CASE WHEN is_subscriber THEN 0 ELSE COALESCE(user_profile.chapters_used_today, 0) END,
      'limit_per_day', CASE WHEN is_subscriber THEN NULL ELSE 4 END,
      'resets_at', CASE WHEN is_subscriber THEN NULL ELSE user_profile.chapters_reset_at END
    ),
    'subscription', jsonb_build_object(
      'is_active', is_subscriber,
      'monthly_credits', CASE WHEN is_subscriber THEN 500 ELSE NULL END,
      'credits_reset_at', user_credits.credits_reset_at
    )
  );

  RETURN result;
END;
$$;

/**
 * Check if user can generate a chapter
 * Pre-flight check before enqueueing generation
 */
CREATE OR REPLACE FUNCTION public.can_generate_chapter(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  is_subscriber BOOLEAN;
  result JSONB;
BEGIN
  SELECT
    subscription_status,
    chapters_used_today,
    chapters_reset_at
  INTO user_profile
  FROM public.profiles
  WHERE id = user_uuid;

  is_subscriber := user_profile.subscription_status = 'active';

  -- Subscribers have unlimited chapters
  IF is_subscriber THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'subscriber'
    );
  END IF;

  -- Check daily limit for free users
  IF user_profile.chapters_used_today >= 4 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'used', user_profile.chapters_used_today,
      'limit', 4,
      'resets_at', user_profile.chapters_reset_at
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', 4 - user_profile.chapters_used_today
  );
END;
$$;

/**
 * Check if user has sufficient credits for a feature
 * Returns gating information if insufficient
 */
CREATE OR REPLACE FUNCTION public.check_credit_entitlement(
  user_uuid UUID,
  feature_type TEXT, -- 'tts', 'animate', 'video'
  estimated_cost INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credit_balance INT;
  result JSONB;
BEGIN
  -- Get current balance
  SELECT current_balance INTO credit_balance
  FROM public.user_credits
  WHERE user_id = user_uuid;

  -- No credits record found
  IF credit_balance IS NULL THEN
    credit_balance := 0;
  END IF;

  -- Check sufficiency
  IF credit_balance < estimated_cost THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'insufficient_credits',
      'required', estimated_cost,
      'available', credit_balance,
      'deficit', estimated_cost - credit_balance
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'cost', estimated_cost,
    'balance', credit_balance,
    'remaining_after', credit_balance - estimated_cost
  );
END;
$$;

/**
 * Increment chapter usage (called after successful generation)
 */
CREATE OR REPLACE FUNCTION public.increment_chapter_usage(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_reset TIMESTAMPTZ;
  current_used INT;
  is_subscriber BOOLEAN;
BEGIN
  -- Get current state
  SELECT
    chapters_reset_at,
    chapters_used_today,
    subscription_status = 'active'
  INTO current_reset, current_used, is_subscriber
  FROM public.profiles
  WHERE id = user_uuid
  FOR UPDATE;

  -- Don't track for subscribers
  IF is_subscriber THEN
    RETURN jsonb_build_object('success', true, 'subscriber', true);
  END IF;

  -- Reset if past reset time
  IF NOW() >= current_reset THEN
    UPDATE public.profiles
    SET
      chapters_used_today = 1,
      chapters_reset_at = (NOW() + INTERVAL '1 day')::date::timestamptz, -- Midnight tomorrow
      updated_at = NOW()
    WHERE id = user_uuid;

    RETURN jsonb_build_object(
      'success', true,
      'used', 1,
      'limit', 4,
      'reset', true
    );
  END IF;

  -- Increment usage
  UPDATE public.profiles
  SET
    chapters_used_today = chapters_used_today + 1,
    updated_at = NOW()
  WHERE id = user_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'used', current_used + 1,
    'limit', 4
  );
END;
$$;

/**
 * Grant daily credits to free users (run via cron)
 */
CREATE OR REPLACE FUNCTION public.grant_daily_credits()
RETURNS TABLE(user_id UUID, credits_granted INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH eligible_users AS (
    SELECT p.id
    FROM public.profiles p
    WHERE p.subscription_status != 'active'
      AND (p.last_daily_credit_at IS NULL OR p.last_daily_credit_at < NOW() - INTERVAL '1 day')
  ),
  updated_users AS (
    UPDATE public.profiles p
    SET last_daily_credit_at = NOW()
    FROM eligible_users eu
    WHERE p.id = eu.id
    RETURNING p.id
  ),
  granted_credits AS (
    INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description)
    SELECT
      uu.id,
      'daily_drip',
      10,
      'Daily free credits'
    FROM updated_users uu
    RETURNING user_id, amount
  )
  UPDATE public.user_credits uc
  SET current_balance = current_balance + 10,
      total_earned = total_earned + 10,
      updated_at = NOW()
  FROM granted_credits gc
  WHERE uc.user_id = gc.user_id
  RETURNING uc.user_id, 10 as credits_granted;
END;
$$;

/**
 * Grant monthly credits to subscribers (run on billing renewal)
 */
CREATE OR REPLACE FUNCTION public.grant_subscriber_monthly_credits(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_reset TIMESTAMPTZ;
BEGIN
  -- Calculate next reset (30 days from now)
  next_reset := NOW() + INTERVAL '30 days';

  -- Update user credits
  UPDATE public.user_credits
  SET
    current_balance = current_balance + 500,
    total_earned = total_earned + 500,
    monthly_credits_granted = 500,
    monthly_credits_used = 0,
    credits_reset_at = next_reset,
    updated_at = NOW()
  WHERE user_id = user_uuid;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    description,
    metadata
  ) VALUES (
    user_uuid,
    'subscription_renewal',
    500,
    'Monthly subscriber credits',
    jsonb_build_object('reset_at', next_reset)
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_granted', 500,
    'next_reset', next_reset
  );
END;
$$;

-- =============================================
-- Data Migration: Grant existing users credits
-- =============================================

-- Grant 100 signup credits to users who don't have any
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT DISTINCT p.id
    FROM public.profiles p
    LEFT JOIN public.user_credits uc ON uc.user_id = p.id
    WHERE uc.current_balance IS NULL OR uc.current_balance = 0
  LOOP
    -- Ensure user_credits record exists
    INSERT INTO public.user_credits (user_id, current_balance, total_earned)
    VALUES (user_record.id, 100, 100)
    ON CONFLICT (user_id) DO UPDATE
    SET current_balance = GREATEST(user_credits.current_balance, 100),
        total_earned = user_credits.total_earned + 100;

    -- Record transaction
    INSERT INTO public.credit_transactions (
      user_id,
      transaction_type,
      amount,
      description
    ) VALUES (
      user_record.id,
      'signup_bonus',
      100,
      'Welcome bonus - unified credits model migration'
    );
  END LOOP;

  RAISE NOTICE 'Granted signup credits to existing users';
END $$;

-- =============================================
-- Permissions (RLS)
-- =============================================

-- Enable RLS on daily_quotas
ALTER TABLE public.daily_quotas ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quotas
CREATE POLICY "Users can view own quotas"
ON public.daily_quotas FOR SELECT
USING (auth.uid() = user_id);

-- System can insert/update quotas
CREATE POLICY "System can manage quotas"
ON public.daily_quotas FOR ALL
USING (true)
WITH CHECK (true);

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.get_user_quotas TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_generate_chapter TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_credit_entitlement TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_chapter_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_daily_credits TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_subscriber_monthly_credits TO service_role;

-- =============================================
-- Comments for documentation
-- =============================================

COMMENT ON TABLE public.daily_quotas IS 'Tracks daily chapter and credit usage per user';
COMMENT ON FUNCTION public.get_user_quotas IS 'Returns current chapter and credit quotas for a user';
COMMENT ON FUNCTION public.can_generate_chapter IS 'Pre-flight check for chapter generation entitlement';
COMMENT ON FUNCTION public.check_credit_entitlement IS 'Pre-flight check for credit-based features (TTS, Video, Animate)';
COMMENT ON FUNCTION public.grant_daily_credits IS 'Cron job: grants 10 daily credits to free users';
COMMENT ON FUNCTION public.grant_subscriber_monthly_credits IS 'Webhook: grants 500 monthly credits on subscription renewal';
