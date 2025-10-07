-- Create story_drafts table for auto-save functionality
-- This enables users to save their story creation progress without losing data

CREATE TABLE IF NOT EXISTS public.story_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Story creation data
  age_group TEXT,
  genres TEXT[] DEFAULT '{}',
  selected_characters JSONB DEFAULT '[]',
  selected_seed JSONB,
  custom_seed TEXT,
  current_step INTEGER DEFAULT 1,
  language_code TEXT DEFAULT 'en',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one draft per user
  CONSTRAINT story_drafts_user_unique UNIQUE (user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS story_drafts_user_id_idx ON public.story_drafts(user_id);
CREATE INDEX IF NOT EXISTS story_drafts_updated_at_idx ON public.story_drafts(updated_at);

-- Enable RLS
ALTER TABLE public.story_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own draft"
  ON public.story_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own draft"
  ON public.story_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft"
  ON public.story_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft"
  ON public.story_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_story_draft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER story_drafts_updated_at
  BEFORE UPDATE ON public.story_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_story_draft_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.story_drafts IS 'Stores auto-saved story creation progress for users';