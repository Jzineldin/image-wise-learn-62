-- Enhanced Admin Functions and Security
-- This migration adds comprehensive admin functionality including user management,
-- content moderation, analytics, system settings, and audit logging

-- =====================================================
-- AUDIT LOGGING SYSTEM
-- =====================================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id, action, resource_type, resource_id,
    details, ip_address, user_agent, success
  ) VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id,
    p_details, p_ip_address, p_user_agent, p_success
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Get all users with stats for admin
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  credits INTEGER,
  role TEXT,
  is_banned BOOLEAN,
  stories_count BIGINT,
  total_credits_used INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    COALESCE(p.full_name, '') as full_name,
    COALESCE(p.display_name, '') as display_name,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(p.credits, 0) as credits,
    COALESCE(ur.role, 'user') as role,
    COALESCE(p.is_banned, false) as is_banned,
    COALESCE(story_stats.stories_count, 0) as stories_count,
    COALESCE(credit_stats.total_used, 0) as total_credits_used
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as stories_count
    FROM public.stories
    GROUP BY user_id
  ) story_stats ON u.id = story_stats.user_id
  LEFT JOIN (
    SELECT user_id, SUM(ABS(amount)) as total_used
    FROM public.credit_transactions
    WHERE amount < 0
    GROUP BY user_id
  ) credit_stats ON u.id = credit_stats.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Toggle user ban status
CREATE OR REPLACE FUNCTION public.admin_toggle_user_ban(
  p_user_id UUID,
  p_is_banned BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_email TEXT;
  action_name TEXT;
BEGIN
  -- Only admins can ban users
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get user email for logging
  SELECT email INTO target_email FROM auth.users WHERE id = p_user_id;

  -- Update ban status
  UPDATE public.profiles
  SET is_banned = p_is_banned, updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the action
  action_name := CASE WHEN p_is_banned THEN 'user_ban' ELSE 'user_unban' END;
  PERFORM log_admin_action(
    action_name,
    'user',
    p_user_id::TEXT,
    jsonb_build_object('target_email', target_email, 'is_banned', p_is_banned)
  );

  RETURN true;
END;
$$;

-- Update user role
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id UUID,
  p_role TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_email TEXT;
BEGIN
  -- Only admins can update roles
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate role
  IF p_role NOT IN ('user', 'moderator', 'admin', 'premium_plus') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Get user email for logging
  SELECT email INTO target_email FROM auth.users WHERE id = p_user_id;

  -- Update or insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove other roles (user can only have one primary role)
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id AND role != p_role;

  -- Log the action
  PERFORM log_admin_action(
    'role_update',
    'user',
    p_user_id::TEXT,
    jsonb_build_object('target_email', target_email, 'new_role', p_role)
  );

  RETURN true;
END;
$$;

-- Adjust user credits
CREATE OR REPLACE FUNCTION public.admin_adjust_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  new_balance INTEGER;
  target_email TEXT;
BEGIN
  -- Only admins can adjust credits
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get current credits and user email
  SELECT credits, (SELECT email FROM auth.users WHERE id = p_user_id)
  INTO current_credits, target_email
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  new_balance := current_credits + p_amount;

  -- Prevent negative balance
  IF new_balance < 0 THEN
    new_balance := 0;
  END IF;

  -- Update balance
  UPDATE public.profiles
  SET credits = new_balance, updated_at = NOW()
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions (
    user_id, amount, type, description, created_at
  ) VALUES (
    p_user_id, p_amount, 'admin_adjustment', p_description, NOW()
  );

  -- Log the action
  PERFORM log_admin_action(
    'credit_adjustment',
    'user',
    p_user_id::TEXT,
    jsonb_build_object(
      'target_email', target_email,
      'amount', p_amount,
      'description', p_description,
      'old_balance', current_credits,
      'new_balance', new_balance
    )
  );

  RETURN true;
END;
$$;

-- =====================================================
-- CONTENT MODERATION FUNCTIONS
-- =====================================================

-- Create content flags table
CREATE TABLE IF NOT EXISTS public.content_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Get all stories for moderation
CREATE OR REPLACE FUNCTION public.admin_get_all_stories()
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  author_name TEXT,
  author_id UUID,
  genre TEXT,
  age_group TEXT,
  status TEXT,
  visibility TEXT,
  is_featured BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  flags_count BIGINT,
  cover_image TEXT,
  segment_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    s.description,
    COALESCE(p.display_name, p.full_name, 'Anonymous') as author_name,
    s.user_id as author_id,
    s.genre,
    s.age_group,
    s.status,
    s.visibility,
    EXISTS(SELECT 1 FROM public.featured_stories fs WHERE fs.story_id = s.id AND fs.is_active = true) as is_featured,
    s.created_at,
    s.updated_at,
    COALESCE(flag_counts.count, 0) as flags_count,
    s.cover_image,
    COALESCE(segment_counts.count, 0) as segment_count
  FROM public.stories s
  LEFT JOIN public.profiles p ON s.user_id = p.id
  LEFT JOIN (
    SELECT story_id, COUNT(*) as count
    FROM public.content_flags
    WHERE status = 'pending'
    GROUP BY story_id
  ) flag_counts ON s.id = flag_counts.story_id
  LEFT JOIN (
    SELECT story_id, COUNT(*) as count
    FROM public.story_segments
    GROUP BY story_id
  ) segment_counts ON s.id = segment_counts.story_id
  ORDER BY s.created_at DESC;
END;
$$;

-- Update story visibility
CREATE OR REPLACE FUNCTION public.admin_update_story_visibility(
  p_story_id UUID,
  p_visibility TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  story_title TEXT;
  author_email TEXT;
BEGIN
  -- Only admins can update visibility
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Validate visibility
  IF p_visibility NOT IN ('public', 'private', 'unlisted') THEN
    RAISE EXCEPTION 'Invalid visibility: %', p_visibility;
  END IF;

  -- Get story details for logging
  SELECT s.title, u.email
  INTO story_title, author_email
  FROM public.stories s
  JOIN auth.users u ON s.user_id = u.id
  WHERE s.id = p_story_id;

  -- Update visibility
  UPDATE public.stories
  SET visibility = p_visibility, updated_at = NOW()
  WHERE id = p_story_id;

  -- Log the action
  PERFORM log_admin_action(
    'story_visibility_update',
    'story',
    p_story_id::TEXT,
    jsonb_build_object(
      'story_title', story_title,
      'author_email', author_email,
      'new_visibility', p_visibility
    )
  );

  RETURN true;
END;
$$;

-- Delete story (admin)
CREATE OR REPLACE FUNCTION public.admin_delete_story(
  p_story_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  story_title TEXT;
  author_email TEXT;
BEGIN
  -- Only admins can delete stories
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get story details for logging
  SELECT s.title, u.email
  INTO story_title, author_email
  FROM public.stories s
  JOIN auth.users u ON s.user_id = u.id
  WHERE s.id = p_story_id;

  -- Delete story (cascades to segments, flags, etc.)
  DELETE FROM public.stories WHERE id = p_story_id;

  -- Log the action
  PERFORM log_admin_action(
    'story_delete',
    'story',
    p_story_id::TEXT,
    jsonb_build_object(
      'story_title', story_title,
      'author_email', author_email
    )
  );

  RETURN true;
END;
$$;

-- Flag story for review
CREATE OR REPLACE FUNCTION public.admin_flag_story(
  p_story_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flag_id UUID;
  story_title TEXT;
BEGIN
  -- Only admins can flag stories
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get story title
  SELECT title INTO story_title FROM public.stories WHERE id = p_story_id;

  -- Create flag
  INSERT INTO public.content_flags (story_id, user_id, reason, description)
  VALUES (p_story_id, auth.uid(), p_reason, p_description)
  RETURNING id INTO flag_id;

  -- Log the action
  PERFORM log_admin_action(
    'content_flag_create',
    'story',
    p_story_id::TEXT,
    jsonb_build_object(
      'story_title', story_title,
      'reason', p_reason,
      'description', p_description
    )
  );

  RETURN flag_id;
END;
$$;

-- Get content flags
CREATE OR REPLACE FUNCTION public.admin_get_content_flags()
RETURNS TABLE(
  id UUID,
  story_id UUID,
  user_id UUID,
  reason TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT cf.id, cf.story_id, cf.user_id, cf.reason, cf.description, cf.status, cf.created_at
  FROM public.content_flags cf
  ORDER BY cf.created_at DESC;
END;
$$;

-- Resolve content flag
CREATE OR REPLACE FUNCTION public.admin_resolve_flag(
  p_flag_id UUID,
  p_resolution TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can resolve flags
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update flag
  UPDATE public.content_flags
  SET
    status = 'resolved',
    resolution = p_resolution,
    resolved_by = auth.uid(),
    resolved_at = NOW()
  WHERE id = p_flag_id;

  -- Log the action
  PERFORM log_admin_action(
    'content_flag_resolve',
    'content_flag',
    p_flag_id::TEXT,
    jsonb_build_object('resolution', p_resolution)
  );

  RETURN true;
END;
$$;

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Get analytics overview
CREATE OR REPLACE FUNCTION public.admin_get_analytics_overview(
  days INTEGER DEFAULT 30
) RETURNS TABLE(
  total_users BIGINT,
  total_stories BIGINT,
  total_credits_used BIGINT,
  monthly_active_users BIGINT,
  stories_this_month BIGINT,
  credits_used_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.stories)::BIGINT as total_stories,
    (SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.credit_transactions WHERE amount < 0)::BIGINT as total_credits_used,
    (SELECT COUNT(DISTINCT user_id) FROM public.stories WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT as monthly_active_users,
    (SELECT COUNT(*) FROM public.stories WHERE created_at >= date_trunc('month', NOW()))::BIGINT as stories_this_month,
    (SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.credit_transactions WHERE amount < 0 AND created_at >= date_trunc('month', NOW()))::BIGINT as credits_used_this_month;
END;
$$;

-- Get daily usage data
CREATE OR REPLACE FUNCTION public.admin_get_daily_usage(
  days INTEGER DEFAULT 30
) RETURNS TABLE(
  date DATE,
  users BIGINT,
  stories BIGINT,
  credits BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * days,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE as date
  )
  SELECT
    ds.date,
    COALESCE(user_counts.count, 0) as users,
    COALESCE(story_counts.count, 0) as stories,
    COALESCE(credit_counts.count, 0) as credits
  FROM date_series ds
  LEFT JOIN (
    SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as count
    FROM public.stories
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days
    GROUP BY DATE(created_at)
  ) user_counts ON ds.date = user_counts.date
  LEFT JOIN (
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM public.stories
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days
    GROUP BY DATE(created_at)
  ) story_counts ON ds.date = story_counts.date
  LEFT JOIN (
    SELECT DATE(created_at) as date, SUM(ABS(amount)) as count
    FROM public.credit_transactions
    WHERE amount < 0 AND created_at >= CURRENT_DATE - INTERVAL '1 day' * days
    GROUP BY DATE(created_at)
  ) credit_counts ON ds.date = credit_counts.date
  ORDER BY ds.date;
END;
$$;

-- Get genre distribution
CREATE OR REPLACE FUNCTION public.admin_get_genre_distribution()
RETURNS TABLE(
  genre TEXT,
  count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  WITH genre_counts AS (
    SELECT s.genre, COUNT(*) as count
    FROM public.stories s
    WHERE s.status = 'completed'
    GROUP BY s.genre
  ),
  total_count AS (
    SELECT SUM(count) as total FROM genre_counts
  )
  SELECT
    gc.genre,
    gc.count,
    ROUND((gc.count::NUMERIC / tc.total::NUMERIC) * 100, 2) as percentage
  FROM genre_counts gc, total_count tc
  ORDER BY gc.count DESC;
END;
$$;

-- Get age group distribution
CREATE OR REPLACE FUNCTION public.admin_get_age_group_distribution()
RETURNS TABLE(
  age_group TEXT,
  count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  WITH age_counts AS (
    SELECT s.age_group, COUNT(*) as count
    FROM public.stories s
    WHERE s.status = 'completed'
    GROUP BY s.age_group
  ),
  total_count AS (
    SELECT SUM(count) as total FROM age_counts
  )
  SELECT
    ac.age_group,
    ac.count,
    ROUND((ac.count::NUMERIC / tc.total::NUMERIC) * 100, 2) as percentage
  FROM age_counts ac, total_count tc
  ORDER BY ac.count DESC;
END;
$$;

-- Get top users
CREATE OR REPLACE FUNCTION public.admin_get_top_users(
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  stories_count BIGINT,
  credits_used BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    s.user_id,
    COALESCE(p.display_name, p.full_name, 'Anonymous User') as user_name,
    COUNT(s.id) as stories_count,
    COALESCE(credit_usage.total_used, 0) as credits_used
  FROM public.stories s
  LEFT JOIN public.profiles p ON s.user_id = p.id
  LEFT JOIN (
    SELECT user_id, SUM(ABS(amount)) as total_used
    FROM public.credit_transactions
    WHERE amount < 0
    GROUP BY user_id
  ) credit_usage ON s.user_id = credit_usage.user_id
  WHERE s.status = 'completed'
  GROUP BY s.user_id, p.display_name, p.full_name, credit_usage.total_used
  ORDER BY stories_count DESC, credits_used DESC
  LIMIT limit_count;
END;
$$;

-- Get featured story performance
CREATE OR REPLACE FUNCTION public.admin_get_featured_performance()
RETURNS TABLE(
  story_id UUID,
  title TEXT,
  views BIGINT,
  author TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    COALESCE(p.display_name, p.full_name, 'Anonymous') as author
  FROM public.featured_stories fs
  JOIN public.stories s ON fs.story_id = s.id
  LEFT JOIN public.profiles p ON s.user_id = p.id
  WHERE fs.is_active = true
  ORDER BY fs.view_count DESC NULLS LAST, fs.priority DESC;
END;
$$;

-- =====================================================
-- SYSTEM CONFIGURATION
-- =====================================================

-- Create system config table
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Get system configuration
CREATE OR REPLACE FUNCTION public.admin_get_system_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_result JSONB := '{}';
BEGIN
  -- Only admins can access
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Build config object from all settings
  SELECT jsonb_object_agg(config_key, config_value)
  INTO config_result
  FROM public.system_config;

  -- Return default config if none exists
  IF config_result IS NULL OR config_result = '{}' THEN
    config_result := '{
      "ai_settings": {
        "openai_model": "gpt-3.5-turbo",
        "max_tokens_per_request": 2000,
        "temperature": 0.7,
        "story_generation_prompt": "Create an engaging children'\''s story segment...",
        "image_generation_enabled": true,
        "audio_generation_enabled": true
      },
      "credit_settings": {
        "story_segment_cost": 1,
        "image_generation_cost": 2,
        "audio_generation_cost": 3,
        "daily_free_credits": 5,
        "welcome_bonus_credits": 10
      },
      "content_policies": {
        "max_story_length": 5000,
        "prohibited_words": [],
        "auto_moderation_enabled": true,
        "require_approval_for_public": false
      },
      "email_settings": {
        "welcome_email_enabled": true,
        "notification_emails_enabled": true,
        "smtp_host": "",
        "smtp_port": 587,
        "from_email": ""
      },
      "feature_flags": {
        "story_sharing_enabled": true,
        "premium_features_enabled": true,
        "social_features_enabled": false,
        "analytics_enabled": true
      }
    }';
  END IF;

  RETURN config_result;
END;
$$;

-- Update system configuration
CREATE OR REPLACE FUNCTION public.admin_update_system_config(
  p_config JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_key TEXT;
  config_value JSONB;
BEGIN
  -- Only admins can update config
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update each top-level key
  FOR config_key, config_value IN SELECT * FROM jsonb_each(p_config)
  LOOP
    INSERT INTO public.system_config (config_key, config_value, updated_by)
    VALUES (config_key, config_value, auth.uid())
    ON CONFLICT (config_key)
    DO UPDATE SET
      config_value = EXCLUDED.config_value,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW();
  END LOOP;

  -- Log the action
  PERFORM log_admin_action(
    'system_config_update',
    'system',
    NULL,
    jsonb_build_object('updated_keys', array_agg(config_key))
  );

  RETURN true;
END;
$$;

-- Test email connection (placeholder)
CREATE OR REPLACE FUNCTION public.admin_test_email_connection()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can test email
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- This is a placeholder - in production, this would test actual SMTP connection
  -- For now, we'll just log the attempt
  PERFORM log_admin_action('email_test', 'system', NULL, '{}');

  RETURN true;
END;
$$;

-- Get audit logs
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(
  days INTEGER DEFAULT 7,
  page_num INTEGER DEFAULT 1,
  limit_count INTEGER DEFAULT 50
) RETURNS TABLE(
  id UUID,
  admin_user_id UUID,
  admin_user_email TEXT,
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access audit logs
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    al.id,
    al.admin_user_id,
    u.email as admin_user_email,
    al.action,
    al.resource_type,
    al.resource_id,
    al.details,
    al.ip_address,
    al.user_agent,
    al.success,
    al.created_at
  FROM public.admin_audit_log al
  JOIN auth.users u ON al.admin_user_id = u.id
  WHERE al.created_at >= NOW() - INTERVAL '1 day' * days
  ORDER BY al.created_at DESC
  LIMIT limit_count
  OFFSET (page_num - 1) * limit_count;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Admin audit log policies
CREATE POLICY "Admins can view all audit logs" ON public.admin_audit_log
  FOR SELECT USING (has_role('admin'));

CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_log
  FOR INSERT WITH CHECK (has_role('admin'));

-- Content flags policies
CREATE POLICY "Admins can manage content flags" ON public.content_flags
  FOR ALL USING (has_role('admin'));

CREATE POLICY "Users can create content flags" ON public.content_flags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own flags" ON public.content_flags
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

-- System config policies
CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL USING (has_role('admin'));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON public.admin_audit_log(resource_type, resource_id);

-- Content flags indexes
CREATE INDEX IF NOT EXISTS idx_content_flags_story_id ON public.content_flags(story_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON public.content_flags(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_created_at ON public.content_flags(created_at DESC);

-- System config indexes
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(config_key);

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.content_flags TO authenticated;
GRANT SELECT ON public.system_config TO authenticated;