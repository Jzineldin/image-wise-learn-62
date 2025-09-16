-- Create missing admin database functions for analytics and content management

-- Analytics overview function
CREATE OR REPLACE FUNCTION public.admin_get_analytics_overview()
RETURNS TABLE(
  total_users bigint,
  total_stories bigint,
  total_credits_used bigint,
  active_users_30d bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM stories) as total_stories,
    (SELECT COALESCE(SUM(credits_used), 0) FROM stories) as total_credits_used,
    (SELECT COUNT(DISTINCT user_id) FROM stories WHERE created_at >= NOW() - INTERVAL '30 days') as active_users_30d;
END;
$function$;

-- Daily usage function
CREATE OR REPLACE FUNCTION public.admin_get_daily_usage(days_back integer DEFAULT 30)
RETURNS TABLE(
  date text,
  users bigint,
  stories bigint,
  credits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    TO_CHAR(date_series.date, 'YYYY-MM-DD') as date,
    COALESCE(COUNT(DISTINCT p.id), 0) as users,
    COALESCE(COUNT(s.id), 0) as stories,
    COALESCE(SUM(s.credits_used), 0) as credits
  FROM generate_series(
    NOW() - INTERVAL '1 day' * days_back,
    NOW(),
    INTERVAL '1 day'
  ) AS date_series(date)
  LEFT JOIN profiles p ON DATE(p.created_at) = DATE(date_series.date)
  LEFT JOIN stories s ON DATE(s.created_at) = DATE(date_series.date)
  GROUP BY date_series.date
  ORDER BY date_series.date DESC;
END;
$function$;

-- Genre distribution function
CREATE OR REPLACE FUNCTION public.admin_get_genre_distribution()
RETURNS TABLE(
  genre text,
  count bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  total_stories bigint;
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT COUNT(*) INTO total_stories FROM stories WHERE status = 'completed';

  RETURN QUERY
  SELECT
    s.genre,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_stories, 0)), 2) as percentage
  FROM stories s
  WHERE s.status = 'completed'
  GROUP BY s.genre
  ORDER BY count DESC;
END;
$function$;

-- Age group distribution function
CREATE OR REPLACE FUNCTION public.admin_get_age_group_distribution()
RETURNS TABLE(
  age_group text,
  count bigint,
  percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  total_stories bigint;
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  SELECT COUNT(*) INTO total_stories FROM stories WHERE status = 'completed';

  RETURN QUERY
  SELECT
    s.age_group,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / NULLIF(total_stories, 0)), 2) as percentage
  FROM stories s
  WHERE s.status = 'completed'
  GROUP BY s.age_group
  ORDER BY count DESC;
END;
$function$;

-- Top users function
CREATE OR REPLACE FUNCTION public.admin_get_top_users(limit_count integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid,
  user_name text,
  stories_count bigint,
  credits_used bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    p.id as user_id,
    COALESCE(p.display_name, p.full_name, p.email) as user_name,
    COUNT(s.id) as stories_count,
    COALESCE(SUM(s.credits_used), 0) as credits_used
  FROM profiles p
  LEFT JOIN stories s ON p.id = s.user_id
  GROUP BY p.id, p.display_name, p.full_name, p.email
  ORDER BY stories_count DESC, credits_used DESC
  LIMIT limit_count;
END;
$function$;

-- Featured performance function
CREATE OR REPLACE FUNCTION public.admin_get_featured_performance()
RETURNS TABLE(
  story_id uuid,
  title text,
  views bigint,
  author text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    fs.story_id,
    s.title,
    COALESCE(fs.view_count, 0) as views,
    COALESCE(p.display_name, p.full_name, p.email) as author
  FROM featured_stories fs
  JOIN stories s ON fs.story_id = s.id
  LEFT JOIN profiles p ON s.user_id = p.id
  WHERE fs.is_active = true
  ORDER BY fs.view_count DESC;
END;
$function$;

-- Audit log function
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(limit_count integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  action text,
  resource_type text,
  resource_id text,
  details jsonb,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return a simplified audit log from credit transactions for now
  RETURN QUERY
  SELECT
    ct.id,
    ct.user_id,
    ct.transaction_type as action,
    'credit_transaction' as resource_type,
    ct.reference_id as resource_id,
    ct.metadata as details,
    ct.created_at
  FROM credit_transactions ct
  ORDER BY ct.created_at DESC
  LIMIT limit_count;
END;
$function$;

-- Get all stories function
CREATE OR REPLACE FUNCTION public.admin_get_all_stories(limit_count integer DEFAULT 50)
RETURNS TABLE(
  id uuid,
  title text,
  author_name text,
  status text,
  visibility text,
  created_at timestamp with time zone,
  credits_used integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    COALESCE(p.display_name, p.full_name, p.email) as author_name,
    s.status,
    s.visibility,
    s.created_at,
    s.credits_used
  FROM stories s
  LEFT JOIN profiles p ON s.user_id = p.id
  ORDER BY s.created_at DESC
  LIMIT limit_count;
END;
$function$;

-- Get content flags function (placeholder since we don't have a flags table yet)
CREATE OR REPLACE FUNCTION public.admin_get_content_flags()
RETURNS TABLE(
  id uuid,
  story_id uuid,
  flag_type text,
  reason text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return empty for now since we don't have a content flags table
  RETURN QUERY
  SELECT
    NULL::uuid as id,
    NULL::uuid as story_id,
    NULL::text as flag_type,
    NULL::text as reason,
    NULL::timestamp with time zone as created_at
  WHERE false;
END;
$function$;

-- Update story visibility function
CREATE OR REPLACE FUNCTION public.admin_update_story_visibility(p_story_id uuid, p_visibility text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  UPDATE stories
  SET visibility = p_visibility, updated_at = NOW()
  WHERE id = p_story_id;

  RETURN FOUND;
END;
$function$;

-- Delete story function
CREATE OR REPLACE FUNCTION public.admin_delete_story(p_story_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Delete story segments first
  DELETE FROM story_segments WHERE story_id = p_story_id;
  
  -- Delete the story
  DELETE FROM stories WHERE id = p_story_id;

  RETURN FOUND;
END;
$function$;