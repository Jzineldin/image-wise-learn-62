-- ============================================================================
-- FIX: Admin Feedback Access - RLS Policies
-- ============================================================================
-- This fixes the "Failed to load feedback" error in admin panel
-- Run this in Supabase Dashboard → SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON public.user_feedback;

-- Enable RLS (if not already enabled)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Policy 2: Admins can view ALL feedback (THIS IS THE KEY FIX!)
CREATE POLICY "Admins can view all feedback"
ON public.user_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy 3: Anyone can insert feedback (authenticated users)
CREATE POLICY "Users can insert their own feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Policy 4: Admins can update all feedback
CREATE POLICY "Admins can update all feedback"
ON public.user_feedback
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd
FROM pg_policies
WHERE tablename = 'user_feedback'
ORDER BY policyname;

