-- Check audio_url column type and length
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'story_segments'
  AND column_name = 'audio_url';
