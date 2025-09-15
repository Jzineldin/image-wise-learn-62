-- Restore original credit costs
-- Run this in your Supabase SQL editor

-- Update credit costs back to original values
UPDATE system_config
SET value = '{
  "story_generation": 1,
  "segment_generation": 1,
  "ending_generation": 1,
  "image_generation": 2,
  "audio_generation": 3,
  "translation": 1
}'::jsonb
WHERE category = 'credits' AND key = 'operation_costs';

-- Verify the update
SELECT value as credit_costs
FROM system_config
WHERE category = 'credits' AND key = 'operation_costs';