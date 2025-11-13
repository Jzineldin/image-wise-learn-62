-- ============================================================================
-- COMPLETE FIX: Feedback Loading Issue
-- ============================================================================
-- This will fix EVERYTHING needed for feedback to work

-- STEP 1: Make sure you're an admin
-- ============================================================================
UPDATE profiles 
SET is_admin = true 
WHERE email = 'jzineldin@gmail.com';

-- Verify it worked
SELECT id, email, is_admin 
FROM profiles 
WHERE email = 'jzineldin@gmail.com';

-- Expected: is_admin = TRUE

-- ============================================================================
-- STEP 2: Drop ALL existing policies (clean slate)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can update all feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_feedback;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_feedback;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_feedback;

-- ============================================================================
-- STEP 3: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create NEW policies (correct ones)
-- ============================================================================

-- Policy 1: Admins can view ALL feedback
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

-- Policy 2: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Policy 3: Authenticated users can insert feedback
CREATE POLICY "Users can insert feedback"
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

-- Policy 5: Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
ON public.user_feedback
FOR UPDATE
USING (
  auth.uid() = user_id
);

-- ============================================================================
-- STEP 5: Verify policies were created
-- ============================================================================
SELECT 
  policyname, 
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'user_feedback'
ORDER BY policyname;

-- Expected: Should see 5 policies

-- ============================================================================
-- STEP 6: Test if you can now query feedback
-- ============================================================================
SELECT 
  id,
  user_id,
  feedback_type,
  subject,
  message,
  status,
  created_at
FROM user_feedback
ORDER BY created_at DESC
LIMIT 5;

-- If this works, the admin panel should work too!

-- ============================================================================
-- STEP 7: Count total feedback
-- ============================================================================
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN status = 'new' THEN 1 END) as new_feedback,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
FROM user_feedback;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If all queries above worked without errors, your feedback should now load!
-- Refresh your admin panel (Ctrl+R or Cmd+R) and check the Feedback tab.

