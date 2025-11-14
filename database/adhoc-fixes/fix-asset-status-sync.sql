-- ============================================
-- Fix: Sync old status columns to new lifecycle columns
-- ============================================
-- Issue: Edge Functions were updating old columns (audio_generation_status, video_generation_status)
-- but StoryReady page reads from new columns (voice_status, animation_status)
-- This caused chapters to show "No Voice, No Animation" even though assets were generated
--
-- Root cause: Migration only ran once with WHERE voice_status = 'none' condition
-- This script syncs existing data from old columns to new columns
-- ============================================

-- Sync voice_status from audio_generation_status
UPDATE story_segments
SET voice_status = CASE
  WHEN audio_generation_status = 'completed' AND audio_url IS NOT NULL THEN 'ready'
  WHEN audio_generation_status = 'in_progress' OR audio_generation_status = 'pending' THEN 'processing'
  WHEN audio_generation_status = 'processing' THEN 'processing'
  WHEN audio_generation_status = 'failed' THEN 'failed'
  ELSE voice_status  -- Keep current value if no mapping
END
WHERE audio_generation_status IS NOT NULL
  AND audio_generation_status != '';

-- Sync animation_status from video_generation_status
UPDATE story_segments
SET animation_status = CASE
  WHEN video_generation_status = 'completed' AND video_url IS NOT NULL THEN 'ready'
  WHEN video_generation_status = 'in_progress' OR video_generation_status = 'pending' THEN 'processing'
  WHEN video_generation_status = 'processing' THEN 'processing'
  WHEN video_generation_status = 'failed' THEN 'failed'
  ELSE animation_status  -- Keep current value if no mapping
END
WHERE video_generation_status IS NOT NULL
  AND video_generation_status != '';

-- Log the changes for verification
DO $$
DECLARE
  voice_updated INT;
  animation_updated INT;
BEGIN
  -- Count how many rows were updated
  SELECT COUNT(*) INTO voice_updated
  FROM story_segments
  WHERE voice_status = 'ready' AND audio_url IS NOT NULL;

  SELECT COUNT(*) INTO animation_updated
  FROM story_segments
  WHERE animation_status = 'ready' AND video_url IS NOT NULL;

  RAISE NOTICE 'Asset status sync complete:';
  RAISE NOTICE '  - Segments with ready voice status: %', voice_updated;
  RAISE NOTICE '  - Segments with ready animation status: %', animation_updated;
END $$;
