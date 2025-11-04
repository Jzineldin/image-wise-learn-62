-- ============================================
-- Story Lifecycle Enhancement Migration
-- ============================================
-- Adds "ready" state between draft and finalized
-- Adds per-chapter asset management fields
-- Adds story versioning for unfinalize/refinalize
-- ============================================

-- 1. Update stories table for new lifecycle
ALTER TABLE stories
  -- Add new status enum values if not exists
  DROP CONSTRAINT IF EXISTS stories_status_check,
  ADD CONSTRAINT stories_status_check
    CHECK (status IN ('draft', 'in_progress', 'ready', 'finalized', 'completed'));

-- Add lifecycle tracking fields
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft', 'ready', 'finalized')),
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'unlisted')),
  ADD COLUMN IF NOT EXISTS allow_featuring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS story_tags TEXT[],
  ADD COLUMN IF NOT EXISTS age_range TEXT;

-- Migrate existing data: map old status to new lifecycle_status
UPDATE stories
SET lifecycle_status = CASE
  WHEN status = 'completed' OR is_completed = true THEN 'finalized'
  WHEN status = 'in_progress' THEN 'draft'
  ELSE 'draft'
END
WHERE lifecycle_status = 'draft';

-- Set visibility based on existing is_public field
UPDATE stories
SET visibility = CASE
  WHEN is_public = true THEN 'public'
  ELSE 'private'
END
WHERE visibility = 'private';

-- Copy age_group to age_range if not set
UPDATE stories
SET age_range = age_group
WHERE age_range IS NULL AND age_group IS NOT NULL;

COMMENT ON COLUMN stories.lifecycle_status IS 'Story lifecycle: draft → ready (content complete) → finalized';
COMMENT ON COLUMN stories.visibility IS 'Story visibility: private (owner only), public (in Discover), unlisted (link-only)';
COMMENT ON COLUMN stories.allow_featuring IS 'User consent for admin to feature story on homepage';
COMMENT ON COLUMN stories.version IS 'Increments on each finalize; enables versioning';
COMMENT ON COLUMN stories.finalized_at IS 'Timestamp when story was finalized';
COMMENT ON COLUMN stories.ready_at IS 'Timestamp when story became ready (content complete)';
COMMENT ON COLUMN stories.story_tags IS 'Story-level tags (array of strings)';
COMMENT ON COLUMN stories.age_range IS 'Age range string (e.g., "7-9", "10-12")';

-- 2. Add per-chapter asset management to story_segments
ALTER TABLE story_segments
  -- Voice/Audio fields
  ADD COLUMN IF NOT EXISTS voice_status TEXT DEFAULT 'none'
    CHECK (voice_status IN ('none', 'queued', 'processing', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS voice_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_error TEXT,

  -- Animation/Video fields
  ADD COLUMN IF NOT EXISTS animation_status TEXT DEFAULT 'none'
    CHECK (animation_status IN ('none', 'queued', 'processing', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS animation_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS animation_error TEXT,

  -- Chapter details fields
  ADD COLUMN IF NOT EXISTS chapter_title TEXT,
  ADD COLUMN IF NOT EXISTS chapter_tags TEXT[],
  ADD COLUMN IF NOT EXISTS chapter_age_range TEXT,
  ADD COLUMN IF NOT EXISTS chapter_cover_url TEXT,
  ADD COLUMN IF NOT EXISTS details_status TEXT DEFAULT 'incomplete'
    CHECK (details_status IN ('complete', 'incomplete')),
  ADD COLUMN IF NOT EXISTS missing_fields TEXT[];

-- Migrate existing audio status
UPDATE story_segments
SET voice_status = CASE
  WHEN audio_generation_status = 'completed' AND audio_url IS NOT NULL THEN 'ready'
  WHEN audio_generation_status = 'pending' THEN 'queued'
  WHEN audio_generation_status = 'processing' THEN 'processing'
  WHEN audio_generation_status = 'failed' THEN 'failed'
  ELSE 'none'
END
WHERE voice_status = 'none';

-- Migrate existing video status
UPDATE story_segments
SET animation_status = CASE
  WHEN video_generation_status = 'completed' AND video_url IS NOT NULL THEN 'ready'
  WHEN video_generation_status = 'pending' THEN 'queued'
  WHEN video_generation_status = 'processing' THEN 'processing'
  WHEN video_generation_status = 'failed' THEN 'failed'
  ELSE 'none'
END
WHERE animation_status = 'none';

-- Set details_status based on whether segment has basic info
UPDATE story_segments
SET details_status = CASE
  WHEN content IS NOT NULL AND content != '' THEN 'complete'
  ELSE 'incomplete'
END
WHERE details_status = 'incomplete';

COMMENT ON COLUMN story_segments.voice_status IS 'Per-chapter voice generation status';
COMMENT ON COLUMN story_segments.voice_config IS 'Voice settings: {speakerId, style, speed}';
COMMENT ON COLUMN story_segments.voice_error IS 'Error message if voice generation failed';
COMMENT ON COLUMN story_segments.animation_status IS 'Per-chapter animation/video status';
COMMENT ON COLUMN story_segments.animation_config IS 'Animation settings: {prompt, durationSec, seed}';
COMMENT ON COLUMN story_segments.animation_error IS 'Error message if animation failed';
COMMENT ON COLUMN story_segments.chapter_title IS 'Optional custom title for this chapter';
COMMENT ON COLUMN story_segments.chapter_tags IS 'Chapter-specific tags';
COMMENT ON COLUMN story_segments.chapter_age_range IS 'Chapter-specific age range override';
COMMENT ON COLUMN story_segments.chapter_cover_url IS 'Chapter-specific cover/thumbnail';
COMMENT ON COLUMN story_segments.details_status IS 'Whether chapter details are complete';
COMMENT ON COLUMN story_segments.missing_fields IS 'List of missing required fields';

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_lifecycle_status ON stories(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_stories_visibility ON stories(visibility);
CREATE INDEX IF NOT EXISTS idx_stories_finalized_at ON stories(finalized_at DESC) WHERE finalized_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_segments_voice_status ON story_segments(voice_status);
CREATE INDEX IF NOT EXISTS idx_segments_animation_status ON story_segments(animation_status);
CREATE INDEX IF NOT EXISTS idx_segments_details_status ON story_segments(details_status);

-- 4. Create helper function to get story readiness summary
CREATE OR REPLACE FUNCTION get_story_readiness(story_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_chapters INT;
  voices_ready INT;
  animations_ready INT;
  details_complete INT;
  missing_voices INT;
  missing_animations INT;
  incomplete_details INT;
BEGIN
  SELECT COUNT(*) INTO total_chapters
  FROM story_segments
  WHERE story_id = story_uuid;

  SELECT COUNT(*) INTO voices_ready
  FROM story_segments
  WHERE story_id = story_uuid AND voice_status = 'ready';

  SELECT COUNT(*) INTO animations_ready
  FROM story_segments
  WHERE story_id = story_uuid AND animation_status = 'ready';

  SELECT COUNT(*) INTO details_complete
  FROM story_segments
  WHERE story_id = story_uuid AND details_status = 'complete';

  missing_voices := total_chapters - voices_ready;
  missing_animations := total_chapters - animations_ready;
  incomplete_details := total_chapters - details_complete;

  result := jsonb_build_object(
    'total_chapters', total_chapters,
    'voices_ready', voices_ready,
    'animations_ready', animations_ready,
    'details_complete', details_complete,
    'missing_voices', missing_voices,
    'missing_animations', missing_animations,
    'incomplete_details', incomplete_details,
    'all_voices_ready', missing_voices = 0,
    'all_animations_ready', missing_animations = 0,
    'all_details_complete', incomplete_details = 0,
    'fully_ready', (missing_voices = 0 AND missing_animations = 0 AND incomplete_details = 0)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_story_readiness IS 'Returns comprehensive readiness status for a story';

-- 5. Create function to move story to "ready" state
CREATE OR REPLACE FUNCTION mark_story_ready(story_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE stories
  SET
    lifecycle_status = 'ready',
    status = 'ready',
    ready_at = NOW()
  WHERE id = story_uuid
    AND lifecycle_status = 'draft'
  RETURNING jsonb_build_object(
    'success', true,
    'story_id', id,
    'lifecycle_status', lifecycle_status,
    'ready_at', ready_at
  ) INTO result;

  IF result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Story not found or already ready'
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_story_ready IS 'Moves story from draft to ready state (content complete)';

-- 6. Create function to finalize story
CREATE OR REPLACE FUNCTION finalize_story(
  story_uuid UUID,
  p_visibility TEXT DEFAULT 'private',
  p_allow_featuring BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  new_version INT;
BEGIN
  -- Increment version
  UPDATE stories
  SET version = version + 1
  WHERE id = story_uuid
  RETURNING version INTO new_version;

  -- Finalize story
  UPDATE stories
  SET
    lifecycle_status = 'finalized',
    status = 'completed',
    is_completed = true,
    visibility = p_visibility,
    allow_featuring = p_allow_featuring,
    finalized_at = NOW(),
    is_public = (p_visibility = 'public')
  WHERE id = story_uuid
  RETURNING jsonb_build_object(
    'success', true,
    'story_id', id,
    'lifecycle_status', lifecycle_status,
    'visibility', visibility,
    'version', version,
    'finalized_at', finalized_at
  ) INTO result;

  IF result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Story not found'
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finalize_story IS 'Finalizes story with visibility choice and version bump';

-- 7. Create function to unfinalize story
CREATE OR REPLACE FUNCTION unfinalize_story(story_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE stories
  SET
    lifecycle_status = 'ready',
    status = 'ready',
    is_completed = false,
    finalized_at = NULL
  WHERE id = story_uuid
    AND lifecycle_status = 'finalized'
  RETURNING jsonb_build_object(
    'success', true,
    'story_id', id,
    'lifecycle_status', lifecycle_status,
    'version', version
  ) INTO result;

  IF result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Story not found or not finalized'
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION unfinalize_story IS 'Moves finalized story back to ready state for editing';

-- 8. Create view for story lifecycle summary
CREATE OR REPLACE VIEW story_lifecycle_summary AS
SELECT
  s.id,
  s.title,
  s.user_id,
  s.lifecycle_status,
  s.visibility,
  s.version,
  s.ready_at,
  s.finalized_at,
  s.allow_featuring,
  COUNT(seg.id) as total_chapters,
  COUNT(seg.id) FILTER (WHERE seg.voice_status = 'ready') as voices_ready,
  COUNT(seg.id) FILTER (WHERE seg.animation_status = 'ready') as animations_ready,
  COUNT(seg.id) FILTER (WHERE seg.details_status = 'complete') as details_complete,
  COUNT(seg.id) FILTER (WHERE seg.voice_status = 'none') as voices_missing,
  COUNT(seg.id) FILTER (WHERE seg.animation_status = 'none') as animations_missing,
  COUNT(seg.id) FILTER (WHERE seg.details_status = 'incomplete') as details_incomplete
FROM stories s
LEFT JOIN story_segments seg ON s.id = seg.story_id
GROUP BY s.id;

COMMENT ON VIEW story_lifecycle_summary IS 'Quick overview of story lifecycle status and asset completeness';

-- 9. Enable RLS on new columns (inherit from table RLS)
-- RLS is already enabled on stories and story_segments tables

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION get_story_readiness TO authenticated;
GRANT EXECUTE ON FUNCTION mark_story_ready TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_story TO authenticated;
GRANT EXECUTE ON FUNCTION unfinalize_story TO authenticated;
GRANT SELECT ON story_lifecycle_summary TO authenticated;
