-- Fix preview images ONLY - doesn't touch your credit costs
-- Run this in your Supabase SQL editor

-- ============================================
-- AUTO PREVIEW IMAGES FIX
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS auto_update_story_cover ON story_segments;

CREATE TRIGGER auto_update_story_cover
AFTER INSERT OR UPDATE OF image_url ON story_segments
FOR EACH ROW
EXECUTE FUNCTION update_story_cover_image();

-- Update ALL existing stories with preview images from their segments
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
WHERE (s.cover_image IS NULL OR s.cover_image = '' OR s.cover_image_url IS NULL OR s.cover_image_url = '')
AND EXISTS (
  SELECT 1 FROM story_segments seg
  WHERE seg.story_id = s.id
  AND seg.image_url IS NOT NULL
);

-- ============================================
-- ADD AI MODELS (without touching credits)
-- ============================================

-- Create system config table if not exists (won't affect existing data)
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

-- Only add/update AI models, don't touch credit settings
DELETE FROM system_config WHERE category = 'ai_models';

INSERT INTO system_config (category, key, value, description) VALUES
('ai_models', 'sonoma_dusk_alpha', '{
  "provider": "OpenRouter",
  "model": "openrouter/sonoma-dusk-alpha",
  "name": "Sonoma Dusk Alpha (2M Context)",
  "context_window": 2000000,
  "max_tokens": 32768,
  "temperature": 0.7,
  "features": ["story_generation", "segment_generation", "ending_generation"],
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
  "enabled": false,
  "priority": 5
}'::jsonb, 'Optimized GPT-4 model for balanced performance');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check how many stories now have preview images
SELECT COUNT(*) as stories_with_previews
FROM stories
WHERE cover_image IS NOT NULL AND cover_image != '';

-- Check AI models added
SELECT key, value->>'name' as model_name, value->>'enabled' as enabled
FROM system_config
WHERE category = 'ai_models'
ORDER BY (value->>'priority')::int;

-- View your existing credit costs (not modified)
SELECT * FROM credit_costs;