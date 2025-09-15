-- Function to automatically update story cover_image when a segment image is added
CREATE OR REPLACE FUNCTION update_story_cover_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if image_url is not null and has changed
  IF NEW.image_url IS NOT NULL AND (OLD.image_url IS NULL OR OLD.image_url != NEW.image_url) THEN
    -- Check if story doesn't have a cover image yet
    IF EXISTS (
      SELECT 1 FROM stories
      WHERE id = NEW.story_id
      AND (cover_image IS NULL OR cover_image = '' OR cover_image_url IS NULL OR cover_image_url = '')
    ) THEN
      -- Update the story with the first available image
      -- Prefer the first segment's image, but use any available image
      UPDATE stories
      SET
        cover_image = NEW.image_url,
        cover_image_url = NEW.image_url,
        updated_at = NOW()
      WHERE id = NEW.story_id
      AND (cover_image IS NULL OR cover_image = '' OR cover_image_url IS NULL OR cover_image_url = '');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for story_segments table
DROP TRIGGER IF EXISTS auto_update_story_cover_image ON story_segments;
CREATE TRIGGER auto_update_story_cover_image
AFTER INSERT OR UPDATE ON story_segments
FOR EACH ROW
EXECUTE FUNCTION update_story_cover_image();

-- Function to update existing stories with images from their segments
CREATE OR REPLACE FUNCTION update_existing_story_previews()
RETURNS void AS $$
DECLARE
  story_record RECORD;
  segment_image TEXT;
BEGIN
  -- Find all stories without cover images
  FOR story_record IN
    SELECT id
    FROM stories
    WHERE (cover_image IS NULL OR cover_image = '' OR cover_image_url IS NULL OR cover_image_url = '')
  LOOP
    -- Get the first available image from segments
    SELECT image_url INTO segment_image
    FROM story_segments
    WHERE story_id = story_record.id
    AND image_url IS NOT NULL
    AND image_url != ''
    ORDER BY segment_number ASC
    LIMIT 1;

    -- Update the story if an image was found
    IF segment_image IS NOT NULL THEN
      UPDATE stories
      SET
        cover_image = segment_image,
        cover_image_url = segment_image,
        updated_at = NOW()
      WHERE id = story_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to update existing stories
SELECT update_existing_story_previews();

-- Also update the get_featured_stories function to properly handle preview images
CREATE OR REPLACE FUNCTION get_featured_stories(limit_count integer DEFAULT 10)
RETURNS TABLE(
  story_id uuid,
  title text,
  description text,
  author_name text,
  genre text,
  age_group text,
  cover_image_url text,
  story_position integer,
  created_at timestamp with time zone,
  preview_image_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.story_id,
    s.title,
    s.description,
    COALESCE(p.username, 'Anonymous') as author_name,
    s.genre,
    s.age_group,
    COALESCE(s.cover_image_url, s.cover_image) as cover_image_url,
    fs.position as story_position,
    s.created_at,
    COALESCE(
      s.cover_image_url,
      s.cover_image,
      (SELECT ss.image_url
       FROM story_segments ss
       WHERE ss.story_id = s.id
       AND ss.image_url IS NOT NULL
       ORDER BY ss.segment_number ASC
       LIMIT 1)
    ) as preview_image_url
  FROM featured_stories fs
  JOIN stories s ON fs.story_id = s.id
  LEFT JOIN profiles p ON s.author_id = p.id
  WHERE fs.is_active = true
  AND s.visibility = 'public'
  ORDER BY fs.position ASC, fs.created_at DESC
  LIMIT limit_count;
END;
$$;