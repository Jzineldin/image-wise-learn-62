-- Phase 1: Security fixes for existing functions
-- Fix search_path for all functions to prevent SQL injection

CREATE OR REPLACE FUNCTION public.get_user_transactions(p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, amount integer, type text, description text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_credits(user_uuid uuid)
 RETURNS TABLE(current_balance integer, total_earned integer, total_spent integer, last_monthly_refresh timestamp with time zone, can_refresh boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.spend_credits(user_uuid uuid, credits_to_spend integer, description_text text, ref_id text DEFAULT NULL::text, ref_type text DEFAULT NULL::text, transaction_metadata jsonb DEFAULT NULL::jsonb)
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
  
  -- Check if user has enough credits
  IF current_credits < credits_to_spend THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  new_balance := current_credits - credits_to_spend;
  
  -- Update balance
  UPDATE public.user_credits
  SET 
    current_balance = new_balance,
    total_spent = total_spent + credits_to_spend,
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
$function$;

-- Phase 2: Multilingual database schema
-- Create languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, -- ISO language codes: 'en', 'sv', etc.
  name text NOT NULL,
  native_name text NOT NULL,
  ai_model_config jsonb DEFAULT '{}',
  prompt_templates jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default languages
INSERT INTO public.languages (code, name, native_name, ai_model_config, prompt_templates, is_active) VALUES
('en', 'English', 'English', 
 '{"primary_model": "gpt-4o-mini", "fallback_model": "gpt-4o", "temperature": 0.8}',
 '{"story_generation": "Create an engaging {age_group} story about {prompt}. Make it creative and age-appropriate.", "character_generation": "Create a detailed character for a {genre} story."}',
 true),
('sv', 'Swedish', 'Svenska', 
 '{"primary_model": "gpt-4o-mini", "fallback_model": "gpt-4o", "temperature": 0.8, "system_prompt": "You are a Swedish storyteller. Respond in Swedish."}',
 '{"story_generation": "Skapa en engagerande berättelse för {age_group} om {prompt}. Gör den kreativ och åldersanpassad.", "character_generation": "Skapa en detaljerad karaktär för en {genre} berättelse."}',
 true)
ON CONFLICT (code) DO NOTHING;

-- Add language support to existing tables
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS language_code text DEFAULT 'en' REFERENCES public.languages(code),
ADD COLUMN IF NOT EXISTS original_language_code text REFERENCES public.languages(code);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en' REFERENCES public.languages(code);

-- Create story content localization table
CREATE TABLE IF NOT EXISTS public.story_content_i18n (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  language_code text NOT NULL REFERENCES public.languages(code),
  title text,
  description text,
  content jsonb DEFAULT '{}',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(story_id, language_code)
);

-- Create story segments localization table
CREATE TABLE IF NOT EXISTS public.story_segments_i18n (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid NOT NULL REFERENCES public.story_segments(id) ON DELETE CASCADE,
  language_code text NOT NULL REFERENCES public.languages(code),
  content text,
  choices jsonb DEFAULT '[]',
  audio_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(segment_id, language_code)
);

-- Create AI generation templates table
CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  language_code text NOT NULL REFERENCES public.languages(code),
  template_content text NOT NULL,
  variables jsonb DEFAULT '[]',
  category text DEFAULT 'story',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(template_key, language_code)
);

-- Insert default prompt templates
INSERT INTO public.ai_prompt_templates (template_key, language_code, template_content, variables, category) VALUES
('story_generation', 'en', 'Create an engaging story for {age_group} age group in the {genre} genre. The story should be about: {prompt}. Make it creative, age-appropriate, and include vivid descriptions. Structure it with clear beginning, middle, and end.', '["age_group", "genre", "prompt"]', 'story'),
('story_generation', 'sv', 'Skapa en engagerande berättelse för åldersgruppen {age_group} inom genren {genre}. Berättelsen ska handla om: {prompt}. Gör den kreativ, åldersanpassad och inkludera levande beskrivningar. Strukturera den med tydlig början, mitt och slut.', '["age_group", "genre", "prompt"]', 'story'),
('character_creation', 'en', 'Create a detailed character for a {genre} story suitable for {age_group}. Include: name, personality traits, appearance, background, and role in the story. Character description: {description}', '["genre", "age_group", "description"]', 'character'),
('character_creation', 'sv', 'Skapa en detaljerad karaktär för en {genre} berättelse lämplig för {age_group}. Inkludera: namn, personlighetsdrag, utseende, bakgrund och roll i berättelsen. Karaktärsbeskrivning: {description}', '["genre", "age_group", "description"]', 'character');

-- Enable RLS on new tables
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_content_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_segments_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Languages are viewable by everyone" ON public.languages FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view story content" ON public.story_content_i18n FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.stories s 
  WHERE s.id = story_content_i18n.story_id 
  AND (s.user_id = auth.uid() OR s.visibility = 'public')
));

CREATE POLICY "Users can manage their story content" ON public.story_content_i18n FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.stories s 
  WHERE s.id = story_content_i18n.story_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Users can view segment content" ON public.story_segments_i18n FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.story_segments ss
  JOIN public.stories s ON ss.story_id = s.id
  WHERE ss.id = story_segments_i18n.segment_id
  AND (s.user_id = auth.uid() OR s.visibility = 'public')
));

CREATE POLICY "Users can manage their segment content" ON public.story_segments_i18n FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.story_segments ss
  JOIN public.stories s ON ss.story_id = s.id
  WHERE ss.id = story_segments_i18n.segment_id
  AND s.user_id = auth.uid()
));

CREATE POLICY "Prompt templates are viewable by everyone" ON public.ai_prompt_templates FOR SELECT USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_language_code ON public.stories(language_code);
CREATE INDEX IF NOT EXISTS idx_story_content_i18n_story_language ON public.story_content_i18n(story_id, language_code);
CREATE INDEX IF NOT EXISTS idx_story_segments_i18n_segment_language ON public.story_segments_i18n(segment_id, language_code);
CREATE INDEX IF NOT EXISTS idx_ai_templates_key_language ON public.ai_prompt_templates(template_key, language_code);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);

-- Create function to get user's preferred language
CREATE OR REPLACE FUNCTION public.get_user_language(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create function to get prompt template
CREATE OR REPLACE FUNCTION public.get_prompt_template(template_key text, language_code text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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