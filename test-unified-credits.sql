-- Test Script for Unified Credits Model
-- Run this in Supabase Studio SQL Editor

-- ===========================================
-- 1. Verify tables exist
-- ===========================================
SELECT 'Tables Check' as test_name;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('daily_quotas', 'user_credits', 'profiles')
ORDER BY table_name;

-- ===========================================
-- 2. Check new columns in profiles
-- ===========================================
SELECT 'Profiles Columns Check' as test_name;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('chapters_used_today', 'chapters_reset_at', 'last_daily_credit_at', 'onboarding_completed_at')
ORDER BY column_name;

-- ===========================================
-- 3. Check new columns in user_credits
-- ===========================================
SELECT 'User Credits Columns Check' as test_name;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_credits'
  AND column_name IN ('monthly_credits_granted', 'monthly_credits_used', 'credits_reset_at')
ORDER BY column_name;

-- ===========================================
-- 4. List all RPC functions
-- ===========================================
SELECT 'RPC Functions Check' as test_name;
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_quotas',
    'can_generate_chapter',
    'check_credit_entitlement',
    'increment_chapter_usage',
    'grant_daily_credits',
    'grant_subscriber_monthly_credits'
  )
ORDER BY routine_name;

-- ===========================================
-- 5. Create test user (if not exists)
-- ===========================================
-- Use a valid UUID format
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create profile for test user
INSERT INTO public.profiles (
  id,
  email,
  chapters_used_today,
  chapters_reset_at,
  subscription_status,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'test@example.com',
  0,
  NOW() + INTERVAL '1 day',
  'inactive',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  chapters_used_today = 0,
  chapters_reset_at = NOW() + INTERVAL '1 day';

-- Create user_credits for test user
INSERT INTO public.user_credits (
  user_id,
  current_balance,
  total_earned,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  100,
  100,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  current_balance = 100,
  total_earned = 100;

-- ===========================================
-- 6. Test get_user_quotas function
-- ===========================================
SELECT 'Test: get_user_quotas' as test_name;
SELECT get_user_quotas('00000000-0000-0000-0000-000000000001'::uuid);

-- ===========================================
-- 7. Test can_generate_chapter function
-- ===========================================
SELECT 'Test: can_generate_chapter (should allow)' as test_name;
SELECT can_generate_chapter('00000000-0000-0000-0000-000000000001'::uuid);

-- ===========================================
-- 8. Test check_credit_entitlement function
-- ===========================================
SELECT 'Test: check_credit_entitlement (TTS - should allow)' as test_name;
SELECT check_credit_entitlement('00000000-0000-0000-0000-000000000001'::uuid, 'tts', 40);

SELECT 'Test: check_credit_entitlement (Video - should allow)' as test_name;
SELECT check_credit_entitlement('00000000-0000-0000-0000-000000000001'::uuid, 'video', 30);

SELECT 'Test: check_credit_entitlement (Video - should DENY)' as test_name;
SELECT check_credit_entitlement('00000000-0000-0000-0000-000000000001'::uuid, 'video', 150);

-- ===========================================
-- 9. Test increment_chapter_usage
-- ===========================================
SELECT 'Test: increment_chapter_usage' as test_name;
SELECT increment_chapter_usage('00000000-0000-0000-0000-000000000001'::uuid);

-- Verify chapter count increased
SELECT 'Verify: chapters_used_today should be 1' as test_name;
SELECT chapters_used_today
FROM public.profiles
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ===========================================
-- 10. Test daily limit (use all 4 chapters)
-- ===========================================
SELECT 'Test: Use remaining chapters' as test_name;
SELECT increment_chapter_usage('00000000-0000-0000-0000-000000000001'::uuid);
SELECT increment_chapter_usage('00000000-0000-0000-0000-000000000001'::uuid);
SELECT increment_chapter_usage('00000000-0000-0000-0000-000000000001'::uuid);

-- Should be gated now
SELECT 'Test: can_generate_chapter (should DENY after 4)' as test_name;
SELECT can_generate_chapter('00000000-0000-0000-0000-000000000001'::uuid);

-- ===========================================
-- Summary
-- ===========================================
SELECT '=== ALL TESTS COMPLETE ===' as summary;
