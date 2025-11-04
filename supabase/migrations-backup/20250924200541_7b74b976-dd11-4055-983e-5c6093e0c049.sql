-- Fix database function security issues by updating search paths

-- Update all database functions to use proper security definer settings
-- and fix search path issues for better security

-- Fix get_prompt_template function
CREATE OR REPLACE FUNCTION public.get_prompt_template(template_key text, language_code text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix get_user_language function
CREATE OR REPLACE FUNCTION public.get_user_language(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_lang text;
BEGIN
  SELECT preferred_language INTO user_lang
  FROM public.profiles
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_lang, 'en');
END;
$function$;

-- Create secure role checking function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$function$;

-- Update has_role function to use the secure role checker
CREATE OR REPLACE FUNCTION public.has_role(check_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has the specified role using secure function
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = check_role
  );
END;
$function$;

-- Create security audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_uuid uuid DEFAULT auth.uid(),
  event_details jsonb DEFAULT '{}'::jsonb,
  ip_address text DEFAULT NULL,
  user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('auth_failure', 'rate_limit', 'validation_error', 'suspicious_activity', 'admin_action')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security audit log
CREATE POLICY "Admin can view all security logs" ON public.security_audit_log
  FOR SELECT
  USING (has_role('admin'));

CREATE POLICY "Users can view their own security events" ON public.security_audit_log
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert security events" ON public.security_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);

-- Create rate limiting table for database-level rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  operation_type text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT NOW(),
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, operation_type, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for rate limits (admin only)
CREATE POLICY "Admin can manage rate limits" ON public.rate_limits
  FOR ALL
  USING (has_role('admin'));

-- Create function for database-level rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_operation_type text,
  p_max_requests integer DEFAULT 10,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete security audit logs older than 90 days (keep for compliance)
  DELETE FROM public.security_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$function$;