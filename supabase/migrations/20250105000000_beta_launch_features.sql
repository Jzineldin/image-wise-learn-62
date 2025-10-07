-- Beta Launch Features Migration
-- Adds beta status tracking and founder badges for early users

-- Add beta status columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_beta_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS beta_joined_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS founder_status TEXT DEFAULT NULL; -- 'founder', 'early_adopter', null

-- Create index for beta users
CREATE INDEX IF NOT EXISTS idx_profiles_beta_status ON public.profiles(is_beta_user, beta_joined_at);

-- Update handle_new_user function to give beta users 100 credits instead of 10
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  beta_credits INTEGER := 100; -- Beta users get 100 credits
  is_beta BOOLEAN := true; -- Currently in beta period
BEGIN
  -- Create profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    is_beta_user,
    beta_joined_at,
    founder_status
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    is_beta,
    CASE WHEN is_beta THEN now() ELSE NULL END,
    CASE WHEN is_beta THEN 'founder' ELSE NULL END
  );
  
  -- Create user credits record with beta bonus
  INSERT INTO public.user_credits (user_id, current_balance, total_earned, total_spent)
  VALUES (new.id, beta_credits, beta_credits, 0);
  
  -- Record initial credit grant
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description
  ) VALUES (
    new.id,
    'bonus',
    beta_credits,
    beta_credits,
    CASE 
      WHEN is_beta THEN 'Beta Founder Bonus - 100 free credits! 🎉'
      ELSE 'Welcome bonus - 10 free credits'
    END
  );
  
  RETURN new;
END;
$function$;

-- Drop existing user_feedback table if it exists (old schema)
DROP TABLE IF EXISTS public.user_feedback CASCADE;

-- Create feedback table for global feedback button
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL, -- 'bug', 'feature', 'general', 'praise'
  subject TEXT,
  message TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'in_progress', 'resolved', 'closed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on feedback table
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON public.user_feedback;

-- RLS policies for feedback
CREATE POLICY "Users can insert their own feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.user_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update all feedback"
ON public.user_feedback
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON public.user_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.user_feedback(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.user_feedback(feedback_type, created_at DESC);

-- Function to get feedback stats (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_feedback_stats()
RETURNS TABLE(
  total_feedback BIGINT,
  new_feedback BIGINT,
  in_progress_feedback BIGINT,
  resolved_feedback BIGINT,
  feedback_by_type JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(*), 0)::BIGINT as total_feedback,
    COALESCE(COUNT(*) FILTER (WHERE status = 'new'), 0)::BIGINT as new_feedback,
    COALESCE(COUNT(*) FILTER (WHERE status = 'in_progress'), 0)::BIGINT as in_progress_feedback,
    COALESCE(COUNT(*) FILTER (WHERE status = 'resolved'), 0)::BIGINT as resolved_feedback,
    COALESCE(
      (SELECT jsonb_object_agg(feedback_type, count)
       FROM (
         SELECT
           feedback_type,
           COUNT(*)::BIGINT as count
         FROM public.user_feedback
         GROUP BY feedback_type
       ) type_counts),
      '{}'::jsonb
    ) as feedback_by_type
  FROM public.user_feedback;
END;
$function$;

-- Comment on new columns
COMMENT ON COLUMN public.profiles.is_beta_user IS 'Whether user signed up during beta period';
COMMENT ON COLUMN public.profiles.beta_joined_at IS 'When user joined during beta period';
COMMENT ON COLUMN public.profiles.founder_status IS 'Founder badge status: founder, early_adopter, or null';
COMMENT ON TABLE public.user_feedback IS 'User feedback submissions from global feedback button';

