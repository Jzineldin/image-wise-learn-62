-- Add video generation support to story segments
-- This migration adds fields for video URLs and generation status

-- Add video fields to story_segments table
ALTER TABLE public.story_segments 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_provider TEXT,
ADD COLUMN IF NOT EXISTS video_generation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS video_task_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.story_segments.video_url IS 'URL of the generated video for this segment';
COMMENT ON COLUMN public.story_segments.video_provider IS 'Provider used for video generation (e.g., freepik_hailuo, freepik_wan)';
COMMENT ON COLUMN public.story_segments.video_generation_status IS 'Status of video generation: pending, processing, completed, failed';
COMMENT ON COLUMN public.story_segments.video_task_id IS 'Freepik API task ID for polling video generation status';

-- Add index for querying segments by video status
CREATE INDEX IF NOT EXISTS idx_story_segments_video_status 
ON public.story_segments(video_generation_status) 
WHERE video_generation_status IN ('pending', 'processing');

-- Add full story video support to stories table
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS full_story_video_url TEXT,
ADD COLUMN IF NOT EXISTS full_story_video_status TEXT DEFAULT 'not_started';

COMMENT ON COLUMN public.stories.full_story_video_url IS 'URL of the complete story video (all segments combined)';
COMMENT ON COLUMN public.stories.full_story_video_status IS 'Status of full story video: not_started, processing, completed, failed';

