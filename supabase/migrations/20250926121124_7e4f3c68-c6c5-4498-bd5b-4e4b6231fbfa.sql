-- Update credit costs to match user specification
-- 1 segment = 2 credits (1 for text + 1 for image)
-- TTS = 1 credit per 100 words

UPDATE system_config
SET value = '{
  "story_generation": 2,
  "segment_generation": 2,
  "ending_generation": 1,
  "image_generation": 1,
  "audio_generation": 1,
  "translation": 1
}'::jsonb
WHERE category = 'credits' AND key = 'operation_costs';

-- Verify the update
SELECT value as updated_credit_costs
FROM system_config
WHERE category = 'credits' AND key = 'operation_costs';