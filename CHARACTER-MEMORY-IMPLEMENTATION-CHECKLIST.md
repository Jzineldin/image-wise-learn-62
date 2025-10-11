# Character Memory - Implementation Checklist

**Goal:** Characters remember their past adventures across multiple stories  
**Estimated Time:** 10-12 hours (2-3 days)  
**Status:** Ready to implement

---

## ✅ STEP-BY-STEP CHECKLIST

### **Phase 1: Database Setup (2 hours)**

- [ ] **Task 1.1:** Create database migration file
  - File: `supabase/migrations/[timestamp]_add_character_memory.sql`
  - Purpose: Add character memory tracking tables

- [ ] **Task 1.2:** Create `character_story_appearances` table
  - Track which characters appeared in which stories
  - Store memory data (role, key events, etc.)
  - Set up foreign keys and indexes

- [ ] **Task 1.3:** Add memory columns to `user_characters` table
  - `memory_summary` (text) - Brief summary of character's history
  - `total_stories` (integer) - Count of stories character appeared in
  - `last_appearance_at` (timestamp) - When character was last used

- [ ] **Task 1.4:** Set up Row Level Security (RLS) policies
  - Users can only see their own character memories
  - Proper INSERT/SELECT/UPDATE policies

- [ ] **Task 1.5:** Run migration in Supabase
  - Execute SQL in Supabase Dashboard
  - Verify tables created successfully
  - Check RLS policies are active

---

### **Phase 2: Backend - Track Character Usage (3 hours)**

- [ ] **Task 2.1:** Update story generation to track characters
  - Modify story creation to record which characters are used
  - Store character IDs with story metadata

- [ ] **Task 2.2:** Create function to record character appearance
  - Function: `recordCharacterAppearance()`
  - Called when story is created with a character
  - Inserts record into `character_story_appearances`

- [ ] **Task 2.3:** Update character usage count
  - Increment `total_stories` on `user_characters`
  - Update `last_appearance_at` timestamp
  - Update `usage_count` (already exists)

- [ ] **Task 2.4:** Create function to get character history
  - Function: `getCharacterHistory(characterId)`
  - Returns list of stories character appeared in
  - Includes story titles, dates, and basic info

---

### **Phase 3: Backend - Memory in Story Generation (2 hours)**

- [ ] **Task 3.1:** Modify story generation prompt
  - Include character history in AI prompt
  - Format: "This character previously appeared in X stories"
  - Add context about past adventures

- [ ] **Task 3.2:** Fetch character history before generation
  - Query `character_story_appearances` table
  - Get last 3-5 stories character appeared in
  - Format for AI prompt

- [ ] **Task 3.3:** Test memory influences new stories
  - Create story with character that has history
  - Verify AI references past adventures
  - Check memory is relevant and helpful

---

### **Phase 4: Frontend - Display Character History (3 hours)**

- [ ] **Task 4.1:** Add "Previous Adventures" badge to character cards
  - Show story count on character selection
  - Example: "Used in 3 stories"
  - Visual indicator for characters with history

- [ ] **Task 4.2:** Create character history tooltip/modal
  - Show list of stories when hovering/clicking
  - Display story titles and dates
  - Link to view those stories

- [ ] **Task 4.3:** Update character selector UI
  - Highlight characters with memory
  - Show "Returning Character" badge
  - Make it clear which characters have history

- [ ] **Task 4.4:** Add memory indicator in story creation
  - Show message: "This character remembers their past adventures"
  - Display brief summary of character's history
  - Make it clear memory is being used

---

### **Phase 5: Testing & Polish (2 hours)**

- [ ] **Task 5.1:** Test with new character (no memory)
  - Create story with brand new character
  - Verify no errors
  - Check character is tracked properly

- [ ] **Task 5.2:** Test with character in 2nd story (has memory)
  - Use same character in second story
  - Verify memory is included in generation
  - Check AI references first story

- [ ] **Task 5.3:** Test with character in multiple stories
  - Use character in 3-5 stories
  - Verify memory accumulates
  - Check story count updates

- [ ] **Task 5.4:** Test UI displays correctly
  - Check badges appear
  - Verify tooltips work
  - Test on mobile and desktop

- [ ] **Task 5.5:** Test edge cases
  - Character deleted (cascade delete memories)
  - Story deleted (remove from memory)
  - Multiple characters in one story
  - Character shared between users (separate memories)

---

## 📋 FILES TO CREATE/MODIFY

### **New Files:**
1. `supabase/migrations/[timestamp]_add_character_memory.sql` - Database migration
2. `src/lib/character-memory.ts` - Character memory utility functions
3. `src/components/CharacterHistoryBadge.tsx` - UI component for history badge
4. `src/components/CharacterHistoryTooltip.tsx` - UI component for history tooltip

### **Modified Files:**
1. `src/pages/CreateStory.tsx` - Track character usage when creating story
2. `src/components/CharacterSelector.tsx` - Display character history
3. `supabase/functions/generate-story/index.ts` - Include memory in AI prompt
4. `src/types/character.ts` - Add memory fields to Character type

---

## 🔧 COMMANDS TO RUN

```bash
# 1. Create migration file
# (We'll do this together)

# 2. Run migration in Supabase Dashboard
# (Copy SQL and execute in Supabase SQL Editor)

# 3. Update TypeScript types (if needed)
npm run update-types

# 4. Test the feature
# (Manual testing in browser)
```

---

## ✅ DEFINITION OF DONE

Feature is complete when:
- ✅ Database tables created and RLS policies set
- ✅ Characters are tracked when used in stories
- ✅ Character history is fetched and included in story generation
- ✅ UI shows "Previous Adventures" badge on characters
- ✅ Tooltip/modal shows list of past stories
- ✅ AI references character's past adventures in new stories
- ✅ Story count updates correctly
- ✅ Works with new characters (no errors)
- ✅ Works with characters in multiple stories
- ✅ No console errors

---

## 🎯 MVP vs FULL VERSION

### **MVP (Ship First - 8 hours):**
- ✅ Track which stories each character appeared in
- ✅ Show story count badge on character cards
- ✅ Include basic context in story generation: "This character appeared in X previous stories"
- ✅ Simple tooltip showing story titles

### **Full Version (Add Later - 4 hours):**
- ⏳ Detailed memory extraction (key events, relationships)
- ⏳ AI-powered memory summarization
- ⏳ Character development tracking
- ⏳ Memory timeline view
- ⏳ Memory editing by users

**Recommendation:** Build MVP first, test it, then decide if you want full version.

---

## 🚀 READY TO START!

**Next Steps:**
1. Create database migration
2. Run migration in Supabase
3. Add backend tracking functions
4. Update story generation to include memory
5. Add UI components to display history
6. Test the feature

**Estimated completion time:** 2-3 days from now

**Let's start with Phase 1: Database Setup!**

