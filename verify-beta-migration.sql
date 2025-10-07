-- ============================================
-- BETA MIGRATION VERIFICATION SCRIPT
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- to verify the beta launch migration was applied
-- ============================================

-- 1. Check if beta columns exist in profiles table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_beta_user', 'beta_joined_at', 'founder_status')
ORDER BY column_name;

-- Expected Result:
-- column_name      | data_type                   | is_nullable
-- -----------------|-----------------------------|--------------
-- beta_joined_at   | timestamp without time zone | YES
-- founder_status   | text                        | YES
-- is_beta_user     | boolean                     | YES

-- ============================================

-- 2. Check if user_feedback table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_feedback'
) AS user_feedback_table_exists;

-- Expected Result: true

-- ============================================

-- 3. Check handle_new_user() function definition
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- Expected: Should return the function definition
-- Look for: "beta_credits INTEGER := 100"
-- Look for: "is_beta BOOLEAN := true"

-- ============================================

-- 4. Test with a sample query (doesn't create user, just checks structure)
SELECT 
  p.id,
  p.email,
  p.is_beta_user,
  p.beta_joined_at,
  p.founder_status,
  uc.current_balance
FROM profiles p
LEFT JOIN user_credits uc ON p.id = uc.user_id
LIMIT 1;

-- Expected: Query should run without errors
-- If you see "column does not exist" error, migration was NOT applied

-- ============================================

-- 5. Check if any users have beta status
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_beta_user = true THEN 1 END) as beta_users,
  COUNT(CASE WHEN founder_status = 'founder' THEN 1 END) as founders
FROM profiles;

-- Expected: 
-- - total_users: Your current user count
-- - beta_users: Should match founders if migration was applied
-- - founders: Number of users who signed up during beta

-- ============================================

-- 6. Check credit transactions for beta bonuses
SELECT 
  COUNT(*) as beta_bonus_transactions,
  SUM(amount) as total_beta_credits_granted
FROM credit_transactions
WHERE description LIKE '%Beta Founder Bonus%';

-- Expected:
-- - beta_bonus_transactions: Number of users who got beta bonus
-- - total_beta_credits_granted: Should be 100 * number of beta users

-- ============================================

-- 7. Sample beta user data (if any exist)
SELECT 
  p.email,
  p.is_beta_user,
  p.founder_status,
  p.beta_joined_at,
  uc.current_balance,
  ct.description,
  ct.amount,
  ct.created_at
FROM profiles p
LEFT JOIN user_credits uc ON p.id = uc.user_id
LEFT JOIN credit_transactions ct ON p.id = ct.user_id
WHERE p.is_beta_user = true
ORDER BY p.created_at DESC
LIMIT 5;

-- Expected: Shows recent beta users with:
-- - is_beta_user = true
-- - founder_status = 'founder'
-- - current_balance >= 100
-- - Transaction with "Beta Founder Bonus - 100 free credits! 🎉"

-- ============================================

-- 8. Check RLS policies for user_feedback table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_feedback';

-- Expected: Should show policies for:
-- - Users can insert their own feedback
-- - Users can view their own feedback
-- - Admins can view all feedback

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================

-- ✅ MIGRATION APPLIED SUCCESSFULLY IF:
-- 1. All three beta columns exist in profiles table
-- 2. user_feedback table exists
-- 3. handle_new_user() function contains "beta_credits := 100"
-- 4. Sample query runs without errors
-- 5. Beta users exist with founder_status = 'founder'

-- ❌ MIGRATION NOT APPLIED IF:
-- 1. "column does not exist" errors
-- 2. user_feedback table doesn't exist
-- 3. No beta users in database
-- 4. handle_new_user() function doesn't mention beta

-- ⚠️ MIGRATION PARTIALLY APPLIED IF:
-- 1. Columns exist but no beta users
-- 2. Function exists but not granting 100 credits
-- 3. Some queries work, others fail

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If migration was NOT applied:
-- 1. Check if migration file exists:
--    supabase/migrations/20250105000000_beta_launch_features.sql
-- 2. Run migration manually:
--    supabase db push
-- 3. Or apply via Supabase Dashboard:
--    Dashboard → SQL Editor → Paste migration file → Run

-- If migration was applied but not working:
-- 1. Check for errors in Supabase logs
-- 2. Verify trigger is enabled:
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected: Trigger should exist and be enabled

-- ============================================

