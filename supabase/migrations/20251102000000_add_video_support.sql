-- Add video support to story_segments
ALTER TABLE story_segments
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS video_generation_status text DEFAULT 'pending';

-- Create index for video generation status
CREATE INDEX IF NOT EXISTS idx_story_segments_video_status
ON story_segments(video_generation_status);

-- Create story-videos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-videos', 'story-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for story-videos bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public can view story videos'
  ) THEN
    CREATE POLICY "Public can view story videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'story-videos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload story videos'
  ) THEN
    CREATE POLICY "Authenticated users can upload story videos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'story-videos'
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Service role can manage story videos'
  ) THEN
    CREATE POLICY "Service role can manage story videos"
    ON storage.objects FOR ALL
    USING (bucket_id = 'story-videos' AND auth.role() = 'service_role');
  END IF;
END $$;
