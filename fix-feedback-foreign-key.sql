-- ============================================================================
-- FIX: Foreign Key Relationship for user_feedback
-- ============================================================================
-- Error: "Could not find a relationship between 'user_feedback' and 'user_id'"
-- This means the foreign key constraint is missing or broken

-- STEP 1: Check if the foreign key exists
-- ============================================================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='user_feedback';

-- If this returns empty, the foreign key is missing

-- ============================================================================
-- STEP 2: Drop existing foreign key if it exists (to recreate it properly)
-- ============================================================================
ALTER TABLE public.user_feedback 
DROP CONSTRAINT IF EXISTS user_feedback_user_id_fkey;

-- ============================================================================
-- STEP 3: Add the foreign key constraint properly
-- ============================================================================
ALTER TABLE public.user_feedback
ADD CONSTRAINT user_feedback_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================================================
-- STEP 4: Verify the foreign key was created
-- ============================================================================
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='user_feedback';

-- Expected: Should show user_feedback.user_id -> auth.users.id

-- ============================================================================
-- STEP 5: Make sure you're still an admin
-- ============================================================================
UPDATE profiles 
SET is_admin = true 
WHERE email = 'jzineldin@gmail.com';

-- ============================================================================
-- STEP 6: Test the query
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
-- SUCCESS!
-- ============================================================================
-- After running this, refresh your browser and the feedback should load!

