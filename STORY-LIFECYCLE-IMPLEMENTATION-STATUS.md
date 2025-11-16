# Story Lifecycle Implementation Status

## Project Goal
Add a "Ready" state between Draft and Finalized, with per-chapter asset management (voice, animation, details) before finalization.

## Completed ✅

### 1. Database Schema & Migration
- **File**: `/supabase/migrations/20251104000000_story_lifecycle_enhancement.sql`
- **Status**: ✅ Complete and applied

**Stories Table Enhancements:**
- `lifecycle_status` - New enum: 'draft' | 'ready' | 'finalized'
- `visibility` - 'private' | 'public' | 'unlisted'
- `allow_featuring` - Boolean for homepage featuring consent
- `version` - Auto-increments on each finalize
- `finalized_at`, `ready_at` - Timestamps for lifecycle tracking
- `story_tags`, `age_range` - Story-level metadata

**Story Segments (Chapters) Table Enhancements:**
- **Voice/Audio**:
  - `voice_status` - 'none' | 'queued' | 'processing' | 'ready' | 'failed'
  - `voice_config` - JSONB: {speakerId, style, speed}
  - `voice_error` - Error message if failed

- **Animation/Video**:
  - `animation_status` - 'none' | 'queued' | 'processing' | 'ready' | 'failed'
  - `animation_config` - JSONB: {prompt, durationSec, seed}
  - `animation_error` - Error message if failed

- **Chapter Details**:
  - `chapter_title`, `chapter_tags`, `chapter_age_range`, `chapter_cover_url`
  - `details_status` - 'complete' | 'incomplete'
  - `missing_fields` - Array of missing field names

**Database Functions:**
- `get_story_readiness(story_uuid)` - Returns comprehensive readiness summary
- `mark_story_ready(story_uuid)` - Moves from draft → ready
- `finalize_story(story_uuid, visibility, allow_featuring)` - Finalizes with version bump
- `unfinalize_story(story_uuid)` - Returns to ready state
- `story_lifecycle_summary` - View for quick status overview

### 2. TypeScript Types
- **File**: `/src/integrations/supabase/types.ts`
- **Status**: ✅ Regenerated from schema

### 3. Story Ready Page
- **File**: `/src/pages/StoryReady.tsx`
- **Status**: ✅ Complete

**Features:**
- Celebratory header: "Story Ready 🎉"
- Read-only summary chips: Chapters, Voices Ready, Animations Ready, Details Complete
- Primary CTA: "Finalize Story" (always available)
- Chapter-centric list with per-chapter:
  - Status badges for Voice, Animation, Details
  - Action buttons: Generate Voice, Play, Animate, Preview, Edit Details
  - More menu (⋯): Duplicate, Reorder, Delete (placeholders)
- Real-time status updates
- Ownership verification

### 4. Finalize Modal (2-Step)
- **File**: `/src/components/story-lifecycle/FinalizeModal.tsx`
- **Status**: ✅ Complete

**Step 1 - Warning Checklist:**
- Shows missing voices, animations, incomplete details
- "You can finalize anyway and add assets later" messaging
- Green success state if everything is ready

**Step 2 - Visibility & Consent:**
- Radio selection: Private (default) / Public (Discover)
- Checkbox: "Allow Tale Forge to feature this story"
- Clear descriptions for each option
- Analytics tracking for all events

## In Progress 🚧

### 5. Per-Chapter Drawers (Need Implementation)

#### Voice Generation Drawer
- **File**: `/src/components/story-lifecycle/VoiceGenerationDrawer.tsx`
- **Status**: ⏳ Pending
- **Requirements**:
  - Voice/speaker ID selection
  - Style options (if available)
  - Speed control (0.5x - 2.0x)
  - Preview button
  - Save & Generate button
  - Shows credit cost
  - Updates `voice_status` to 'queued'
  - Calls existing audio generation API

#### Animation/Video Generation Drawer
- **File**: `/src/components/story-lifecycle/AnimationGenerationDrawer.tsx`
- **Status**: ⏳ Pending
- **Requirements**:
  - Prompt/description textarea (optional, can use image URL)
  - Duration slider (5-30 seconds)
  - Seed input (optional, for reproducibility)
  - Preview image/existing video
  - Save & Generate button
  - Shows credit cost
  - Updates `animation_status` to 'queued'
  - Calls existing video generation API

#### Chapter Details Drawer
- **File**: `/src/components/story-lifecycle/ChapterDetailsDrawer.tsx`
- **Status**: ⏳ Pending
- **Requirements**:
  - Editable title input
  - Tags input (multi-select or comma-separated)
  - Age range selector
  - Cover thumbnail upload/picker
  - Save button
  - Updates `details_status` based on completeness

## Not Started ❌

### 6. Dashboard Status Updates
- **File**: `/src/pages/Dashboard.tsx`
- **Status**: ❌ Not started
- **Requirements**:
  - Show status chips: Draft, Ready, Finalized (Private), Finalized (Public)
  - Quick actions menu: Finalize/Unfinalize, Share, Manage Chapters
  - Filter by lifecycle status
  - Update existing story cards

### 7. Unfinalize Functionality
- **Status**: ❌ Not started (backend function exists, need UI)
- **Requirements**:
  - Confirmation dialog: "Reopen this story for edits?"
  - Call `unfinalize_story()` RPC
  - Redirect to Story Ready page
  - Analytics event: `unfinalize_confirmed`

### 8. Navigation Updates
- **File**: `/src/App.tsx`
- **Status**: ❌ Not started
- **Requirements**:
  - Add route: `/story/:id/ready` → StoryReady page
  - Update "End Story" flow to redirect to `/story/:id/ready` instead of `/story/:id/complete`

### 9. StoryViewerSimple Updates
- **File**: `/src/pages/StoryViewerSimple.tsx`
- **Status**: ❌ Not started
- **Requirements**:
  - Update `handleConfirmEndStory` to:
    - Call `mark_story_ready()` instead of finalizing
    - Redirect to `/story/:id/ready`
    - Remove direct finalization

### 10. Analytics Events
- **Status**: ❌ Not started
- **Required Events**:
  - `story_ready_viewed`
  - `chapter_voice_generate_clicked`
  - `chapter_voice_status_ready`
  - `chapter_voice_status_failed`
  - `chapter_voice_retry_clicked`
  - `chapter_animation_generate_clicked`
  - `chapter_animation_status_ready`
  - `chapter_animation_status_failed`
  - `chapter_animation_retry_clicked`
  - `chapter_details_edit_opened`
  - `chapter_details_saved`
  - `finalize_modal_opened` ✅ (already in FinalizeModal)
  - `finalize_confirmed_private` ✅ (already in FinalizeModal)
  - `finalize_confirmed_public` ✅ (already in FinalizeModal)
  - `feature_consent_checked` ✅ (already in FinalizeModal)
  - `unfinalize_confirmed`

## Next Steps (Priority Order)

1. **Create VoiceGenerationDrawer** - Most important for user value
2. **Create AnimationGenerationDrawer** - Second most important
3. **Create ChapterDetailsDrawer** - Metadata management
4. **Update StoryViewerSimple** - Change "End Story" flow to go to Ready page
5. **Add route in App.tsx** - Enable navigation to Ready page
6. **Update Dashboard** - Show new status chips and actions
7. **Implement Unfinalize UI** - Allow re-editing finalized stories
8. **Add missing analytics** - Track all user interactions

## API Integration Notes

### Existing APIs to Use:

**Voice/Audio Generation:**
- Edge Function: `/supabase/functions/generate-story-audio/index.ts`
- Parameters: `segment_id`, `voice_id` (optional), `model` (optional)
- Returns: `audio_url`, `credits_used`
- Update strategy: Call function, then update `voice_status` and `audio_url` in segment

**Video/Animation Generation:**
- Edge Function: `/supabase/functions/generate-video-async/index.ts`
- Creates job in `video_generation_jobs` table
- Use Realtime subscription to watch job status
- Update strategy: Create job, subscribe to status changes, update `animation_status` when complete

**Segment Update:**
- Direct Supabase update for details:
  ```typescript
  await supabase
    .from('story_segments')
    .update({
      chapter_title,
      chapter_tags,
      chapter_age_range,
      chapter_cover_url,
      details_status: 'complete',
      missing_fields: []
    })
    .eq('id', segmentId);
  ```

## Database Migration Applied

Migration has been successfully applied to local database:
```
Applying migration 20251104000000_story_lifecycle_enhancement.sql...
✓ Stories table updated with lifecycle fields
✓ Story segments updated with per-chapter asset fields
✓ Functions created: get_story_readiness, mark_story_ready, finalize_story, unfinalize_story
✓ View created: story_lifecycle_summary
✓ Indexes added for performance
```

## Files Created

```
/supabase/migrations/20251104000000_story_lifecycle_enhancement.sql
/src/pages/StoryReady.tsx
/src/components/story-lifecycle/FinalizeModal.tsx
```

## Files To Create

```
/src/components/story-lifecycle/VoiceGenerationDrawer.tsx
/src/components/story-lifecycle/AnimationGenerationDrawer.tsx
/src/components/story-lifecycle/ChapterDetailsDrawer.tsx
/src/components/story-lifecycle/UnfinalizeDialog.tsx
```

## Files To Modify

```
/src/App.tsx - Add route for Story Ready page
/src/pages/StoryViewerSimple.tsx - Update end story flow
/src/pages/Dashboard.tsx - Add status chips and actions
/src/pages/MyStories.tsx - Add lifecycle status filters
```

---

**Last Updated**: 2025-11-04
**Completion**: ~40% (4 of 10 major items)
