-- Fix malformed story segments with null content or old choice formats
UPDATE story_segments 
SET content = 'Content generation failed. Please regenerate this segment.' 
WHERE content IS NULL OR content = '';

-- Fix old choice formats to ensure all choices have text and impact fields
UPDATE story_segments 
SET choices = (
  SELECT jsonb_agg(
    CASE 
      WHEN choice ? 'text' AND choice ? 'impact' THEN choice
      WHEN choice ? 'text' THEN choice || jsonb_build_object('impact', 'neutral')
      ELSE jsonb_build_object('id', (choice->>'id')::int, 'text', COALESCE(choice->>'text', choice->>'choice', 'Continue the story'), 'impact', 'neutral')
    END
  )
  FROM jsonb_array_elements(choices) as choice
)
WHERE choices IS NOT NULL 
AND choices != '[]'::jsonb
AND EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(choices) as choice 
  WHERE NOT (choice ? 'text' AND choice ? 'impact')
);

-- Add constraints to prevent future null content
ALTER TABLE story_segments 
ADD CONSTRAINT story_segments_content_not_empty 
CHECK (content IS NOT NULL AND length(trim(content)) > 0);