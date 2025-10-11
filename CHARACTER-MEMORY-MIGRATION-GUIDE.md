# Character Memory - Database Migration Guide

**File:** `supabase/migrations/20251010153508_add_character_memory.sql`  
**Status:** Ready to run  
**Time Required:** 5 minutes

---

## 🎯 WHAT THIS MIGRATION DOES

This migration adds character memory tracking to Tale Forge:

1. ✅ Creates `character_story_appearances` table
2. ✅ Adds memory columns to `user_characters` table
3. ✅ Sets up indexes for performance
4. ✅ Enables Row Level Security (RLS)
5. ✅ Creates helper functions for character history
6. ✅ Sets up automatic stat updates via triggers

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Open Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project: **Tale-Forge-V3** (hlrvpuqwurtdbjkramcp)
3. Click on **SQL Editor** in the left sidebar

---

### **Step 2: Copy the Migration SQL**

1. Open the file: `supabase/migrations/20251010153508_add_character_memory.sql`
2. Copy ALL the SQL content (Ctrl+A, Ctrl+C)

---

### **Step 3: Run the Migration**

1. In Supabase SQL Editor, click **"New Query"**
2. Paste the SQL content
3. Click **"Run"** button (or press Ctrl+Enter)
4. Wait for execution to complete (~5 seconds)

---

### **Step 4: Verify Migration Success**

You should see output like:
```
Success. No rows returned
```

Or specific success messages for each operation.

---

### **Step 5: Verify Tables Created**

1. In Supabase Dashboard, go to **Table Editor**
2. Look for new table: `character_story_appearances`
3. Check `user_characters` table has new columns:
   - `memory_summary`
   - `total_stories`
   - `last_appearance_at`

---

### **Step 6: Verify RLS Policies**

1. In Table Editor, click on `character_story_appearances`
2. Go to **Policies** tab
3. You should see 4 policies:
   - Users can view their own character appearances
   - Users can insert their own character appearances
   - Users can update their own character appearances
   - Users can delete their own character appearances

---

## ✅ VERIFICATION CHECKLIST

After running the migration, verify:

- [ ] `character_story_appearances` table exists
- [ ] `user_characters` has new columns (memory_summary, total_stories, last_appearance_at)
- [ ] Indexes created (check Database → Indexes)
- [ ] RLS enabled on `character_story_appearances`
- [ ] 4 RLS policies created
- [ ] Helper function `get_character_history()` exists
- [ ] Trigger `trigger_update_character_stats` exists
- [ ] No errors in SQL execution

---

## 🔍 HOW TO CHECK IF IT WORKED

### **Test 1: Check Table Exists**

Run this query in SQL Editor:
```sql
SELECT * FROM public.character_story_appearances LIMIT 1;
```

**Expected:** Empty result (no rows yet) but no error

---

### **Test 2: Check New Columns**

Run this query:
```sql
SELECT 
  id, 
  name, 
  memory_summary, 
  total_stories, 
  last_appearance_at 
FROM public.user_characters 
LIMIT 5;
```

**Expected:** Shows characters with new columns (values will be NULL/0 for now)

---

### **Test 3: Check Helper Function**

Run this query:
```sql
SELECT get_character_history('00000000-0000-0000-0000-000000000000');
```

**Expected:** Empty result (no history yet) but no error

---

## 🐛 TROUBLESHOOTING

### **Error: "relation already exists"**

**Cause:** Migration was already run  
**Solution:** This is OK! The migration uses `IF NOT EXISTS` so it's safe to run multiple times

---

### **Error: "column already exists"**

**Cause:** Columns were already added  
**Solution:** This is OK! The migration uses `IF NOT EXISTS` for columns too

---

### **Error: "permission denied"**

**Cause:** Not logged in as admin  
**Solution:** Make sure you're logged into Supabase Dashboard with the correct account

---

### **Error: "function does not exist"**

**Cause:** Helper functions failed to create  
**Solution:** 
1. Check for syntax errors in the SQL
2. Try running just the function creation part separately
3. Check Supabase logs for details

---

## 📊 WHAT EACH PART DOES

### **1. character_story_appearances Table**

Tracks every time a character appears in a story:
- `character_id` - Which character
- `story_id` - Which story
- `user_id` - Who owns it
- `created_at` - When it happened

**Example data:**
```
character_id: abc-123
story_id: xyz-789
user_id: user-456
created_at: 2025-10-10 15:35:08
```

---

### **2. New Columns on user_characters**

- `memory_summary` - Brief text summary of character's history (future use)
- `total_stories` - Count of stories character appeared in (auto-updated)
- `last_appearance_at` - When character was last used (auto-updated)

---

### **3. Indexes**

Speed up queries:
- Finding all stories a character appeared in
- Finding all characters in a story
- User-specific queries

---

### **4. RLS Policies**

Security:
- Users can only see their own character memories
- Users can only modify their own data
- No cross-user data leakage

---

### **5. Helper Functions**

**`update_character_stats()`**
- Automatically updates `total_stories` count
- Updates `last_appearance_at` timestamp
- Triggered when new appearance is recorded

**`get_character_history(character_id)`**
- Returns list of stories character appeared in
- Includes story titles and dates
- Limited to last 10 stories

---

### **6. Trigger**

**`trigger_update_character_stats`**
- Runs automatically after INSERT on `character_story_appearances`
- Calls `update_character_stats()` function
- Keeps character stats up-to-date

---

## 🚀 NEXT STEPS AFTER MIGRATION

Once migration is successful:

1. ✅ **Update TypeScript types** (optional)
   ```bash
   npm run update-types
   ```

2. ✅ **Create backend functions** to record character appearances

3. ✅ **Modify story generation** to include character memory

4. ✅ **Add UI components** to display character history

5. ✅ **Test the feature** end-to-end

---

## 💡 MIGRATION SAFETY

This migration is **SAFE** because:

- ✅ Uses `IF NOT EXISTS` - won't break if run twice
- ✅ Only adds new tables/columns - doesn't modify existing data
- ✅ Uses `ADD COLUMN IF NOT EXISTS` - safe for existing tables
- ✅ No data deletion or modification
- ✅ Can be rolled back if needed

---

## 🔄 ROLLBACK (If Needed)

If you need to undo this migration:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_character_stats ON public.character_story_appearances;

-- Drop functions
DROP FUNCTION IF EXISTS update_character_stats();
DROP FUNCTION IF EXISTS get_character_history(UUID);

-- Drop table
DROP TABLE IF EXISTS public.character_story_appearances;

-- Remove columns (optional - can leave them)
ALTER TABLE public.user_characters 
DROP COLUMN IF EXISTS memory_summary,
DROP COLUMN IF EXISTS total_stories,
DROP COLUMN IF EXISTS last_appearance_at;
```

**Note:** Only rollback if absolutely necessary. Better to fix forward.

---

## ✅ READY TO RUN!

**Time required:** 5 minutes  
**Risk level:** Low (safe migration)  
**Reversible:** Yes

**Next step:** Open Supabase Dashboard and run the migration!

