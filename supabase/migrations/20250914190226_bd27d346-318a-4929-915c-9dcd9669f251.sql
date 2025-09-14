-- Drop existing function first
DROP FUNCTION IF EXISTS public.get_featured_stories(integer);

-- Recreate with new return type including preview_image_url
CREATE OR REPLACE FUNCTION public.get_featured_stories(limit_count integer DEFAULT 10)
 RETURNS TABLE(story_id uuid, title text, description text, author_name text, genre text, age_group text, cover_image_url text, story_position integer, created_at timestamp with time zone, preview_image_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    fs.created_at,
    COALESCE(
      s.cover_image,
      (SELECT ss.image_url 
       FROM public.story_segments ss 
       WHERE ss.story_id = s.id 
         AND ss.image_url IS NOT NULL 
       ORDER BY ss.segment_number ASC 
       LIMIT 1)
    ) as preview_image_url
  FROM public.featured_stories fs
  JOIN public.stories s ON fs.story_id = s.id
  LEFT JOIN public.profiles p ON s.author_id = p.id
  WHERE fs.is_active = true
    AND s.status = 'completed'
    AND s.visibility = 'public'
  ORDER BY fs.priority DESC, fs.created_at DESC
  LIMIT limit_count;
END;
$function$