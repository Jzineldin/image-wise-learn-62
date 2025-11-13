-- Simplified migration script for Tale Forge 2025
-- Run this in your Supabase SQL editor

-- ============================================
-- PART 1: AUTO PREVIEW IMAGES (CRITICAL)
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
-- PART 2: AI MODEL CONFIGURATION
-- ============================================

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

-- Clear and insert AI model configurations
DELETE FROM system_config WHERE category = 'ai_models';

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
}'::jsonb, 'Advanced GPT-4 model for high-quality generation');

-- ============================================
-- PART 3: CREDIT SYSTEM DEFAULTS
-- ============================================

DELETE FROM system_config WHERE category = 'credits';

INSERT INTO system_config (category, key, value, description) VALUES
('credits', 'operation_costs', '{
  "story_generation": 5,
  "segment_generation": 3,
  "ending_generation": 2,
  "image_generation": 10,
  "audio_generation": 8,
  "translation": 2
}'::jsonb, 'Credit costs for different operations'),

('credits', 'user_defaults', '{
  "welcome_credits": 50,
  "daily_free_credits": 10,
  "max_credits": 10000,
  "low_credit_threshold": 20
}'::jsonb, 'Default credit settings for users');

-- ============================================
-- VERIFICATION QUERIES (Run these to check)
-- ============================================

-- Check how many stories now have preview images
SELECT COUNT(*) as stories_with_previews
FROM stories
WHERE cover_image IS NOT NULL AND cover_image != '';

-- Check AI model configuration
SELECT key, value->>'name' as model_name, value->>'enabled' as enabled
FROM system_config
WHERE category = 'ai_models'
ORDER BY (value->>'priority')::int;

-- Check credit costs
SELECT value as credit_costs
FROM system_config
WHERE category = 'credits' AND key = 'operation_costs';