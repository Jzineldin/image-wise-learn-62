-- Create character-images storage bucket for character reference images
-- This migration creates the storage bucket and sets up RLS policies

-- Create the character-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-images',
  'character-images',
  true, -- Public bucket for character reference images
  10485760, -- 10MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects for character-images bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view character images (public bucket)
CREATE POLICY "Public character images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-images');

-- Policy: Authenticated users can upload their own character images
CREATE POLICY "Users can upload their own character images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'character-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own character images
CREATE POLICY "Users can update their own character images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'character-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own character images
CREATE POLICY "Users can delete their own character images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'character-images' 
  AND auth.role() = 'authenticated'
);

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. character-images bucket stores AI-generated character reference images for maintaining character consistency across story segments.';

