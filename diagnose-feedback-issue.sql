-- ============================================================================
-- DIAGNOSTIC: Feedback Loading Issue
-- ============================================================================
-- Run this to diagnose why feedback isn't loading

-- 1. Check if you're an admin
SELECT 
  id, 
  email, 
  is_admin,
  created_at
FROM profiles 
WHERE email = 'jzineldin@gmail.com';

-- Expected: is_admin should be TRUE
-- If FALSE or NULL, you need to be made admin

-- ============================================================================

-- 2. Check if user_feedback table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_feedback'
) AS table_exists;

-- Expected: TRUE
-- If FALSE, table doesn't exist and needs to be created

-- ============================================================================

-- 3. Check current RLS policies on user_feedback
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_feedback'
ORDER BY policyname;

-- Expected: Should see 4 policies including "Admins can view all feedback"

-- ============================================================================

-- 4. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_feedback';

-- Expected: rowsecurity should be TRUE

-- ============================================================================

-- 5. Count feedback records
SELECT COUNT(*) as total_feedback
FROM user_feedback;

-- This will fail if you don't have permission
-- If it works, it shows how many feedback records exist

-- ============================================================================

-- 6. Try to select feedback (this is what the admin panel does)
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

-- If this fails, you'll see the exact error
-- If it works, feedback should load in admin panel

-- ============================================================================

