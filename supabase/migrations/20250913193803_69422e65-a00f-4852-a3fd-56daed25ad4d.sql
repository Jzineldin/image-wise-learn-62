-- Phase 3: Fix remaining security issues with search_path for all other functions

CREATE OR REPLACE FUNCTION public.get_credit_transactions(limit_count integer DEFAULT 10, user_uuid uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, user_id uuid, amount integer, type text, description text, metadata jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.amount,
    t.type,
    t.description,
    t.metadata,
    t.created_at
  FROM public.credit_transactions t
  WHERE t.user_id = COALESCE(user_uuid, auth.uid())
  ORDER BY t.created_at DESC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_month_usage()
 RETURNS TABLE(stories_created integer, voice_minutes_used integer, credits_used integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT s.id)::integer, 0) as stories_created,
    COALESCE(SUM(
      CASE 
        WHEN ss.audio_url IS NOT NULL 
        THEN CEIL(LENGTH(COALESCE(ss.content, ss.segment_text, '')) / 200.0)::integer 
        ELSE 0 
      END
    )::integer, 0) as voice_minutes_used,
    COALESCE(SUM(s.credits_used)::integer, 0) as credits_used
  FROM public.stories s
  LEFT JOIN public.story_segments ss ON ss.story_id = s.id
  WHERE s.user_id = auth.uid()
    AND s.created_at >= date_trunc('month', CURRENT_DATE)
    AND s.created_at < date_trunc('month', CURRENT_DATE) + interval '1 month';
END;
$function$;

CREATE OR REPLACE FUNCTION public.deduct_credits(user_uuid uuid, amount integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN spend_credits(
    user_uuid,
    amount,
    'Story segment generation',
    NULL,
    'story_segment',
    NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_credits(user_uuid uuid, credits_to_add integer, description_text text, ref_id text DEFAULT NULL::text, ref_type text DEFAULT NULL::text, transaction_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance with lock
  SELECT current_balance INTO current_credits
  FROM public.user_credits
  WHERE user_id = user_uuid
  FOR UPDATE;
  
  -- Calculate new balance
  new_balance := current_credits + credits_to_add;
  
  -- Update balance
  UPDATE public.user_credits
  SET 
    current_balance = new_balance,
    total_earned = total_earned + credits_to_add,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    reference_id,
    reference_type,
    metadata
  ) VALUES (
    user_uuid,
    'purchase',
    credits_to_add,
    new_balance,
    description_text,
    ref_id,
    ref_type,
    transaction_metadata
  );
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Create user credits record
  INSERT INTO public.user_credits (user_id, current_balance, total_earned, total_spent)
  VALUES (new.id, 10, 10, 0);
  
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
    10,
    10,
    'Welcome bonus - 10 free credits'
  );
  
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(p_user_id uuid, p_amount integer, p_operation_type text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
  transaction_id UUID;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  IF current_credits < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'available', current_credits, 'required', p_amount);
  END IF;

  new_balance := current_credits - p_amount;

  UPDATE public.profiles
  SET credits = new_balance, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id, amount, type, metadata, created_at
  ) VALUES (
    p_user_id, -p_amount, p_operation_type, COALESCE(p_metadata, '{}'::jsonb), NOW()
  ) RETURNING id INTO transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', new_balance,
    'transaction_id', transaction_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_credits_rpc(p_user_id uuid, p_amount integer, p_operation_type text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
  transaction_id UUID;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;

  new_balance := current_credits + p_amount;

  UPDATE public.profiles
  SET credits = new_balance, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id, amount, type, metadata, created_at
  ) VALUES (
    p_user_id, p_amount, p_operation_type, COALESCE(p_metadata, '{}'::jsonb), NOW()
  ) RETURNING id INTO transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', new_balance,
    'transaction_id', transaction_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix remaining admin functions (Note: these use security roles so we need the has_role function fix first)
CREATE OR REPLACE FUNCTION public.has_role(check_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Check if user has the specified role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = check_role
  );
END;
$function$;

-- Now fix the admin functions
CREATE OR REPLACE FUNCTION public.admin_get_completed_stories(limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, title text, author_name text, genre text, age_group text, created_at timestamp with time zone, is_featured boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') AND NOT has_role('premium_plus') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    p.display_name as author_name,
    s.genre,
    s.age_group,
    s.created_at,
    EXISTS(SELECT 1 FROM public.featured_stories fs WHERE fs.story_id = s.id AND fs.is_active = true) as is_featured
  FROM public.stories s
  LEFT JOIN public.profiles p ON s.author_id = p.id
  WHERE s.status = 'completed'
    AND s.visibility = 'public'
  ORDER BY s.created_at DESC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_feedback(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, type text, title text, description text, rating integer, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- If no user specified, use current user
  IF p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;

  -- Only allow users to see their own feedback, or admins to see all
  IF p_user_id = auth.uid() OR has_role('admin') THEN
    RETURN QUERY
    SELECT
      uf.id,
      uf.type,
      uf.title,
      uf.description,
      uf.rating,
      uf.status,
      uf.created_at
    FROM public.user_feedback uf
    WHERE uf.user_id = p_user_id
    ORDER BY uf.created_at DESC;
  END IF;

  -- Return empty if no permission
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_visibility_settings(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(setting_key text, setting_value jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- If no user specified, use current user
  IF p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;

  -- Only allow users to see their own settings
  IF p_user_id = auth.uid() THEN
    RETURN QUERY
    SELECT
      vs.setting_key,
      vs.setting_value
    FROM public.visibility_settings vs
    WHERE vs.user_id = p_user_id;
  END IF;

  -- Return empty if no permission
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_visibility_setting(p_setting_key text, p_setting_value jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.visibility_settings (user_id, setting_key, setting_value)
  VALUES (auth.uid(), p_setting_key, p_setting_value)
  ON CONFLICT (user_id, setting_key)
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_featured_view_count(p_story_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Update view count in featured_stories table if it exists
  UPDATE public.featured_stories 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE story_id = p_story_id;
END;
$function$;

-- Fix all remaining admin functions that use has_role
CREATE OR REPLACE FUNCTION public.admin_unfeature_story(p_story_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only admins can unfeature stories
  IF NOT has_role('admin') AND NOT has_role('premium_plus') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  UPDATE public.featured_stories
  SET is_active = false, updated_at = NOW()
  WHERE story_id = p_story_id;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_featured_stories()
 RETURNS TABLE(id uuid, story_id uuid, title text, author_name text, featured_by uuid, priority integer, is_active boolean, featured_until timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') AND NOT has_role('premium_plus') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    fs.id,
    fs.story_id,
    s.title,
    p.display_name as author_name,
    fs.featured_by,
    fs.priority,
    fs.is_active,
    fs.featured_until,
    fs.created_at
  FROM public.featured_stories fs
  JOIN public.stories s ON fs.story_id = s.id
  LEFT JOIN public.profiles p ON s.user_id = p.id
  ORDER BY fs.priority DESC, fs.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_feature_story(p_story_id uuid, p_priority integer DEFAULT 1, p_featured_until timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only admins can feature stories
  IF NOT has_role('admin') AND NOT has_role('premium_plus') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Check if story exists and is completed/public
  IF NOT EXISTS (
    SELECT 1 FROM public.stories
    WHERE id = p_story_id
    AND status = 'completed'
    AND visibility = 'public'
  ) THEN
    RAISE EXCEPTION 'Story must be completed and public to be featured';
  END IF;

  -- Insert or update featured story
  INSERT INTO public.featured_stories (
    story_id,
    featured_by,
    priority,
    is_active,
    featured_until
  ) VALUES (
    p_story_id,
    auth.uid(),
    p_priority,
    true,
    COALESCE(p_featured_until, NOW() + INTERVAL '30 days')
  )
  ON CONFLICT (story_id)
  DO UPDATE SET
    priority = EXCLUDED.priority,
    is_active = true,
    featured_until = EXCLUDED.featured_until,
    updated_at = NOW();

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_featured_priority(p_story_id uuid, p_priority integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Only admins can update priority
  IF NOT has_role('admin') AND NOT has_role('premium_plus') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  UPDATE public.featured_stories
  SET priority = p_priority, updated_at = NOW()
  WHERE story_id = p_story_id AND is_active = true;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_featured_stories(limit_count integer DEFAULT 10)
 RETURNS TABLE(story_id uuid, title text, description text, author_name text, genre text, age_group text, cover_image_url text, "position" integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    fs.story_id,
    s.title,
    s.description,
    p.display_name as author_name,
    s.genre,
    s.age_group,
    s.cover_image as cover_image_url,
    fs."position", -- Quoted reserved keyword
    fs.created_at
  FROM public.featured_stories fs
  JOIN public.stories s ON fs.story_id = s.id
  LEFT JOIN public.profiles p ON s.author_id = p.id
  WHERE fs.is_active = true
  ORDER BY fs."position" ASC, fs.created_at DESC -- Quoted reserved keyword
  LIMIT limit_count;
END;
$function$;