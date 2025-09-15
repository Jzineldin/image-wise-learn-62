-- Apply migrations for Tale Forge 2025
-- Run this in your Supabase SQL editor

-- ============================================
-- 1. AUTO PREVIEW IMAGE MIGRATION
-- ============================================

-- Function to update story cover image when segment image is added
CREATE OR REPLACE FUNCTION update_story_cover_image()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_update_story_cover ON story_segments;

-- Create trigger for auto-updating cover images
CREATE TRIGGER auto_update_story_cover
AFTER INSERT OR UPDATE OF image_url ON story_segments
FOR EACH ROW
EXECUTE FUNCTION update_story_cover_image();

-- Function to update existing stories with preview images
CREATE OR REPLACE FUNCTION update_existing_story_previews()
RETURNS void AS $$
BEGIN
  UPDATE stories s
  SET cover_image = (
    SELECT image_url
    FROM story_segments seg
    WHERE seg.story_id = s.id
    AND seg.image_url IS NOT NULL
    ORDER BY seg.segment_number ASC
    LIMIT 1
  )
  WHERE s.cover_image IS NULL OR s.cover_image = '';
END;
$$ LANGUAGE plpgsql;

-- Execute the update for existing stories
SELECT update_existing_story_previews();

-- ============================================
-- 2. ENHANCED FEATURED STORIES FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_featured_stories()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  genre TEXT,
  age_group TEXT,
  cover_image TEXT,
  author_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.genre,
    s.age_group,
    COALESCE(
      s.cover_image,
      s.cover_image_url,
      (SELECT seg.image_url
       FROM story_segments seg
       WHERE seg.story_id = s.id
       AND seg.image_url IS NOT NULL
       ORDER BY seg.segment_number ASC
       LIMIT 1)
    ) as cover_image,
    COALESCE(p.full_name, 'Anonymous') as author_name,
    s.created_at
  FROM stories s
  LEFT JOIN profiles p ON p.id = s.user_id
  WHERE s.visibility = 'public'
  AND (s.status = 'completed' OR s.is_completed = true OR s.is_complete = true)
  ORDER BY s.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. ADMIN FUNCTIONS AND TABLES
-- ============================================

-- Create admin audit log table if not exists
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content flags table if not exists
CREATE TABLE IF NOT EXISTS content_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  flag_type TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system config table if not exists
CREATE TABLE IF NOT EXISTS system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);

-- ============================================
-- 4. INSERT DEFAULT AI MODEL CONFIGURATIONS
-- ============================================

-- Clear existing AI model configs
DELETE FROM system_config WHERE category = 'ai_models';

-- Insert correct AI model configurations
INSERT INTO system_config (category, key, value, description) VALUES
('ai_models', 'sonoma_dusk_alpha', '{
  "provider": "OpenRouter",
  "model": "openrouter/sonoma-dusk-alpha",
  "name": "Sonoma Dusk Alpha",
  "context_window": 2000000,
  "max_tokens": 32768,
  "temperature": 0.7,
  "features": ["story_generation", "segment_generation", "ending_generation"],
  "cost_per_1k_tokens": 0.002,
  "enabled": true,
  "priority": 1
}'::jsonb, 'Primary 2M context model for story generation'),

('ai_models', 'llama_3_3_70b', '{
  "provider": "OpenRouter",
  "model": "Meta-Llama-3_3-70B-Instruct",
  "name": "Llama 3.3 70B",
  "context_window": 128000,
  "max_tokens": 8192,
  "temperature": 0.7,
  "features": ["story_generation", "fallback"],
  "cost_per_1k_tokens": 0.001,
  "enabled": true,
  "priority": 2
}'::jsonb, 'Fallback model for story generation'),

('ai_models', 'gpt_4o_mini', '{
  "provider": "OpenAI",
  "model": "gpt-4o-mini",
  "name": "GPT-4o Mini",
  "context_window": 128000,
  "max_tokens": 4096,
  "temperature": 0.7,
  "features": ["translation", "story_generation", "segment_generation"],
  "cost_per_1k_tokens": 0.0015,
  "enabled": true,
  "priority": 3
}'::jsonb, 'OpenAI model for translation and generation'),

('ai_models', 'gpt_4_turbo', '{
  "provider": "OpenAI",
  "model": "gpt-4-turbo-preview",
  "name": "GPT-4 Turbo",
  "context_window": 128000,
  "max_tokens": 4096,
  "temperature": 0.7,
  "features": ["story_generation", "segment_generation", "ending_generation"],
  "cost_per_1k_tokens": 0.01,
  "enabled": false,
  "priority": 4
}'::jsonb, 'Advanced GPT-4 model for high-quality generation'),

('ai_models', 'gpt_4o', '{
  "provider": "OpenAI",
  "model": "gpt-4o",
  "name": "GPT-4o",
  "context_window": 128000,
  "max_tokens": 4096,
  "temperature": 0.7,
  "features": ["story_generation", "segment_generation", "ending_generation", "translation"],
  "cost_per_1k_tokens": 0.005,
  "enabled": false,
  "priority": 5
}'::jsonb, 'Optimized GPT-4 model for balanced performance');

-- ============================================
-- 5. CREDIT SYSTEM CONFIGURATION
-- ============================================

-- Insert default credit costs
INSERT INTO system_config (category, key, value, description)
VALUES
('credits', 'operation_costs', '{
  "story_generation": 5,
  "segment_generation": 3,
  "ending_generation": 2,
  "image_generation": 10,
  "audio_generation": 8,
  "translation": 2
}'::jsonb, 'Credit costs for different operations')
ON CONFLICT (category, key)
DO UPDATE SET value = EXCLUDED.value;

-- Insert default credit settings
INSERT INTO system_config (category, key, value, description)
VALUES
('credits', 'user_defaults', '{
  "welcome_credits": 50,
  "daily_free_credits": 10,
  "max_credits": 10000,
  "low_credit_threshold": 20
}'::jsonb, 'Default credit settings for users')
ON CONFLICT (category, key)
DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 6. FIX STORY VIEWER PERMISSIONS
-- ============================================

-- Ensure proper RLS policies for story viewing
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public stories viewable by all" ON stories;
DROP POLICY IF EXISTS "Story segments viewable with story access" ON story_segments;

-- Create new policies
CREATE POLICY "Public stories viewable by all"
ON stories FOR SELECT
USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Story segments viewable with story access"
ON story_segments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id = story_segments.story_id
    AND (stories.visibility = 'public' OR stories.user_id = auth.uid())
  )
);

-- ============================================
-- 7. UPDATE ALL STORIES TO ENSURE PREVIEW IMAGES
-- ============================================

-- Final sweep to ensure all stories have preview images where available
UPDATE stories s
SET cover_image = COALESCE(
  s.cover_image,
  s.cover_image_url,
  (SELECT seg.image_url
   FROM story_segments seg
   WHERE seg.story_id = s.id
   AND seg.image_url IS NOT NULL
   ORDER BY seg.segment_number ASC
   LIMIT 1)
)
WHERE (s.cover_image IS NULL OR s.cover_image = '')
AND EXISTS (
  SELECT 1 FROM story_segments seg
  WHERE seg.story_id = s.id
  AND seg.image_url IS NOT NULL
);

-- ============================================
-- SUMMARY
-- ============================================
-- This migration script:
-- 1. ✅ Sets up automatic preview image assignment
-- 2. ✅ Updates existing stories with preview images
-- 3. ✅ Creates admin tables and functions
-- 4. ✅ Configures correct AI models (Sonoma Dusk Alpha)
-- 5. ✅ Sets up credit system defaults
-- 6. ✅ Ensures proper story viewing permissions
--
-- Run this entire script in your Supabase SQL editor
-- to apply all migrations at once.