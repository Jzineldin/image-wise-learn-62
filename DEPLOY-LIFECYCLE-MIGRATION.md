# Deploy Story Lifecycle Migration to Production

## Current Status

- ✅ Migration exists locally: `supabase/migrations/20251104000000_story_lifecycle_enhancement.sql`
- ✅ Frontend code implemented and ready
- ❌ Migration NOT applied to production Supabase yet
- ❌ Production doesn't have `lifecycle_status` column or RPC functions

## Option 1: Deploy via Supabase CLI (Recommended)

### Step 1: Link to Production Project
```bash
npx supabase link --project-ref hlrvpuqwurtdbjkramcp
# You'll be prompted for your Supabase access token
```

### Step 2: Push Migrations to Production
```bash
npx supabase db push
```

This will:
- Show you a diff of what will change
- Ask for confirmation
- Apply all pending migrations to production
- Update production schema cache automatically

### Step 3: Verify Deployment
```bash
# Check that functions exist in production
npx supabase db remote --project-ref hlrvpuqwurtdbjkramcp \
  --execute "SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('mark_story_ready', 'finalize_story', 'unfinalize_story', 'get_story_readiness');"

# Check that columns exist
npx supabase db remote --project-ref hlrvpuqwurtdbjkramcp \
  --execute "SELECT column_name FROM information_schema.columns WHERE table_name = 'stories' AND column_name IN ('lifecycle_status', 'visibility', 'version');"
```

---

## Option 2: Deploy via Supabase Dashboard (Manual)

### Step 1: Open Production SQL Editor
1. Go to https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy Migration SQL
Open the migration file locally:
```bash
cat supabase/migrations/20251104000000_story_lifecycle_enhancement.sql
```

Copy the entire contents.

### Step 3: Execute in Production
1. Paste the SQL into the SQL Editor
2. Click "Run" or press Ctrl+Enter
3. Wait for execution to complete (should take 5-10 seconds)

### Step 4: Verify Deployment
Run this query in the SQL Editor to verify:
```sql
-- Check columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'stories'
  AND column_name IN ('lifecycle_status', 'visibility', 'version');

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('mark_story_ready', 'finalize_story', 'unfinalize_story', 'get_story_readiness');

-- Count existing stories
SELECT COUNT(*) as total_stories FROM stories;
```

Expected results:
- 3 columns (lifecycle_status, visibility, version)
- 4 functions (mark_story_ready, finalize_story, unfinalize_story, get_story_readiness)
- Your story count

---

## Option 3: Deploy via Database URL (Alternative)

If you have the production database URL:

```bash
# Get production database URL from Supabase dashboard
# Project Settings → Database → Connection string

# Apply migration directly
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  -f supabase/migrations/20251104000000_story_lifecycle_enhancement.sql
```

---

## Post-Deployment Steps

### 1. Update Existing Stories
After deploying, all existing stories will have `lifecycle_status = 'draft'` by default.

You may want to update completed stories:
```sql
-- Update completed stories to 'finalized' status
UPDATE stories
SET lifecycle_status = 'finalized',
    visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END,
    version = 1,
    finalized_at = updated_at
WHERE status = 'completed';

-- Keep in-progress stories as 'draft'
UPDATE stories
SET lifecycle_status = 'draft',
    visibility = 'private',
    version = 1
WHERE status != 'completed';
```

### 2. Test in Production
1. Refresh your browser
2. Create or complete a story
3. Click "End Story Here"
4. Should redirect to `/story/{id}/ready` without errors
5. Verify you can click "Finalize Story"

### 3. Monitor for Errors
Check Supabase logs for any errors:
1. Go to https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp
2. Click "Logs" in left sidebar
3. Filter for errors related to `lifecycle_status` or `mark_story_ready`

---

## Migration File Details

**File**: `supabase/migrations/20251104000000_story_lifecycle_enhancement.sql`

**What it does**:
- Adds `lifecycle_status`, `visibility`, `version` columns to `stories` table
- Adds `finalized_at`, `ready_at` timestamps to `stories` table
- Adds per-chapter asset tracking columns to `story_segments` table
- Creates 4 RPC functions for lifecycle management
- Creates helper view `story_lifecycle_summary`
- Grants all necessary permissions

**Size**: ~500 lines of SQL

**Estimated execution time**: 5-10 seconds on production

**Backwards compatible**: Yes - all new columns have defaults, won't break existing functionality

---

## Troubleshooting

### "Permission denied" when deploying
- Make sure you're logged in to Supabase CLI: `npx supabase login`
- Make sure you have admin access to the project

### "Relation already exists" errors
- Some columns/functions may already exist from previous deployments
- The migration has `IF NOT EXISTS` checks, so it's safe to re-run

### Functions not showing in API
- Wait 1-2 minutes for PostgREST cache to refresh
- Or manually reload: Go to Dashboard → Database → Reload schema

### Still getting "column does not exist" errors
1. Check if migration actually ran: Look for the migration in `supabase_migrations` table
2. Hard refresh browser (Ctrl+Shift+R)
3. Check Supabase logs for any errors during migration

---

## Quick Deployment (If You're in a Hurry)

**Fastest method**: Use Supabase Dashboard SQL Editor

1. Go to: https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/sql
2. Click "New Query"
3. Paste this command to read the migration:
   ```bash
   cat supabase/migrations/20251104000000_story_lifecycle_enhancement.sql
   ```
4. Copy the output
5. Paste into SQL Editor
6. Click "Run"
7. Wait for success message
8. Refresh your app browser

**Time**: ~2 minutes

---

## After Successful Deployment

You should see:
- ✅ No more "column lifecycle_status does not exist" errors
- ✅ No more "Could not find function mark_story_ready" errors
- ✅ Story Ready page loads correctly
- ✅ Finalize modal opens when clicking "Finalize Story"
- ✅ All per-chapter drawers work (voice, animation, details)

The Story Lifecycle System will be fully operational!
