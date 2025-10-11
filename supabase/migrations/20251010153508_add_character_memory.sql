-- Character Memory Feature Migration
-- This migration adds character memory tracking to Tale Forge
-- Characters will remember their past adventures across multiple stories

-- ============================================================================
-- 1. CREATE character_story_appearances TABLE
-- ============================================================================
-- This table tracks which characters appeared in which stories

CREATE TABLE IF NOT EXISTS public.character_story_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.user_characters(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Memory data (for future enhancements)
  role_in_story TEXT, -- 'protagonist', 'sidekick', 'mentor', etc.
  key_events TEXT[], -- Array of important events (future)
  relationships JSONB DEFAULT '{}', -- Relationships with other characters (future)
  character_development TEXT, -- How character changed (future)
  memorable_moments TEXT[], -- Specific memorable moments (future)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Ensure one record per character per story
  UNIQUE(character_id, story_id)
);

-- ============================================================================
-- 2. ADD MEMORY COLUMNS TO user_characters TABLE
-- ============================================================================
-- Add columns to track character memory summary and usage

ALTER TABLE public.user_characters 
ADD COLUMN IF NOT EXISTS memory_summary TEXT,
ADD COLUMN IF NOT EXISTS total_stories INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_appearance_at TIMESTAMPTZ;

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding all stories a character appeared in
CREATE INDEX IF NOT EXISTS idx_character_appearances_character 
ON public.character_story_appearances(character_id, created_at DESC);

-- Index for finding all characters in a story
CREATE INDEX IF NOT EXISTS idx_character_appearances_story 
ON public.character_story_appearances(story_id);

-- Index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_character_appearances_user 
ON public.character_story_appearances(user_id);

-- Index for character usage tracking
CREATE INDEX IF NOT EXISTS idx_user_characters_total_stories 
ON public.user_characters(total_stories DESC);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.character_story_appearances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Policy: Users can view their own character appearances
CREATE POLICY "Users can view their own character appearances"
ON public.character_story_appearances
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own character appearances
CREATE POLICY "Users can insert their own character appearances"
ON public.character_story_appearances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own character appearances
CREATE POLICY "Users can update their own character appearances"
ON public.character_story_appearances
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own character appearances
CREATE POLICY "Users can delete their own character appearances"
ON public.character_story_appearances
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. CREATE HELPER FUNCTION: Update Character Stats
-- ============================================================================
-- This function updates character stats when a new appearance is recorded

CREATE OR REPLACE FUNCTION update_character_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_stories count and last_appearance_at
  UPDATE public.user_characters
  SET 
    total_stories = (
      SELECT COUNT(*)
      FROM public.character_story_appearances
      WHERE character_id = NEW.character_id
    ),
    last_appearance_at = NEW.created_at,
    updated_at = now()
  WHERE id = NEW.character_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE TRIGGER: Auto-update character stats
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_character_stats ON public.character_story_appearances;

CREATE TRIGGER trigger_update_character_stats
AFTER INSERT ON public.character_story_appearances
FOR EACH ROW
EXECUTE FUNCTION update_character_stats();

-- ============================================================================
-- 8. CREATE HELPER FUNCTION: Get Character History
-- ============================================================================
-- This function returns a character's story history

CREATE OR REPLACE FUNCTION get_character_history(p_character_id UUID)
RETURNS TABLE (
  story_id UUID,
  story_title TEXT,
  story_created_at TIMESTAMPTZ,
  appearance_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS story_id,
    s.title AS story_title,
    s.created_at AS story_created_at,
    csa.created_at AS appearance_created_at
  FROM public.character_story_appearances csa
  JOIN public.stories s ON s.id = csa.story_id
  WHERE csa.character_id = p_character_id
  ORDER BY csa.created_at DESC
  LIMIT 10; -- Return last 10 stories
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION get_character_history(UUID) TO authenticated;

-- ============================================================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.character_story_appearances IS 
'Tracks which characters appeared in which stories for character memory feature';

COMMENT ON COLUMN public.user_characters.memory_summary IS 
'Brief summary of character''s history across all stories';

COMMENT ON COLUMN public.user_characters.total_stories IS 
'Total number of stories this character has appeared in';

COMMENT ON COLUMN public.user_characters.last_appearance_at IS 
'Timestamp of when character was last used in a story';

COMMENT ON FUNCTION get_character_history(UUID) IS 
'Returns the story history for a given character (last 10 stories)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Character Memory feature database setup is complete!
-- Next steps:
-- 1. Update TypeScript types
-- 2. Create backend functions to record character appearances
-- 3. Modify story generation to include character memory
-- 4. Add UI components to display character history

