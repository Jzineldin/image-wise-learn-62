-- Create function to get live statistics
CREATE OR REPLACE FUNCTION public.get_live_stats()
RETURNS TABLE(
  founder_count bigint,
  total_users bigint,
  total_stories bigint,
  completed_stories bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id) FILTER (WHERE p.is_beta_user = true)::bigint as founder_count,
    COUNT(DISTINCT p.id)::bigint as total_users,
    COUNT(DISTINCT s.id)::bigint as total_stories,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed')::bigint as completed_stories
  FROM profiles p
  LEFT JOIN stories s ON s.user_id = p.id OR s.author_id = p.id;
END;
$$;