# Tale Forge - User Migration Guide

**From:** Old project (fyihypkigbcmsxyvseca)  
**To:** New project (your current Tale Forge)  
**Users:** ~10 users  
**Time:** 30-45 minutes

---

## 🎯 WHAT THIS WILL DO

This migration will transfer:
- ✅ **Auth users** (email, metadata)
- ✅ **Profiles** (username, full_name, avatar, role)
- ✅ **Stories** (all user stories)
- ✅ **Characters** (all user characters)
- ✅ **Credits** (credit balances)
- ✅ **Password reset emails** (users can set new passwords)

---

## 📋 PREREQUISITES

### 1. Install Node.js (if not installed)
Check if you have Node.js:
```bash
node --version
```

If not installed, download from: https://nodejs.org

### 2. Install Supabase JS Library
```bash
npm install @supabase/supabase-js
```

---

## 🔑 STEP 1: GET SERVICE ROLE KEYS (10 minutes)

### Old Project (fyihypkigbcmsxyvseca):

1. Go to: https://supabase.com/dashboard/project/fyihypkigbcmsxyvseca
2. Click **Settings** (left sidebar)
3. Click **API**
4. Scroll to **Project API keys**
5. Copy the **`service_role`** key (secret!)
6. Save it somewhere safe

**Your old project URL:**
```
https://fyihypkigbcmsxyvseca.supabase.co
```

---

### New Project (Current Tale Forge):

1. Go to your current Supabase project dashboard
2. Click **Settings** (left sidebar)
3. Click **API**
4. Scroll to **Project API keys**
5. Copy the **`service_role`** key (secret!)
6. Copy the **Project URL** (e.g., `https://zfczvngxnpdchicotipf.supabase.co`)
7. Save both somewhere safe

---

## 📝 STEP 2: CONFIGURE MIGRATION SCRIPT (5 minutes)

1. Open `migrate-users-from-old-project.js`

2. Update these lines (around line 20-30):

```javascript
// Old project (source) - fyihypkigbcmsxyvseca
const OLD_PROJECT_URL = 'https://fyihypkigbcmsxyvseca.supabase.co'
const OLD_SERVICE_ROLE_KEY = 'YOUR_OLD_SERVICE_ROLE_KEY_HERE' // Paste the key you copied

// New project (destination) - Your current Tale Forge project
const NEW_PROJECT_URL = 'https://YOUR_NEW_PROJECT_ID.supabase.co' // Paste your new project URL
const NEW_SERVICE_ROLE_KEY = 'YOUR_NEW_SERVICE_ROLE_KEY_HERE' // Paste the key you copied
```

3. **Save the file**

---

## 🧪 STEP 3: DRY RUN (Test First - 5 minutes)

**IMPORTANT:** Always do a dry run first to see what will happen!

The script is already set to dry run mode by default:
```javascript
dryRun: false,  // Change to true for testing
```

**Change it to:**
```javascript
dryRun: true,  // Test mode - no changes will be made
```

**Run the dry run:**
```bash
node migrate-users-from-old-project.js
```

**What you'll see:**
```
🚀 Starting Tale Forge User Migration
=====================================
📊 Old Project: https://fyihypkigbcmsxyvseca.supabase.co
📊 New Project: https://YOUR_PROJECT.supabase.co
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
     Profile data: { username: "user1", full_name: "User One", ... }
  📝 Migrating stories...
  ⏭️  Would migrate 3 stories (dry run)
  ...
```

**Review the output:**
- ✅ Check that it found all 10 users
- ✅ Check that profile data looks correct
- ✅ Check that stories/characters are detected
- ✅ Look for any errors

**If everything looks good, proceed to Step 4!**

---

## 🚀 STEP 4: ACTUAL MIGRATION (10 minutes)

**Now let's do the real migration!**

1. Open `migrate-users-from-old-project.js`

2. Change dry run to false:
```javascript
dryRun: false,  // Real migration - will make changes!
```

3. **Save the file**

4. **Run the migration:**
```bash
node migrate-users-from-old-project.js
```

**What you'll see:**
```
🚀 Starting Tale Forge User Migration
=====================================
📊 Old Project: https://fyihypkigbcmsxyvseca.supabase.co
📊 New Project: https://YOUR_PROJECT.supabase.co
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

**If you see errors, don't panic!** Common issues:
- User already exists → Script will skip and continue
- Profile already exists → Script will update it
- Network timeout → Just run the script again

---

## ✅ STEP 5: VERIFY MIGRATION (10 minutes)

### Check New Project:

1. **Go to new Supabase project**
2. **Authentication → Users**
   - ✅ Should see all 10 users
   - ✅ All should have "Confirmed" status

3. **Table Editor → profiles**
   - ✅ Should see 10 profiles
   - ✅ Check usernames, full_names are correct

4. **Table Editor → stories**
   - ✅ Should see all migrated stories
   - ✅ Check user_id matches new user IDs

5. **Table Editor → user_characters**
   - ✅ Should see all migrated characters
   - ✅ Check user_id matches new user IDs

6. **Table Editor → user_credits**
   - ✅ Should see credit balances
   - ✅ Check credits_remaining is correct

---

## 📧 STEP 6: NOTIFY USERS (10 minutes)

**Option 1: They Already Got Password Reset Emails**

If `sendPasswordResets: true` (default), users already received emails from Supabase.

They just need to:
1. Check their email
2. Click "Reset Password"
3. Set a new password
4. Log in to tale-forge.app

---

**Option 2: Send Manual Email (More Personal)**

Send this email to all 10 users:

```
Subject: Tale Forge - Account Migrated to New Version! 🚀

Hi [Name],

Great news! We've migrated your Tale Forge account to our new and improved platform.

✅ Your account has been transferred
✅ All your stories are safe
✅ All your characters are preserved
✅ Your credits have been transferred

**Action Required:**
You'll need to set a new password for security.

Click here to set your password: [password reset link]

Once you've set your password, you can log in at:
https://tale-forge.app

All your stories and data are waiting for you!

If you have any issues, just reply to this email.

Thanks for being part of Tale Forge!

Kevin
Tale Forge Team
```

---

## 🆘 TROUBLESHOOTING

### "Error: Invalid API key"
→ Double-check you copied the **service_role** key (not the anon key)

### "Error: User already exists"
→ That's okay! The script will skip and continue

### "Error: Network timeout"
→ Just run the script again. It will skip already-migrated users

### "Some users didn't migrate"
→ Check the error summary at the end. Share the errors with me and I'll help!

### "Users can't log in"
→ Make sure they clicked the password reset link in their email

### "Stories are missing"
→ Check if stories table exists in new project. Run script again if needed.

---

## 🎯 MIGRATION OPTIONS

You can customize what gets migrated by editing these options:

```javascript
const MIGRATE_OPTIONS = {
  migrateUsers: true,        // Auth users
  migrateProfiles: true,     // Profile data
  migrateStories: true,      // User stories
  migrateCharacters: true,   // User characters
  migrateCredits: true,      // Credit balances
  sendPasswordResets: true,  // Password reset emails
  dryRun: false,             // Test mode
}
```

**Example:** If you only want to migrate users and profiles (not stories):
```javascript
migrateStories: false,
migrateCharacters: false,
```

---

## 📊 WHAT HAPPENS TO OLD PROJECT?

**After successful migration:**

1. **Keep old project running for 1 week** (safety net)
2. **Add banner to old project:** "We've moved! Visit tale-forge.app"
3. **After 1 week:** Pause or delete old project
4. **Save a backup** before deleting (just in case)

**How to backup old project:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to old project
supabase link --project-ref fyihypkigbcmsxyvseca

# Backup database
supabase db dump -f old_project_backup.sql
```

---

## ✅ CHECKLIST

### Before Migration:
- [ ] Node.js installed
- [ ] Supabase JS library installed (`npm install @supabase/supabase-js`)
- [ ] Old project service role key copied
- [ ] New project service role key copied
- [ ] New project URL copied
- [ ] Migration script configured
- [ ] Dry run completed successfully

### After Migration:
- [ ] All 10 users migrated
- [ ] All profiles migrated
- [ ] All stories migrated
- [ ] All characters migrated
- [ ] All credits migrated
- [ ] Users notified (email sent)
- [ ] Verified users can log in
- [ ] Old project backed up
- [ ] Old project kept running for 1 week

---

## 🎉 SUCCESS!

If you see:
```
✅ Migration complete!
📧 Password reset emails have been sent to all users
```

**You're done!** 🎊

Your 10 users are now in the new project and can log in with their new passwords.

---

## 💬 NEED HELP?

**If you run into issues:**
1. Check the error message in the terminal
2. Look at the TROUBLESHOOTING section above
3. Share the error with me and I'll help debug!

**Common questions:**
- "Can I run the script multiple times?" → Yes! It will skip already-migrated users
- "What if I made a mistake?" → Just delete the users in new project and run again
- "Can I migrate more data later?" → Yes! Just run the script again with different options

---

**Ready to migrate? Let's do this!** 🚀

1. Get your service role keys
2. Configure the script
3. Run dry run
4. Run actual migration
5. Verify everything worked
6. Notify users

**Total time: 30-45 minutes**

