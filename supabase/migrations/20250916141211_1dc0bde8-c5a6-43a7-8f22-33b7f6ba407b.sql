-- Fix critical security vulnerabilities

-- 1. Enable RLS on system_config table
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Create policy for system_config - only admins can access
CREATE POLICY "Only admins can access system config" ON public.system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Fix function search paths for security
CREATE OR REPLACE FUNCTION public.get_user_language(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.get_prompt_template(template_key text, language_code text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.has_role(check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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