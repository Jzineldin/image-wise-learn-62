-- Tale Forge Database Performance Indexes
-- Run this in Supabase Dashboard → SQL Editor
-- Estimated time: 30 seconds
-- Risk: Very low (IF NOT EXISTS prevents errors)

-- Run all index creation statements together
BEGIN;

-- 1. Discover page optimization
-- Improves performance on Discover page queries
CREATE INDEX IF NOT EXISTS idx_stories_visibility_status_created 
ON stories(visibility, status, created_at DESC) 
WHERE visibility = 'public';

-- 2. User stories optimization
-- Improves performance on My Stories page
CREATE INDEX IF NOT EXISTS idx_stories_user_created 
ON stories(user_id, created_at DESC);

-- 3. Genre filtering optimization
-- Improves performance when filtering by genre on Discover page
CREATE INDEX IF NOT EXISTS idx_stories_genre_visibility 
ON stories(genre, visibility) 
WHERE visibility = 'public';

-- 4. Story segments optimization
-- Improves performance when loading story content
CREATE INDEX IF NOT EXISTS idx_story_segments_story_number
ON story_segments(story_id, segment_number);

-- 5. User credits optimization
-- Improves performance when checking user credits
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id 
ON user_credits(user_id);

COMMIT;

-- Verify all indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('stories', 'story_segments', 'user_credits')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

