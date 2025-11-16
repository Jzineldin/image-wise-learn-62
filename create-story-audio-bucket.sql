-- Create story-audio storage bucket for TTS audio files
-- This must be run to fix the "Service temporarily unavailable" error

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-audio',
  'story-audio',
  true, -- Public bucket so audio URLs work without auth
  10485760, -- 10MB max file size
  ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Anyone can read audio files" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'story-audio');

CREATE POLICY "Authenticated users can upload audio" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'story-audio'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own audio" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'story-audio'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own audio" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'story-audio'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
