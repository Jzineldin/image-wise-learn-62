-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_featured_stories(integer);

-- Create function to get featured stories for public display
CREATE OR REPLACE FUNCTION public.get_featured_stories(limit_count integer DEFAULT 10)
RETURNS TABLE(
  story_id uuid,
  title text,
  description text,
  author_name text,
  genre text,
  age_group text,
  cover_image_url text,
  story_position integer,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.story_id,
    s.title,
    s.description,
    p.display_name as author_name,
    s.genre,
    s.age_group,
    s.cover_image as cover_image_url,
    fs.priority as story_position,
    fs.created_at
  FROM public.featured_stories fs
  JOIN public.stories s ON fs.story_id = s.id
  LEFT JOIN public.profiles p ON s.author_id = p.id
  WHERE fs.is_active = true
    AND s.status = 'completed'
    AND s.visibility = 'public'
  ORDER BY fs.priority DESC, fs.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Update the existing featured_stories table to ensure we have view tracking
ALTER TABLE public.featured_stories 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;