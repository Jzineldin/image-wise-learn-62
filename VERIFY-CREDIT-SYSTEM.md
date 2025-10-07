# 🔍 Verify Credit System - Testing Guide

## ⚠️ IMPORTANT: Run Migration First!

Before testing, make sure you've successfully run the migration:

### **Step 1: Run the Migration**

1. Open Supabase Dashboard → SQL Editor
2. Copy the **ENTIRE** contents of `supabase/migrations/20250105000000_beta_launch_features.sql`
3. Paste and click "Run"
4. Verify no errors

---

## ✅ Verification Steps

### **Step 2: Verify Migration Was Applied**

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Check if new columns exist in profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_beta_user', 'beta_joined_at', 'founder_status');
```

**Expected Result:**
```
column_name      | data_type
-----------------|-----------
is_beta_user     | boolean
beta_joined_at   | timestamp with time zone
founder_status   | text
```

If you see all 3 columns, ✅ migration was successful!

---

### **Step 3: Verify handle_new_user Function**

Run this SQL to check the function:

```sql
-- View the handle_new_user function
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Look for:**
- `beta_credits INTEGER := 100` (should be 100, not 10)
- `is_beta BOOLEAN := true` (should be true)
- `'Beta Founder Bonus - 100 free credits! 🎉'` (should see this message)

---

### **Step 4: Test with a New User**

**Option A: Create Test Account (Recommended)**

1. Open your app in **incognito/private window**
2. Go to `/auth`
3. Sign up with a test email: `test-founder-1@example.com`
4. Complete signup

**Option B: Use SQL to Simulate**

```sql
-- Simulate new user signup (for testing only)
-- Replace 'test@example.com' with your test email
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users (simulating signup)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'test-founder-2@example.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    '{"full_name": "Test Founder"}'::jsonb,
    now(),
    now()
  );
  
  -- Trigger should fire automatically and create profile + credits
  RAISE NOTICE 'Test user created with ID: %', test_user_id;
END $$;
```

---

### **Step 5: Verify User Got 100 Credits**

Run this SQL to check the test user:

```sql
-- Check the most recent user
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.is_beta_user,
  p.beta_joined_at,
  p.founder_status,
  uc.current_balance,
  uc.total_earned,
  ct.description,
  ct.amount,
  ct.created_at
FROM profiles p
LEFT JOIN user_credits uc ON p.id = uc.user_id
LEFT JOIN credit_transactions ct ON p.id = ct.user_id
WHERE p.created_at > now() - interval '1 hour'
ORDER BY p.created_at DESC
LIMIT 5;
```

**Expected Result:**
```
email                      | is_beta_user | founder_status | current_balance | amount | description
---------------------------|--------------|----------------|-----------------|--------|---------------------------
test-founder-1@example.com | true         | founder        | 100             | 100    | Beta Founder Bonus - 100 free credits! 🎉
```

**✅ If you see:**
- `is_beta_user = true`
- `founder_status = 'founder'`
- `current_balance = 100`
- `amount = 100`
- Description: "Beta Founder Bonus - 100 free credits! 🎉"

**Then the system is working perfectly!** 🎉

---

## ❌ Troubleshooting

### **Problem: User got 10 credits instead of 100**

**Cause:** Old `handle_new_user()` function is still active

**Fix:**
1. Re-run the migration (Step 1)
2. Make sure you copied the ENTIRE file
3. Check for errors in SQL Editor

---

### **Problem: Columns don't exist**

**Cause:** Migration didn't run successfully

**Fix:**
1. Check SQL Editor for errors
2. Run this to add columns manually:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_beta_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS beta_joined_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS founder_status TEXT DEFAULT NULL;
```

---

### **Problem: No founder badge showing**

**Cause:** Frontend not fetching beta status

**Fix:**
1. Make sure you deployed the latest code
2. Clear browser cache
3. Check browser console for errors

---

## 🧪 Complete Test Checklist

Run through this checklist:

- [ ] Migration ran without errors
- [ ] New columns exist in profiles table
- [ ] `handle_new_user()` function shows 100 credits
- [ ] Created test user account
- [ ] Test user has `is_beta_user = true`
- [ ] Test user has `founder_status = 'founder'`
- [ ] Test user has `current_balance = 100`
- [ ] Credit transaction shows "Beta Founder Bonus - 100 free credits! 🎉"
- [ ] Founder badge appears in UI
- [ ] User can create stories with credits

---

## 📊 Quick Check Query

Run this to see all beta users:

```sql
SELECT 
  p.email,
  p.is_beta_user,
  p.founder_status,
  p.beta_joined_at,
  uc.current_balance,
  p.created_at
FROM profiles p
LEFT JOIN user_credits uc ON p.id = uc.user_id
WHERE p.is_beta_user = true
ORDER BY p.created_at DESC;
```

---

## 🎯 Expected Behavior

### **New User Signup Flow:**

1. User goes to `/auth`
2. Fills out signup form
3. Clicks "Sign Up"
4. **Trigger fires:** `handle_new_user()`
5. **Profile created** with:
   - `is_beta_user = true`
   - `beta_joined_at = now()`
   - `founder_status = 'founder'`
6. **Credits created** with:
   - `current_balance = 100`
   - `total_earned = 100`
7. **Transaction recorded:**
   - `amount = 100`
   - `description = 'Beta Founder Bonus - 100 free credits! 🎉'`
8. User sees:
   - "100 Credits" in navigation
   - Founder badge (crown icon)
   - Welcome message

---

## 🔧 Manual Fix (If Needed)

If a user somehow got 10 credits instead of 100, you can fix it manually:

```sql
-- Fix specific user (replace email)
UPDATE user_credits
SET 
  current_balance = 100,
  total_earned = 100
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'user@example.com'
);

-- Update their profile
UPDATE profiles
SET 
  is_beta_user = true,
  beta_joined_at = now(),
  founder_status = 'founder'
WHERE email = 'user@example.com';

-- Add transaction record
INSERT INTO credit_transactions (
  user_id,
  transaction_type,
  amount,
  balance_after,
  description
)
SELECT 
  id,
  'bonus',
  90, -- Additional 90 credits (they already have 10)
  100,
  'Beta Founder Bonus Adjustment - Upgraded to 100 credits! 🎉'
FROM profiles
WHERE email = 'user@example.com';
```

---

## ✅ Success Criteria

**The system is working if:**

1. ✅ New users get 100 credits (not 10)
2. ✅ New users have `is_beta_user = true`
3. ✅ New users have `founder_status = 'founder'`
4. ✅ Founder badge appears in UI
5. ✅ Credit transaction shows correct message
6. ✅ Users can create stories with credits

---

## 🚀 Next Steps

Once verified:

1. ✅ Test with real signup (incognito window)
2. ✅ Verify founder badge shows
3. ✅ Create a story to test credits work
4. ✅ Check admin panel shows user correctly
5. ✅ Deploy to production
6. ✅ Post on LinkedIn!

---

**If everything checks out, you're ready to launch! 🎉**

---

**Created:** January 2025  
**Status:** Testing guide  
**Version:** 1.0

