


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."add_credits"("user_uuid" "uuid", "credits_to_add" integer, "description_text" "text", "ref_id" "text" DEFAULT NULL::"text", "ref_type" "text" DEFAULT NULL::"text", "transaction_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."add_credits"("user_uuid" "uuid", "credits_to_add" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_credits_rpc"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."add_credits_rpc"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_story"("p_story_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_delete_story"("p_story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_feature_story"("p_story_id" "uuid", "p_priority" integer DEFAULT 1, "p_featured_until" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_feature_story"("p_story_id" "uuid", "p_priority" integer, "p_featured_until" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_age_group_distribution"() RETURNS TABLE("age_group" "text", "count" bigint, "percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_age_group_distribution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_all_stories"("limit_count" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "title" "text", "author_name" "text", "status" "text", "visibility" "text", "created_at" timestamp with time zone, "credits_used" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_all_stories"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_analytics_overview"() RETURNS TABLE("total_users" bigint, "total_stories" bigint, "total_credits_used" bigint, "active_users_30d" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_analytics_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_audit_logs"("limit_count" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "user_id" "uuid", "action" "text", "resource_type" "text", "resource_id" "text", "details" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_audit_logs"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_completed_stories"("limit_count" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "title" "text", "author_name" "text", "genre" "text", "age_group" "text", "created_at" timestamp with time zone, "is_featured" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_completed_stories"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_content_flags"() RETURNS TABLE("id" "uuid", "story_id" "uuid", "flag_type" "text", "reason" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_content_flags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_daily_usage"("days_back" integer DEFAULT 30) RETURNS TABLE("date" "text", "users" bigint, "stories" bigint, "credits" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_daily_usage"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_featured_performance"() RETURNS TABLE("story_id" "uuid", "title" "text", "views" bigint, "author" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_featured_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_featured_stories"() RETURNS TABLE("id" "uuid", "story_id" "uuid", "title" "text", "author_name" "text", "featured_by" "uuid", "priority" integer, "is_active" boolean, "featured_until" timestamp with time zone, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_featured_stories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_genre_distribution"() RETURNS TABLE("genre" "text", "count" bigint, "percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_genre_distribution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_top_users"("limit_count" integer DEFAULT 10) RETURNS TABLE("user_id" "uuid", "user_name" "text", "stories_count" bigint, "credits_used" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_get_top_users"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_unfeature_story"("p_story_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_unfeature_story"("p_story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_featured_priority"("p_story_id" "uuid", "p_priority" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_update_featured_priority"("p_story_id" "uuid", "p_priority" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_story_visibility"("p_story_id" "uuid", "p_visibility" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."admin_update_story_visibility"("p_story_id" "uuid", "p_visibility" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_operation_type" "text", "p_max_requests" integer DEFAULT 10, "p_window_minutes" integer DEFAULT 60) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  window_start_time timestamp with time zone;
  current_count integer;
BEGIN
  -- Calculate window start time
  window_start_time := date_trunc('minute', NOW()) - 
    (EXTRACT(minute FROM NOW())::integer % p_window_minutes) * INTERVAL '1 minute';
  
  -- Get current count for this window
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND operation_type = p_operation_type
    AND window_start >= window_start_time;
  
  -- Check if limit exceeded
  IF current_count >= p_max_requests THEN
    -- Log rate limit violation
    PERFORM log_security_event(
      'rate_limit',
      auth.uid(),
      jsonb_build_object(
        'identifier', p_identifier,
        'operation_type', p_operation_type,
        'current_count', current_count,
        'max_requests', p_max_requests
      )
    );
    RETURN false;
  END IF;
  
  -- Increment counter
  INSERT INTO public.rate_limits (identifier, operation_type, window_start)
  VALUES (p_identifier, p_operation_type, window_start_time)
  ON CONFLICT (identifier, operation_type, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_operation_type" "text", "p_max_requests" integer, "p_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_rate_limits"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete security audit logs older than 90 days (keep for compliance)
  DELETE FROM public.security_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_rate_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credits"("user_uuid" "uuid", "amount" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."deduct_credits"("user_uuid" "uuid", "amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."deduct_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_credit_transactions"("limit_count" integer DEFAULT 10, "user_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "amount" integer, "type" "text", "description" "text", "metadata" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_credit_transactions"("limit_count" integer, "user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_month_usage"() RETURNS TABLE("stories_created" integer, "voice_minutes_used" integer, "credits_used" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_current_month_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_featured_stories"("limit_count" integer DEFAULT 10) RETURNS TABLE("story_id" "uuid", "title" "text", "description" "text", "author_name" "text", "genre" "text", "age_group" "text", "cover_image_url" "text", "story_position" integer, "created_at" timestamp with time zone, "preview_image_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
    fs.priority as story_position,
    fs.created_at,
    COALESCE(
      s.cover_image,
      (SELECT ss.image_url 
       FROM public.story_segments ss 
       WHERE ss.story_id = s.id 
         AND ss.image_url IS NOT NULL 
       ORDER BY ss.segment_number ASC 
       LIMIT 1)
    ) as preview_image_url
  FROM public.featured_stories fs
  JOIN public.stories s ON fs.story_id = s.id
  LEFT JOIN public.profiles p ON s.author_id = p.id
  WHERE fs.is_active = true
    AND s.status = 'completed'
    AND s.visibility = 'public'
  ORDER BY fs.priority DESC, fs.created_at DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_featured_stories"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_feedback_stats"() RETURNS TABLE("total_feedback" bigint, "new_feedback" bigint, "in_progress_feedback" bigint, "resolved_feedback" bigint, "feedback_by_type" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_feedback_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_live_stats"() RETURNS TABLE("founder_count" bigint, "total_users" bigint, "total_stories" bigint, "completed_stories" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id) FILTER (WHERE p.is_beta_user = true)::bigint as founder_count,
    COUNT(DISTINCT p.id)::bigint as total_users,
    COUNT(DISTINCT s.id)::bigint as total_stories,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed')::bigint as completed_stories
  FROM profiles p
  LEFT JOIN stories s ON s.user_id = p.id OR s.author_id = p.id;
END;
$$;


ALTER FUNCTION "public"."get_live_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_prompt_template"("template_key" "text", "language_code" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  template_content text;
  fallback_content text;
BEGIN
  -- If no language specified, use user's preference
  IF language_code IS NULL THEN
    language_code := get_user_language();
  END IF;
  
  -- Try to get template in requested language
  SELECT apt.template_content INTO template_content
  FROM public.ai_prompt_templates apt
  WHERE apt.template_key = get_prompt_template.template_key
  AND apt.language_code = get_prompt_template.language_code
  AND apt.is_active = true;
  
  -- If not found, fallback to English
  IF template_content IS NULL THEN
    SELECT apt.template_content INTO fallback_content
    FROM public.ai_prompt_templates apt
    WHERE apt.template_key = get_prompt_template.template_key
    AND apt.language_code = 'en'
    AND apt.is_active = true;
    
    RETURN fallback_content;
  END IF;
  
  RETURN template_content;
END;
$$;


ALTER FUNCTION "public"."get_prompt_template"("template_key" "text", "language_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_credits"("user_uuid" "uuid") RETURNS TABLE("current_balance" integer, "total_earned" integer, "total_spent" integer, "last_monthly_refresh" timestamp with time zone, "can_refresh" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.current_balance,
    uc.total_earned,
    uc.total_spent,
    uc.last_monthly_refresh,
    (uc.last_monthly_refresh IS NULL OR 
     uc.last_monthly_refresh < NOW() - INTERVAL '30 days') AS can_refresh
  FROM public.user_credits uc
  WHERE uc.user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_user_credits"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_feedback"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "type" "text", "title" "text", "description" "text", "rating" integer, "status" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_user_feedback"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_language"("user_uuid" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_lang text;
BEGIN
  SELECT preferred_language INTO user_lang
  FROM public.profiles
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_lang, 'en');
END;
$$;


ALTER FUNCTION "public"."get_user_language"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_transactions"("p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "amount" integer, "type" "text", "description" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.id,
    ct.amount,
    ct.type,
    COALESCE(ct.description, ct.type) as description,
    ct.created_at
  FROM public.credit_transactions ct
  WHERE ct.user_id = auth.uid()
  ORDER BY ct.created_at DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_user_transactions"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_visibility_settings"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("setting_key" "text", "setting_value" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_visibility_settings"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("check_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if user has the specified role using secure function
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = check_role
  );
END;
$$;


ALTER FUNCTION "public"."has_role"("check_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_featured_view_count"("p_story_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Update view count in featured_stories table if it exists
  UPDATE public.featured_stories 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE story_id = p_story_id;
END;
$$;


ALTER FUNCTION "public"."increment_featured_view_count"("p_story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("event_type" "text", "user_uuid" "uuid" DEFAULT "auth"."uid"(), "event_details" "jsonb" DEFAULT '{}'::"jsonb", "ip_address" "text" DEFAULT NULL::"text", "user_agent" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  log_id uuid;
BEGIN
  -- Insert security event log
  INSERT INTO public.security_audit_log (
    id,
    event_type,
    user_id,
    event_details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    gen_random_uuid(),
    event_type,
    user_uuid,
    event_details,
    ip_address,
    user_agent,
    NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;


ALTER FUNCTION "public"."log_security_event"("event_type" "text", "user_uuid" "uuid", "event_details" "jsonb", "ip_address" "text", "user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_visibility_setting"("p_setting_key" "text", "p_setting_value" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.visibility_settings (user_id, setting_key, setting_value)
  VALUES (auth.uid(), p_setting_key, p_setting_value)
  ON CONFLICT (user_id, setting_key)
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."set_visibility_setting"("p_setting_key" "text", "p_setting_value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_credits"("user_uuid" "uuid", "credits_to_spend" integer, "description_text" "text", "ref_id" "text" DEFAULT NULL::"text", "ref_type" "text" DEFAULT NULL::"text", "transaction_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
  update_result INTEGER;
BEGIN
  -- Get current balance (without lock for better performance)
  SELECT current_balance INTO current_credits
  FROM public.user_credits
  WHERE user_id = user_uuid;
  
  -- Check if user has enough credits
  IF current_credits < credits_to_spend THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_credits - credits_to_spend;
  
  -- Use atomic update with concurrent safety
  UPDATE public.user_credits
  SET 
    current_balance = current_balance - credits_to_spend,
    total_spent = total_spent + credits_to_spend,
    updated_at = NOW()
  WHERE user_id = user_uuid 
    AND current_balance >= credits_to_spend;
  
  GET DIAGNOSTICS update_result = ROW_COUNT;
  
  -- If update failed due to insufficient credits, return false
  IF update_result = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Record transaction with simple approach (no duplicate check for performance)
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
    'spend',
    -credits_to_spend,
    new_balance,
    description_text,
    ref_id,
    ref_type,
    transaction_metadata
  );
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."spend_credits"("user_uuid" "uuid", "credits_to_spend" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_story_cover_image"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only update if story doesn't have a cover image yet
  IF EXISTS (
    SELECT 1 FROM stories
    WHERE id = NEW.story_id
    AND (cover_image IS NULL OR cover_image = '')
  ) AND NEW.image_url IS NOT NULL THEN
    UPDATE stories
    SET cover_image = NEW.image_url,
        updated_at = NOW()
    WHERE id = NEW.story_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_story_cover_image"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_characters_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_characters_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_prompt_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text" NOT NULL,
    "language_code" "text" NOT NULL,
    "template_content" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "category" "text" DEFAULT 'story'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_prompt_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "transaction_type" "text",
    "amount" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "description" "text",
    "reference_id" "text",
    "reference_type" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" "text" DEFAULT 'purchase'::"text" NOT NULL,
    "stripe_payment_intent" "text",
    CONSTRAINT "credit_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['earn'::"text", 'spend'::"text", 'refund'::"text", 'monthly_refresh'::"text", 'purchase'::"text", 'bonus'::"text"]))),
    CONSTRAINT "credit_transactions_type_check" CHECK (("type" = ANY (ARRAY['purchase'::"text", 'spent'::"text", 'refund'::"text", 'bonus'::"text", 'subscription_activated'::"text", 'subscription_cancelled'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."featured_stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "featured_by" "uuid" NOT NULL,
    "reason" "text",
    "priority" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "featured_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "view_count" integer DEFAULT 0
);


ALTER TABLE "public"."featured_stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."languages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "native_name" "text" NOT NULL,
    "ai_model_config" "jsonb" DEFAULT '{}'::"jsonb",
    "prompt_templates" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."languages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "credits" integer DEFAULT 10,
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_name" "text",
    "bio" "text",
    "is_admin" boolean DEFAULT false,
    "preferred_language" "text" DEFAULT 'en'::"text",
    "is_beta_user" boolean DEFAULT false,
    "beta_joined_at" timestamp with time zone,
    "founder_status" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."is_beta_user" IS 'Whether user signed up during beta period';



COMMENT ON COLUMN "public"."profiles"."beta_joined_at" IS 'When user joined during beta period';



COMMENT ON COLUMN "public"."profiles"."founder_status" IS 'Founder badge status: founder, early_adopter, or null';



CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "identifier" "text" NOT NULL,
    "operation_type" "text" NOT NULL,
    "request_count" integer DEFAULT 1 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "story_id" "uuid",
    "last_read_at" timestamp with time zone DEFAULT "now"(),
    "progress" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "user_id" "uuid",
    "event_details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "security_audit_log_event_type_check" CHECK (("event_type" = ANY (ARRAY['auth_failure'::"text", 'rate_limit'::"text", 'validation_error'::"text", 'suspicious_activity'::"text", 'admin_action'::"text"])))
);


ALTER TABLE "public"."security_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "prompt" "text",
    "story_type" "text" DEFAULT 'short'::"text",
    "age_group" "text" DEFAULT '7-9'::"text",
    "genre" "text" DEFAULT 'fantasy'::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "is_public" boolean DEFAULT false,
    "metadata" "jsonb",
    "credits_used" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "author_id" "uuid",
    "cover_image" "text",
    "visibility" "text" DEFAULT 'private'::"text",
    "is_complete" boolean DEFAULT false,
    "full_story_audio_url" "text",
    "audio_generation_status" "text" DEFAULT 'pending'::"text",
    "selected_voice_id" "text",
    "selected_voice_name" "text",
    "is_completed" boolean DEFAULT false,
    "thumbnail_url" "text",
    "story_mode" "text",
    "cover_image_url" "text",
    "target_age" "text",
    "language_code" "text" DEFAULT 'en'::"text",
    "original_language_code" "text",
    CONSTRAINT "stories_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'unlisted'::"text"])))
);


ALTER TABLE "public"."stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid",
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_content_i18n" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "language_code" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "content" "jsonb" DEFAULT '{}'::"jsonb",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_content_i18n" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "age_group" "text",
    "genres" "text"[],
    "selected_characters" "uuid"[],
    "selected_seed" "jsonb",
    "custom_seed" "text",
    "current_step" integer DEFAULT 1,
    "language_code" "text" DEFAULT 'en'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_segments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "story_id" "uuid",
    "segment_number" integer NOT NULL,
    "content" "text",
    "image_prompt" "text",
    "image_url" "text",
    "audio_url" "text",
    "is_ending" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "image_generation_status" "text" DEFAULT 'pending'::"text",
    "audio_generation_status" "text" DEFAULT 'pending'::"text",
    "is_end" boolean DEFAULT false,
    "segment_text" "text",
    "choices" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "story_segments_content_not_empty" CHECK ((("content" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "content")) > 0)))
);


ALTER TABLE "public"."story_segments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_segments_i18n" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "segment_id" "uuid" NOT NULL,
    "language_code" "text" NOT NULL,
    "content" "text",
    "choices" "jsonb" DEFAULT '[]'::"jsonb",
    "audio_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_segments_i18n" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tier_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tier_name" "text" NOT NULL,
    "story_limit" integer,
    "voice_minutes_per_month" integer,
    "credits_per_month" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tier_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "character_type" "text" DEFAULT 'human'::"text",
    "personality_traits" "text"[],
    "backstory" "text",
    "image_url" "text",
    "is_public" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "current_balance" integer DEFAULT 10,
    "total_earned" integer DEFAULT 10,
    "total_spent" integer DEFAULT 0,
    "last_monthly_refresh" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "feedback_type" "text" NOT NULL,
    "subject" "text",
    "message" "text" NOT NULL,
    "page_url" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'new'::"text",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_feedback" IS 'User feedback submissions from global feedback button';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'premium_plus'::"text", 'premium'::"text", 'free'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visibility_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."visibility_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_prompt_templates"
    ADD CONSTRAINT "ai_prompt_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_prompt_templates"
    ADD CONSTRAINT "ai_prompt_templates_template_key_language_code_key" UNIQUE ("template_key", "language_code");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."featured_stories"
    ADD CONSTRAINT "featured_stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."featured_stories"
    ADD CONSTRAINT "featured_stories_story_id_is_active_key" UNIQUE ("story_id", "is_active");



ALTER TABLE ONLY "public"."featured_stories"
    ADD CONSTRAINT "featured_stories_story_id_unique" UNIQUE ("story_id");



ALTER TABLE ONLY "public"."languages"
    ADD CONSTRAINT "languages_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."languages"
    ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_identifier_operation_type_window_start_key" UNIQUE ("identifier", "operation_type", "window_start");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_history"
    ADD CONSTRAINT "reading_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_history"
    ADD CONSTRAINT "reading_history_user_id_story_id_key" UNIQUE ("user_id", "story_id");



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_analytics"
    ADD CONSTRAINT "story_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_content_i18n"
    ADD CONSTRAINT "story_content_i18n_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_content_i18n"
    ADD CONSTRAINT "story_content_i18n_story_id_language_code_key" UNIQUE ("story_id", "language_code");



ALTER TABLE ONLY "public"."story_drafts"
    ADD CONSTRAINT "story_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_drafts"
    ADD CONSTRAINT "story_drafts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."story_segments_i18n"
    ADD CONSTRAINT "story_segments_i18n_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_segments_i18n"
    ADD CONSTRAINT "story_segments_i18n_segment_id_language_code_key" UNIQUE ("segment_id", "language_code");



ALTER TABLE ONLY "public"."story_segments"
    ADD CONSTRAINT "story_segments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_segments"
    ADD CONSTRAINT "story_segments_story_id_segment_number_key" UNIQUE ("story_id", "segment_number");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_category_key_key" UNIQUE ("category", "key");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tier_limits"
    ADD CONSTRAINT "tier_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tier_limits"
    ADD CONSTRAINT "tier_limits_tier_name_key" UNIQUE ("tier_name");



ALTER TABLE ONLY "public"."user_characters"
    ADD CONSTRAINT "user_characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."visibility_settings"
    ADD CONSTRAINT "visibility_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visibility_settings"
    ADD CONSTRAINT "visibility_settings_user_id_setting_key_key" UNIQUE ("user_id", "setting_key");



CREATE INDEX "idx_ai_templates_key_language" ON "public"."ai_prompt_templates" USING "btree" ("template_key", "language_code");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_transactions_stripe" ON "public"."credit_transactions" USING "btree" ("stripe_payment_intent");



CREATE INDEX "idx_credit_transactions_type" ON "public"."credit_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_credit_transactions_user" ON "public"."credit_transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_featured_stories_active" ON "public"."featured_stories" USING "btree" ("is_active", "priority" DESC);



CREATE INDEX "idx_feedback_status" ON "public"."user_feedback" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_feedback_type" ON "public"."user_feedback" USING "btree" ("feedback_type", "created_at" DESC);



CREATE INDEX "idx_feedback_user_created" ON "public"."user_feedback" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_profiles_beta_status" ON "public"."profiles" USING "btree" ("is_beta_user", "beta_joined_at");



CREATE INDEX "idx_profiles_display_name" ON "public"."profiles" USING "btree" ("display_name");



CREATE INDEX "idx_profiles_is_admin" ON "public"."profiles" USING "btree" ("is_admin");



CREATE INDEX "idx_profiles_preferred_language" ON "public"."profiles" USING "btree" ("preferred_language");



CREATE INDEX "idx_profiles_stripe_customer" ON "public"."profiles" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_profiles_subscription" ON "public"."profiles" USING "btree" ("subscription_tier", "subscription_status");



CREATE INDEX "idx_security_audit_log_created_at" ON "public"."security_audit_log" USING "btree" ("created_at");



CREATE INDEX "idx_security_audit_log_event_type" ON "public"."security_audit_log" USING "btree" ("event_type");



CREATE INDEX "idx_security_audit_log_user_id" ON "public"."security_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_stories_audio_status" ON "public"."stories" USING "btree" ("audio_generation_status");



CREATE INDEX "idx_stories_author_id" ON "public"."stories" USING "btree" ("author_id");



CREATE INDEX "idx_stories_created_at" ON "public"."stories" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_stories_created_at_desc" ON "public"."stories" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_stories_genre_visibility" ON "public"."stories" USING "btree" ("genre", "visibility") WHERE ("visibility" = 'public'::"text");



CREATE INDEX "idx_stories_is_complete" ON "public"."stories" USING "btree" ("is_complete");



CREATE INDEX "idx_stories_language_code" ON "public"."stories" USING "btree" ("language_code");



CREATE INDEX "idx_stories_public" ON "public"."stories" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_stories_status" ON "public"."stories" USING "btree" ("status");



CREATE INDEX "idx_stories_status_visibility" ON "public"."stories" USING "btree" ("status", "visibility");



CREATE INDEX "idx_stories_user" ON "public"."stories" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_stories_user_created" ON "public"."stories" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_stories_user_id" ON "public"."stories" USING "btree" ("user_id");



CREATE INDEX "idx_stories_visibility" ON "public"."stories" USING "btree" ("visibility");



CREATE INDEX "idx_stories_visibility_created_at" ON "public"."stories" USING "btree" ("visibility", "created_at" DESC);



CREATE INDEX "idx_stories_visibility_status_created" ON "public"."stories" USING "btree" ("visibility", "status", "created_at" DESC) WHERE ("visibility" = 'public'::"text");



CREATE INDEX "idx_story_content_i18n_story_language" ON "public"."story_content_i18n" USING "btree" ("story_id", "language_code");



CREATE INDEX "idx_story_drafts_updated_at" ON "public"."story_drafts" USING "btree" ("updated_at");



CREATE INDEX "idx_story_drafts_user_id" ON "public"."story_drafts" USING "btree" ("user_id");



CREATE INDEX "idx_story_segments_i18n_segment_language" ON "public"."story_segments_i18n" USING "btree" ("segment_id", "language_code");



CREATE INDEX "idx_story_segments_image_status" ON "public"."story_segments" USING "btree" ("image_generation_status");



CREATE INDEX "idx_story_segments_story" ON "public"."story_segments" USING "btree" ("story_id", "segment_number");



CREATE INDEX "idx_story_segments_story_id" ON "public"."story_segments" USING "btree" ("story_id");



CREATE INDEX "idx_story_segments_story_number" ON "public"."story_segments" USING "btree" ("story_id", "segment_number");



CREATE INDEX "idx_story_segments_story_segment" ON "public"."story_segments" USING "btree" ("story_id", "segment_number");



CREATE INDEX "idx_user_credits_user" ON "public"."user_credits" USING "btree" ("user_id");



CREATE INDEX "idx_user_credits_user_id" ON "public"."user_credits" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "auto_update_story_cover" AFTER INSERT OR UPDATE OF "image_url" ON "public"."story_segments" FOR EACH ROW EXECUTE FUNCTION "public"."update_story_cover_image"();



CREATE OR REPLACE TRIGGER "update_user_characters_updated_at" BEFORE UPDATE ON "public"."user_characters" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_characters_updated_at"();



ALTER TABLE ONLY "public"."ai_prompt_templates"
    ADD CONSTRAINT "ai_prompt_templates_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."featured_stories"
    ADD CONSTRAINT "featured_stories_featured_by_fkey" FOREIGN KEY ("featured_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."featured_stories"
    ADD CONSTRAINT "featured_stories_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_preferred_language_fkey" FOREIGN KEY ("preferred_language") REFERENCES "public"."languages"("code");



ALTER TABLE ONLY "public"."reading_history"
    ADD CONSTRAINT "reading_history_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_history"
    ADD CONSTRAINT "reading_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_original_language_code_fkey" FOREIGN KEY ("original_language_code") REFERENCES "public"."languages"("code");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_analytics"
    ADD CONSTRAINT "story_analytics_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_analytics"
    ADD CONSTRAINT "story_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."story_content_i18n"
    ADD CONSTRAINT "story_content_i18n_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code");



ALTER TABLE ONLY "public"."story_content_i18n"
    ADD CONSTRAINT "story_content_i18n_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_drafts"
    ADD CONSTRAINT "story_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_segments_i18n"
    ADD CONSTRAINT "story_segments_i18n_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code");



ALTER TABLE ONLY "public"."story_segments_i18n"
    ADD CONSTRAINT "story_segments_i18n_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."story_segments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_segments"
    ADD CONSTRAINT "story_segments_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_characters"
    ADD CONSTRAINT "user_characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visibility_settings"
    ADD CONSTRAINT "visibility_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage rate limits" ON "public"."rate_limits" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Admin can view all security logs" ON "public"."security_audit_log" FOR SELECT USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Admin settings access" ON "public"."admin_settings" USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'premium_plus'::"text")));



CREATE POLICY "Admins can manage featured stories" ON "public"."featured_stories" USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'premium_plus'::"text")));



CREATE POLICY "Admins can update all feedback" ON "public"."user_feedback" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can update any profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all feedback" ON "public"."user_feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text")))));



CREATE POLICY "Anyone can view active featured stories" ON "public"."featured_stories" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."stories" "s"
  WHERE (("s"."id" = "featured_stories"."story_id") AND ("s"."visibility" = 'public'::"text") AND ("s"."status" = 'completed'::"text"))))));



CREATE POLICY "Anyone can view featured stories" ON "public"."featured_stories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view tier limits" ON "public"."tier_limits" FOR SELECT USING (true);



CREATE POLICY "Authors can request featuring their stories" ON "public"."featured_stories" FOR INSERT WITH CHECK ((("auth"."uid"() = "featured_by") AND (EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "featured_stories"."story_id") AND ("stories"."author_id" = "auth"."uid"()) AND ("stories"."status" = 'completed'::"text") AND ("stories"."visibility" = 'public'::"text"))))));



CREATE POLICY "Featured stories admin write" ON "public"."featured_stories" USING (((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text") OR (("auth"."jwt"() ->> 'role'::"text") = 'premium_plus'::"text")));



CREATE POLICY "Languages are viewable by everyone" ON "public"."languages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Only admins can access system config" ON "public"."system_config" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text")))));



CREATE POLICY "Prompt templates are viewable by everyone" ON "public"."ai_prompt_templates" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can read public stories" ON "public"."stories" FOR SELECT USING (("visibility" = 'public'::"text"));



CREATE POLICY "Public can view segments of public stories" ON "public"."story_segments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_segments"."story_id") AND ("stories"."is_public" = true)))));



CREATE POLICY "Public can view segments of public stories only" ON "public"."story_segments" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."stories" "s"
  WHERE (("s"."id" = "story_segments"."story_id") AND ("s"."visibility" = 'public'::"text") AND ("s"."status" = 'completed'::"text")))) OR (EXISTS ( SELECT 1
   FROM "public"."stories" "s"
  WHERE (("s"."id" = "story_segments"."story_id") AND (("s"."user_id" = "auth"."uid"()) OR ("s"."author_id" = "auth"."uid"())))))));



CREATE POLICY "Public stories are viewable by everyone" ON "public"."stories" FOR SELECT USING (("visibility" = 'public'::"text"));



CREATE POLICY "System can insert security events" ON "public"."security_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "User roles access" ON "public"."user_roles" USING ((("auth"."uid"() = "user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can create own stories" ON "public"."stories" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own characters" ON "public"."user_characters" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own stories" ON "public"."stories" FOR INSERT WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own stories" ON "public"."stories" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own characters" ON "public"."user_characters" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own drafts" ON "public"."story_drafts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own stories" ON "public"."stories" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can insert feedback" ON "public"."user_feedback" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert segments for their stories" ON "public"."story_segments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_segments"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own analytics" ON "public"."story_analytics" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own drafts" ON "public"."story_drafts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own reading history" ON "public"."reading_history" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own visibility settings" ON "public"."visibility_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their segment content" ON "public"."story_segments_i18n" USING ((EXISTS ( SELECT 1
   FROM ("public"."story_segments" "ss"
     JOIN "public"."stories" "s" ON (("ss"."story_id" = "s"."id")))
  WHERE (("ss"."id" = "story_segments_i18n"."segment_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their story content" ON "public"."story_content_i18n" USING ((EXISTS ( SELECT 1
   FROM "public"."stories" "s"
  WHERE (("s"."id" = "story_content_i18n"."story_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own stories" ON "public"."stories" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update segments of their stories" ON "public"."story_segments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_segments"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own characters" ON "public"."user_characters" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own drafts" ON "public"."story_drafts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own feedback" ON "public"."user_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own stories" ON "public"."stories" FOR UPDATE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can view accessible stories" ON "public"."stories" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("user_id" = "auth"."uid"()) OR ("author_id" = "auth"."uid"())));



CREATE POLICY "Users can view own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view segment content" ON "public"."story_segments_i18n" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."story_segments" "ss"
     JOIN "public"."stories" "s" ON (("ss"."story_id" = "s"."id")))
  WHERE (("ss"."id" = "story_segments_i18n"."segment_id") AND (("s"."user_id" = "auth"."uid"()) OR ("s"."visibility" = 'public'::"text"))))));



CREATE POLICY "Users can view segments of accessible stories" ON "public"."story_segments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_segments"."story_id") AND (("stories"."user_id" = "auth"."uid"()) OR ("stories"."is_public" = true))))));



CREATE POLICY "Users can view segments of their stories" ON "public"."story_segments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_segments"."story_id") AND ("stories"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view story content" ON "public"."story_content_i18n" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."stories" "s"
  WHERE (("s"."id" = "story_content_i18n"."story_id") AND (("s"."user_id" = "auth"."uid"()) OR ("s"."visibility" = 'public'::"text"))))));



CREATE POLICY "Users can view their own analytics" ON "public"."story_analytics" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own characters" ON "public"."user_characters" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own drafts" ON "public"."story_drafts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own feedback" ON "public"."user_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own reading history" ON "public"."reading_history" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own security events" ON "public"."security_audit_log" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own stories" ON "public"."stories" FOR SELECT USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own visibility settings" ON "public"."visibility_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_prompt_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."featured_stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."languages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_content_i18n" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_segments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_segments_i18n" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tier_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visibility_settings" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_credits"("user_uuid" "uuid", "credits_to_add" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_credits"("user_uuid" "uuid", "credits_to_add" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_credits"("user_uuid" "uuid", "credits_to_add" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_credits_rpc"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_credits_rpc"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_credits_rpc"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_story"("p_story_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_story"("p_story_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_story"("p_story_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_feature_story"("p_story_id" "uuid", "p_priority" integer, "p_featured_until" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_feature_story"("p_story_id" "uuid", "p_priority" integer, "p_featured_until" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_feature_story"("p_story_id" "uuid", "p_priority" integer, "p_featured_until" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_age_group_distribution"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_age_group_distribution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_age_group_distribution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_all_stories"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_all_stories"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_all_stories"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_analytics_overview"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_analytics_overview"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_analytics_overview"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_audit_logs"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_audit_logs"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_audit_logs"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_completed_stories"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_completed_stories"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_completed_stories"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_content_flags"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_content_flags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_content_flags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_daily_usage"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_daily_usage"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_daily_usage"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_featured_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_featured_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_featured_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_featured_stories"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_featured_stories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_featured_stories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_genre_distribution"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_genre_distribution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_genre_distribution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_top_users"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_top_users"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_top_users"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_unfeature_story"("p_story_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_unfeature_story"("p_story_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_unfeature_story"("p_story_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_featured_priority"("p_story_id" "uuid", "p_priority" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_featured_priority"("p_story_id" "uuid", "p_priority" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_featured_priority"("p_story_id" "uuid", "p_priority" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_story_visibility"("p_story_id" "uuid", "p_visibility" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_story_visibility"("p_story_id" "uuid", "p_visibility" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_story_visibility"("p_story_id" "uuid", "p_visibility" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_operation_type" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_operation_type" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_identifier" "text", "p_operation_type" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_rate_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credits"("user_uuid" "uuid", "amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credits"("user_uuid" "uuid", "amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits"("user_uuid" "uuid", "amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits_atomic"("p_user_id" "uuid", "p_amount" integer, "p_operation_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_credit_transactions"("limit_count" integer, "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_credit_transactions"("limit_count" integer, "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_credit_transactions"("limit_count" integer, "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_month_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_month_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_month_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_featured_stories"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_featured_stories"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_featured_stories"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_feedback_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_feedback_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feedback_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_live_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_live_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_live_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_prompt_template"("template_key" "text", "language_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_prompt_template"("template_key" "text", "language_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_prompt_template"("template_key" "text", "language_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_credits"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_credits"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_credits"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_feedback"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_feedback"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_feedback"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_language"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_language"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_language"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_transactions"("p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_transactions"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_transactions"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_visibility_settings"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_visibility_settings"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_visibility_settings"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("check_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("check_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("check_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_featured_view_count"("p_story_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_featured_view_count"("p_story_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_featured_view_count"("p_story_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "user_uuid" "uuid", "event_details" "jsonb", "ip_address" "text", "user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "user_uuid" "uuid", "event_details" "jsonb", "ip_address" "text", "user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("event_type" "text", "user_uuid" "uuid", "event_details" "jsonb", "ip_address" "text", "user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_visibility_setting"("p_setting_key" "text", "p_setting_value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."set_visibility_setting"("p_setting_key" "text", "p_setting_value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_visibility_setting"("p_setting_key" "text", "p_setting_value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."spend_credits"("user_uuid" "uuid", "credits_to_spend" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."spend_credits"("user_uuid" "uuid", "credits_to_spend" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_credits"("user_uuid" "uuid", "credits_to_spend" integer, "description_text" "text", "ref_id" "text", "ref_type" "text", "transaction_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_story_cover_image"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_story_cover_image"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_story_cover_image"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_characters_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_characters_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_characters_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."ai_prompt_templates" TO "anon";
GRANT ALL ON TABLE "public"."ai_prompt_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_prompt_templates" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."featured_stories" TO "anon";
GRANT ALL ON TABLE "public"."featured_stories" TO "authenticated";
GRANT ALL ON TABLE "public"."featured_stories" TO "service_role";



GRANT ALL ON TABLE "public"."languages" TO "anon";
GRANT ALL ON TABLE "public"."languages" TO "authenticated";
GRANT ALL ON TABLE "public"."languages" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."reading_history" TO "anon";
GRANT ALL ON TABLE "public"."reading_history" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_history" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."stories" TO "anon";
GRANT ALL ON TABLE "public"."stories" TO "authenticated";
GRANT ALL ON TABLE "public"."stories" TO "service_role";



GRANT ALL ON TABLE "public"."story_analytics" TO "anon";
GRANT ALL ON TABLE "public"."story_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."story_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."story_content_i18n" TO "anon";
GRANT ALL ON TABLE "public"."story_content_i18n" TO "authenticated";
GRANT ALL ON TABLE "public"."story_content_i18n" TO "service_role";



GRANT ALL ON TABLE "public"."story_drafts" TO "anon";
GRANT ALL ON TABLE "public"."story_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."story_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."story_segments" TO "anon";
GRANT ALL ON TABLE "public"."story_segments" TO "authenticated";
GRANT ALL ON TABLE "public"."story_segments" TO "service_role";



GRANT ALL ON TABLE "public"."story_segments_i18n" TO "anon";
GRANT ALL ON TABLE "public"."story_segments_i18n" TO "authenticated";
GRANT ALL ON TABLE "public"."story_segments_i18n" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."tier_limits" TO "anon";
GRANT ALL ON TABLE "public"."tier_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."tier_limits" TO "service_role";



GRANT ALL ON TABLE "public"."user_characters" TO "anon";
GRANT ALL ON TABLE "public"."user_characters" TO "authenticated";
GRANT ALL ON TABLE "public"."user_characters" TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."visibility_settings" TO "anon";
GRANT ALL ON TABLE "public"."visibility_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."visibility_settings" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
