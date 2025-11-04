-- Ensure ON CONFLICT (story_id) works by adding a unique constraint
-- This fixes error 42P10: no unique or exclusion constraint matching the ON CONFLICT specification

BEGIN;

-- Add unique constraint on story_id if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'featured_stories'
      AND n.nspname = 'public'
      AND c.conname = 'featured_stories_story_id_unique'
  ) THEN
    ALTER TABLE public.featured_stories
    ADD CONSTRAINT featured_stories_story_id_unique UNIQUE (story_id);
  END IF;
END $$;

COMMIT;