# Tale Forge - User Migration Quick Start

**Status:** ✅ READY TO RUN  
**Time:** 15 minutes  
**Users:** ~10 users from old project

---

## 🎉 GOOD NEWS!

Your migration script is **100% configured and ready to run!**

I've already added:
- ✅ Old project URL and key (fyihypkigbcmsxyvseca)
- ✅ New project URL and key (hlrvpuqwurtdbjkramcp)
- ✅ Dry run mode enabled (safe to test)

---

## 🚀 STEP 1: INSTALL DEPENDENCIES (2 minutes)

Open your terminal in the project directory and run:

```bash
npm install @supabase/supabase-js
```

**Expected output:**
```
added 1 package, and audited 2 packages in 3s
```

---

## 🧪 STEP 2: DRY RUN (Test First - 5 minutes)

**The script is already in dry run mode!** This means it will show you what it WOULD do without actually making any changes.

**Run the dry run:**

```bash
node migrate-users-from-old-project.js
```

**What you should see:**

```
🚀 Starting Tale Forge User Migration
=====================================
📊 Old Project: https://fyihypkigbcmsxyvseca.supabase.co
📊 New Project: https://hlrvpuqwurtdbjkramcp.supabase.co
🔧 Dry Run: YES (no changes will be made)
=====================================

⚠️  DRY RUN MODE - No data will be migrated

📥 Step 1: Fetching users from old project...
✅ Found 10 users to migrate

👤 [1/10] Migrating user: user1@example.com
─────────────────────────────────────
  📝 Creating auth user...
  ⏭️  Skipped (dry run)
  📝 Migrating profile...
  ⏭️  Skipped (dry run)
     Profile data: {
       "username": "user1",
       "full_name": "User One",
       "role": "user",
       ...
     }
  📝 Migrating stories...
  ⏭️  Would migrate 3 stories (dry run)
  📝 Migrating characters...
  ⏭️  Would migrate 2 characters (dry run)
  📝 Migrating credits...
  ⏭️  Would migrate 100 credits (dry run)
  ✅ Migration complete for user1@example.com

[... continues for all 10 users ...]

=====================================
📊 MIGRATION SUMMARY
=====================================
Total Users:           10
Users Migrated:        0 (dry run)
Profiles Migrated:     0 (dry run)
Stories Migrated:      0 (dry run)
Characters Migrated:   0 (dry run)
=====================================

⚠️  This was a DRY RUN - no data was actually migrated
Set MIGRATE_OPTIONS.dryRun = false to perform actual migration
```

---

## ✅ STEP 3: REVIEW DRY RUN OUTPUT

**Check these things:**

1. **Did it find 10 users?**
   - Look for: `✅ Found 10 users to migrate`
   - If not, there might be an issue with the old project

2. **Does the profile data look correct?**
   - Check usernames, full_names, roles
   - Make sure it's your actual user data

3. **Are stories/characters detected?**
   - Look for: `Would migrate X stories`
   - This tells you how much data will be migrated

4. **Any errors?**
   - Look for ❌ symbols
   - If you see errors, share them with me!

**If everything looks good, proceed to Step 4!**

---

## 🚀 STEP 4: ACTUAL MIGRATION (5 minutes)

**Now let's do the real migration!**

### 4.1: Enable Real Migration

Open `migrate-users-from-old-project.js` in your code editor.

Find this line (around line 40):
```javascript
dryRun: true,  // Set to true to test without actually migrating
```

Change it to:
```javascript
dryRun: false,  // Real migration - will make changes!
```

**Save the file!**

---

### 4.2: Run the Migration

```bash
node migrate-users-from-old-project.js
```

**What you should see:**

```
🚀 Starting Tale Forge User Migration
=====================================
📊 Old Project: https://fyihypkigbcmsxyvseca.supabase.co
📊 New Project: https://hlrvpuqwurtdbjkramcp.supabase.co
🔧 Dry Run: NO (will migrate data)
=====================================

📥 Step 1: Fetching users from old project...
✅ Found 10 users to migrate

👤 [1/10] Migrating user: user1@example.com
─────────────────────────────────────
  📝 Creating auth user...
  ✅ Auth user created
  📝 Migrating profile...
  ✅ Profile migrated
  📝 Migrating stories...
  📚 Migrating 3 stories...
  ✅ Migrated 3 stories
  📝 Migrating characters...
  🎭 Migrating 2 characters...
  ✅ Migrated 2 characters
  📝 Migrating credits...
  ✅ Migrated 100 credits
  📧 Sending password reset email...
  ✅ Password reset email sent
  ✅ Migration complete for user1@example.com

[... continues for all 10 users ...]

=====================================
📊 MIGRATION SUMMARY
=====================================
Total Users:           10
Users Migrated:        10 ✅
Users Failed:          0 ❌
Profiles Migrated:     10 ✅
Profiles Failed:       0 ❌
Stories Migrated:      25 ✅
Stories Failed:        0 ❌
Characters Migrated:   15 ✅
Characters Failed:     0 ❌
=====================================

✅ Migration complete!

📧 Password reset emails have been sent to all users
Users will need to check their email and set a new password
```

**If you see this, you're done!** 🎉

---

## ✅ STEP 5: VERIFY MIGRATION (3 minutes)

### Check New Project (hlrvpuqwurtdbjkramcp):

1. **Go to:** https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp

2. **Authentication → Users**
   - ✅ Should see 10 users
   - ✅ All should have "Confirmed" status
   - ✅ Check emails match your old users

3. **Table Editor → profiles**
   - ✅ Should see 10 rows
   - ✅ Check usernames look correct
   - ✅ Check full_names are there

4. **Table Editor → stories**
   - ✅ Should see all migrated stories
   - ✅ Check user_id column (should be new UUIDs)

5. **Table Editor → user_characters**
   - ✅ Should see all migrated characters
   - ✅ Check user_id column

6. **Table Editor → user_credits**
   - ✅ Should see credit balances
   - ✅ Check credits_remaining

**Everything there? Perfect!** ✅

---

## 📧 STEP 6: USERS CAN NOW LOG IN

**Your users already received password reset emails!**

They just need to:
1. Check their email (from Supabase)
2. Click "Reset Password"
3. Set a new password
4. Log in to https://tale-forge.app

**That's it!** They're migrated and ready to use the new version.

---

## 🆘 TROUBLESHOOTING

### "Error: fetch failed" or "Network error"
**Solution:** Check your internet connection and try again

### "Error: Invalid API key"
**Solution:** Double-check the service role keys in the script

### "Error: User already exists"
**Solution:** That's okay! The script will skip and continue. This happens if you run the script twice.

### "Some users failed to migrate"
**Solution:** Check the error summary at the end. Share the errors with me and I'll help!

### "Users can't log in"
**Solution:** 
1. Make sure they clicked the password reset link
2. Check if they're using the correct email
3. Try sending another password reset from Supabase dashboard

### "Stories are missing"
**Solution:** 
1. Check if stories table exists in new project
2. Run the script again (it's safe!)
3. Check the migration summary for errors

---

## 🎯 WHAT IF I NEED TO RUN IT AGAIN?

**No problem!** The script is safe to run multiple times.

It will:
- ✅ Skip users that already exist
- ✅ Update profiles if they changed
- ✅ Skip stories that already exist
- ✅ Not create duplicates

**Just run:**
```bash
node migrate-users-from-old-project.js
```

---

## 📊 EXPECTED RESULTS

### If you have 10 users with typical data:

**Migration Summary:**
- Total Users: 10
- Users Migrated: 10 ✅
- Profiles Migrated: 10 ✅
- Stories Migrated: 20-30 ✅ (depends on how many stories each user has)
- Characters Migrated: 10-20 ✅ (depends on how many characters each user has)
- Credits Migrated: 10 ✅

**Time:** 5-10 minutes total

---

## ✅ CHECKLIST

### Before Running:
- [x] Dependencies installed (`npm install @supabase/supabase-js`)
- [x] Script configured with correct keys
- [x] Dry run mode enabled

### Dry Run:
- [ ] Ran dry run successfully
- [ ] Verified 10 users found
- [ ] Reviewed profile data
- [ ] No errors in output

### Actual Migration:
- [ ] Changed `dryRun: false`
- [ ] Ran actual migration
- [ ] All 10 users migrated successfully
- [ ] No errors in summary

### Verification:
- [ ] Checked new project has 10 users
- [ ] Checked profiles table has 10 rows
- [ ] Checked stories migrated
- [ ] Checked characters migrated
- [ ] Checked credits migrated

### After Migration:
- [ ] Users notified (they got password reset emails)
- [ ] Tested 1-2 users can log in
- [ ] Old project kept running (1 week safety net)

---

## 🎉 SUCCESS!

**If you see:**
```
✅ Migration complete!
📧 Password reset emails have been sent to all users
```

**You're done!** 🎊

Your 10 users are now in the new project (hlrvpuqwurtdbjkramcp) and can log in with their new passwords.

---

## 💬 NEED HELP?

**If you run into any issues:**

1. **Check the error message** in the terminal
2. **Look at the TROUBLESHOOTING section** above
3. **Share the error with me** and I'll help debug!

**Common questions:**
- "Can I test with 1 user first?" → Yes! Modify the script to only migrate 1 email
- "What if I made a mistake?" → Just run the script again, it's safe!
- "Can I migrate more data later?" → Yes! Just run the script again

---

## 📝 NEXT STEPS AFTER MIGRATION

1. **Keep old project running** for 1 week (safety net)
2. **Test with 1-2 users** to make sure login works
3. **Monitor for issues** in the first few days
4. **After 1 week:** Backup and pause old project
5. **Update your social media posts** with the new user count!

---

**Ready to migrate?** 🚀

**Just run:**
```bash
# Step 1: Install dependencies
npm install @supabase/supabase-js

# Step 2: Dry run (test)
node migrate-users-from-old-project.js

# Step 3: Review output, then change dryRun to false

# Step 4: Actual migration
node migrate-users-from-old-project.js

# Step 5: Verify in Supabase dashboard
```

**Total time: 15 minutes**

**Let's do this!** 💪

