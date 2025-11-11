-- Two-Tier Freemium: 4 chapters/day + 2 max active stories

-- 1. Add chapter tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS free_chapters_used_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_chapter_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS max_active_stories INTEGER DEFAULT 2;

-- 2. Reset existing free users to new model
UPDATE public.profiles
SET 
  free_chapters_used_today = 0,
  last_chapter_reset_date = CURRENT_DATE,
  max_active_stories = 2,
  credits = 0 -- Free users no longer use credits
WHERE subscription_tier = 'free';

-- 3. Set unlimited for paid users
UPDATE public.profiles
SET max_active_stories = 999
WHERE subscription_tier != 'free';

-- 4. Create function to use a free chapter
CREATE OR REPLACE FUNCTION public.use_free_chapter(user_uuid UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  current_used INTEGER;
  reset_date DATE;
  user_tier TEXT;
BEGIN
  -- Get user info
  SELECT 
    free_chapters_used_today,
    last_chapter_reset_date,
    subscription_tier
  INTO current_used, reset_date, user_tier
  FROM public.profiles
  WHERE id = user_uuid;

  -- Reset if new day
  IF reset_date < CURRENT_DATE THEN
    current_used := 0;
    reset_date := CURRENT_DATE;
    
    UPDATE public.profiles
    SET 
      free_chapters_used_today = 0,
      last_chapter_reset_date = CURRENT_DATE
    WHERE id = user_uuid;
  END IF;

  -- Check if free user and at limit
  IF user_tier = 'free' AND current_used >= 4 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'daily_limit_reached',
      'used', current_used,
      'limit', 4,
      'remaining', 0,
      'reset_at', reset_date + INTERVAL '1 day'
    );
  END IF;

  -- Increment usage for free users only
  IF user_tier = 'free' THEN
    UPDATE public.profiles
    SET free_chapters_used_today = current_used + 1
    WHERE id = user_uuid;

    current_used := current_used + 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'used', current_used,
    'remaining', GREATEST(0, 4 - current_used),
    'limit', 4,
    'is_paid', user_tier != 'free'
  );
END;
$$;

-- 5. Create function to check active story count
CREATE OR REPLACE FUNCTION public.check_active_stories(user_uuid UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  active_count INTEGER;
  user_tier TEXT;
  max_allowed INTEGER;
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM public.profiles
  WHERE id = user_uuid;

  -- Count active stories (not completed, not abandoned)
  SELECT COUNT(*) INTO active_count
  FROM public.stories
  WHERE user_id = user_uuid 
    AND lifecycle_status IN ('draft', 'ready')
    AND status != 'completed';

  -- Set max based on tier
  IF user_tier = 'free' THEN
    max_allowed := 2;
  ELSE
    max_allowed := 999; -- Unlimited for paid
  END IF;

  RETURN jsonb_build_object(
    'active_count', active_count,
    'max_allowed', max_allowed,
    'can_create_new', active_count < max_allowed,
    'tier', user_tier
  );
END;
$$;

-- 6. Create function to get user chapter status
CREATE OR REPLACE FUNCTION public.get_chapter_status(user_uuid UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  current_used INTEGER;
  reset_date DATE;
  user_tier TEXT;
BEGIN
  SELECT 
    free_chapters_used_today,
    last_chapter_reset_date,
    subscription_tier
  INTO current_used, reset_date, user_tier
  FROM public.profiles
  WHERE id = user_uuid;

  -- Reset if new day
  IF reset_date < CURRENT_DATE THEN
    current_used := 0;
    
    UPDATE public.profiles
    SET 
      free_chapters_used_today = 0,
      last_chapter_reset_date = CURRENT_DATE
    WHERE id = user_uuid;
  END IF;

  RETURN jsonb_build_object(
    'used', current_used,
    'limit', 4,
    'remaining', GREATEST(0, 4 - current_used),
    'reset_at', CURRENT_DATE + INTERVAL '1 day',
    'is_paid', user_tier != 'free',
    'tier', user_tier
  );
END;
$$;