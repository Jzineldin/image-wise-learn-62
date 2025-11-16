-- Fix audio_url column length in story_segments table
-- The column is too short (appears to be VARCHAR(54)) which truncates storage URLs
-- Supabase storage URLs are ~145 characters long

-- Increase audio_url column length to TEXT (unlimited)
ALTER TABLE story_segments
ALTER COLUMN audio_url TYPE TEXT;

-- Also fix full_story_audio_url in stories table
ALTER TABLE stories
ALTER COLUMN full_story_audio_url TYPE TEXT;

-- Verify the changes
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE (table_name = 'story_segments' AND column_name = 'audio_url')
   OR (table_name = 'stories' AND column_name = 'full_story_audio_url');
