-- Check actual audio_url values in the database
SELECT
  id,
  LENGTH(audio_url) as url_length,
  audio_url,
  voice_status,
  created_at
FROM story_segments
WHERE audio_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
