-- Create video_generation_jobs table for async video processing
-- This enables background video generation with real-time status updates

CREATE TABLE IF NOT EXISTS video_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES story_segments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  include_narration BOOLEAN DEFAULT false,
  video_url TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment to table
COMMENT ON TABLE video_generation_jobs IS 'Tracks async video generation jobs for background processing';

-- Indexes for efficient queries
CREATE INDEX idx_video_jobs_status ON video_generation_jobs(status, created_at);
CREATE INDEX idx_video_jobs_segment ON video_generation_jobs(segment_id);
CREATE INDEX idx_video_jobs_created ON video_generation_jobs(created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER video_job_updated_at
  BEFORE UPDATE ON video_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_video_job_updated_at();

-- Enable Row Level Security
ALTER TABLE video_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view their own video generation jobs
CREATE POLICY "Users can view their own video jobs"
  ON video_generation_jobs
  FOR SELECT
  USING (
    segment_id IN (
      SELECT ss.id
      FROM story_segments ss
      JOIN stories s ON s.id = ss.story_id
      WHERE s.user_id = auth.uid()
    )
  );

-- Allow service role to manage all jobs
CREATE POLICY "Service role can manage all video jobs"
  ON video_generation_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE video_generation_jobs;

-- Add comment explaining Realtime
COMMENT ON TABLE video_generation_jobs IS 'Tracks async video generation jobs. Realtime enabled for instant status updates to frontend.';
