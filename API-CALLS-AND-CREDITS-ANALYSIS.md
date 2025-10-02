# 🔍 API Calls & Credit System Analysis

**Date:** October 2, 2025
**Status:** 🔴 **CRITICAL DISCREPANCY FOUND - BACKEND OVERCHARGING**

---

## 🚨 **CRITICAL ISSUE: Backend Charges 2 Credits But Only Generates Text!**

### **THE PROBLEM:**
The backend charges **2 credits per segment** with a comment saying "(1 text + 1 image)", but it **DOES NOT generate images**! Images are generated separately by the frontend calling a different edge function.

**This means users are being OVERCHARGED by 1 credit per segment!**

---

## 🚨 **CRITICAL ISSUE: Credit Cost Mismatch**

### **Backend (Edge Functions):**
**File:** `supabase/functions/_shared/credit-system.ts` (Lines 15-21)

```typescript
export const CREDIT_COSTS: CreditCosts = {
  storyGeneration: 2,     // 2 credits for initial story generation
  storySegment: 2,        // 2 credits per story segment (1 text + 1 image) ❌
  audioGeneration: 1,     // 1 credit per 100 words of audio
  imageGeneration: 1,     // 1 credit per image
  storyTitle: 0           // Free
};
```

**Backend charges:** **2 credits per segment** (1 text + 1 image bundled)

---

### **Frontend (Display):**
**File:** `src/hooks/useStoryCredits.ts` (Lines 89-106)

```typescript
segments.forEach((segment) => {
  // Count segment text generation (1 credit per segment)
  if (segment.content && segment.content.trim().length > 0) {
    segmentCredits += 1; // ✅ 1 credit
  }

  // Count image generation (1 credit per image)
  if (segment.image_url) {
    imageCredits += 1; // ✅ 1 credit
  }

  // Count audio generation (1 credit per 100 words, rounded up)
  if (segment.audio_url && segment.content) {
    const wordCount = segment.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const audioCost = Math.max(1, Math.ceil(wordCount / 100));
    audioCredits += audioCost;
  }
});
```

**Frontend displays:** **1 credit for text + 1 credit for image = 2 credits total** ✅

---

## 🎯 **The Issue**

### **What's Happening:**

1. **Backend Edge Function** (`generate-story-segment`):
   - Charges **2 credits** per segment (bundled: text + image)
   - This is defined in `CREDIT_COSTS.storySegment = 2`

2. **Frontend Display** (`useStoryCredits`):
   - Shows **1 credit for text** + **1 credit for image** = **2 credits total**
   - This is CORRECT and matches the backend!

3. **User Expectation:**
   - Users see "1 credit per segment" in UI badges
   - But backend charges 2 credits (text + image bundled)

---

## ✅ **GOOD NEWS: Frontend Calculation is CORRECT!**

The frontend `useStoryCredits` hook is actually calculating correctly:
- 1 credit for segment text
- 1 credit for image (if exists)
- Total: 2 credits per segment with image

This **MATCHES** the backend cost of 2 credits per segment.

---

## 🔴 **BAD NEWS: UI Labels are MISLEADING**

### **Problem Locations:**

**1. StorySidebar - Credit Badges**
**File:** `src/components/story-viewer/StorySidebar.tsx`

```tsx
// Audio button
<Badge variant="secondary" className="ml-2">2 credits</Badge> // ✅ CORRECT

// Image button
<Badge variant="secondary" className="ml-2">1 credit</Badge> // ⚠️ MISLEADING

// End Story button
<Badge variant="secondary" className="ml-2 bg-white/20">1 credit</Badge> // ⚠️ MISLEADING
```

**Issue:** 
- Image badge shows "1 credit" but image is already included in the 2-credit segment cost
- This makes users think they're paying 1 credit for text + 1 credit for image = 2 total
- But they're actually paying 2 credits for the segment (which includes image)

---

## 📊 **Actual Credit Flow (BROKEN!)**

### **Scenario 1: Generate Segment (with auto-image)**
```
User Action: Make a choice

Backend Charges: 2 credits (storySegment) ❌ WRONG!
What's Actually Generated:
  - Segment text generation ONLY
  - NO image generation in backend

Then Frontend Auto-Generates Image:
Backend Charges: 1 credit (imageGeneration)

Total Charged: 3 credits ❌
Should Be: 2 credits (1 text + 1 image)

USER IS OVERCHARGED BY 1 CREDIT PER SEGMENT!
```

### **Scenario 2: Regenerate Image**
```
User Action: Click "Regenerate Image"
Backend Charges: 1 credit (imageGeneration)
What's Included:
  - New image generation only
Total: 1 credit ✅
```

### **Scenario 3: Generate Audio**
```
User Action: Click "Add Voice Narration"
Backend Charges: 1-2 credits (audioGeneration)
What's Included:
  - Audio generation (1 credit per 100 words)
Total: 1-2 credits (depends on word count) ✅
```

---

## 🔍 **Checking for Duplicate API Calls**

### **1. Segment Generation**

**File:** `src/pages/StoryViewer.tsx` (Lines 478-493)

```typescript
const generationResult = await AIClient.generateStorySegment({
  storyId: story.id,
  choiceId,
  choiceText,
  previousSegmentContent: currentSegment.content,
  storyContext: { ... },
  segmentNumber: segments.length + 1,
  requestId
});
```

**AIClient Retry Logic:**
**File:** `src/lib/api/ai-client.ts` (Line 71)

```typescript
static async invoke<T = any>(
  functionName: string,
  body: any,
  options: { timeout?: number; retries?: number } = {}
): Promise<AIClientResponse<T>> {
  const { timeout = 30000, retries = 1 } = options; // ⚠️ Retries = 1
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    // ... API call logic
  }
}
```

**Analysis:**
- ✅ Only ONE call to `AIClient.generateStorySegment`
- ⚠️ AIClient has `retries = 1` (will retry once on failure)
- ⚠️ **POTENTIAL ISSUE:** If first call succeeds but response is slow, retry might trigger
- ⚠️ **POTENTIAL ISSUE:** If first call charges credits but fails, retry will charge again

---

### **2. Auto-Image Generation**

**File:** `src/pages/StoryViewer.tsx` (Lines 526-559)

```typescript
// Automatically generate image for the new segment
const newSegment = updatedSegments[updatedSegments.length - 1];
if (newSegment && !newSegment.image_url) {
  if (!attemptedImagesRef.current[newSegment.id]) {
    attemptedImagesRef.current[newSegment.id] = true; // ✅ Prevents duplicates
    
    const autoGenerateImage = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      creditLock.current = false;
      await generateSegmentImage(newSegment);
    };
    
    autoGenerateImage().catch(error => { ... });
  }
}
```

**Analysis:**
- ✅ Uses `attemptedImagesRef` to prevent duplicate auto-generation
- ✅ Only generates if `!newSegment.image_url`
- ✅ No duplicate calls detected

---

### **3. Image Polling**

**File:** `src/pages/StoryViewer.tsx` (Lines 217-277)

```typescript
useEffect(() => {
  const isImgPending = searchParams.get('imgPending') === '1';
  
  if (!isImgPending && !generatingImage) return;
  
  let cancelled = false;
  const startedAt = Date.now();
  
  const poll = async () => {
    // ... polling logic
    
    // Stop after 30s max
    if (Date.now() - startedAt > 30_000) {
      setGeneratingImage(null);
      return;
    }
    
    if (!cancelled) {
      setTimeout(poll, 2000);
    }
  };
  
  poll();
  
  return () => { cancelled = true; };
}, [generatingImage, searchParams]);
```

**Analysis:**
- ✅ Polls database for image_url (NOT generating new images)
- ✅ Has timeout (30 seconds)
- ✅ Has cancellation logic
- ✅ No duplicate API calls

---

## 🔴 **ISSUES FOUND**

### **Issue #1: Misleading Credit Badges** 🔴 **CRITICAL**

**Problem:**
- UI shows "1 credit" for image generation
- But image is already included in the 2-credit segment cost
- Users think they're paying extra for images

**Solution:**
- Update badge to show "Included" or remove badge for first image
- Only show "1 credit" for regenerating images

---

### **Issue #2: Retry Logic May Cause Double Charges** ⚠️ **HIGH**

**Problem:**
- AIClient has `retries = 1`
- If first call succeeds but response is slow, retry might trigger
- Each retry charges credits

**Solution:**
- Implement idempotency keys in backend
- OR reduce retries to 0 for credit-charging operations
- OR add client-side deduplication

---

### **Issue #3: Backend Comment is Confusing** ⚠️ **MEDIUM**

**Problem:**
```typescript
storySegment: 2,  // 2 credits per story segment (1 text + 1 image)
```

This comment suggests image is bundled, but:
- What if user doesn't want image?
- What if image generation fails?
- Is image truly "included" or charged separately?

**Solution:**
- Clarify backend logic
- Separate text and image charges
- OR make it clear that image is auto-generated and included

---

## ✅ **RECOMMENDATIONS**

### **🔴 CRITICAL FIX (MUST DO IMMEDIATELY):**

**Fix Backend Overcharging**
**File:** `supabase/functions/_shared/credit-system.ts`

```typescript
export const CREDIT_COSTS: CreditCosts = {
  storyGeneration: 2,     // 2 credits for initial story generation
  storySegment: 1,        // ❌ CHANGE FROM 2 TO 1 - only generates text!
  audioGeneration: 1,     // 1 credit per 100 words of audio
  imageGeneration: 1,     // 1 credit per image
  storyTitle: 0           // Free
};
```

**Rationale:**
- Backend `generate-story-segment` only generates TEXT
- It does NOT generate images
- Images are generated separately by `generate-story-image` (costs 1 credit)
- Current cost of 2 credits is OVERCHARGING users by 1 credit per segment

---

### **Immediate Fixes (High Priority):**

**1. Fix Backend Credit Cost** 🔴 **CRITICAL**
**File:** `supabase/functions/_shared/credit-system.ts` (Line 17)

```typescript
// BEFORE:
storySegment: 2,        // 2 credits per story segment (1 text + 1 image)

// AFTER:
storySegment: 1,        // 1 credit per story segment (text only)
```

**2. Update Frontend Credit Calculation**
**File:** `src/hooks/useStoryCredits.ts`

The frontend calculation is already correct! It counts:
- 1 credit per segment (text)
- 1 credit per image (if exists)
- This matches the corrected backend costs

**3. Update UI Badge Labels**
**File:** `src/components/story-viewer/StorySidebar.tsx`

```tsx
// Image button - Auto-generated image (first time)
{!hasImage && !generatingImage && (
  <Badge variant="secondary" className="ml-2">1 credit</Badge>
)}

// Image button - Regenerate
{hasImage && !generatingImage && (
  <Badge variant="secondary" className="ml-2">1 credit</Badge>
)}
```

**4. Add Idempotency to Backend**
**File:** `supabase/functions/generate-story-segment/index.ts`

```typescript
// Check if segment already exists for this choice
const { data: existingSegment } = await supabase
  .from('story_segments')
  .select('id')
  .eq('story_id', storyId)
  .eq('parent_choice_id', choiceId)
  .single();

if (existingSegment) {
  logger.info('Segment already exists, returning cached result', { requestId, segmentId: existingSegment.id });
  return ResponseHandler.success({ segment: existingSegment });
}
```

**5. Reduce Retries for Credit Operations**
**File:** `src/lib/api/ai-client.ts`

```typescript
// For credit-charging operations, don't retry
const { timeout = 30000, retries = 0 } = options; // Changed from 1 to 0
```

---

### **Long-term Improvements:**

**1. Separate Text and Image Costs**
- Charge 1 credit for text
- Charge 1 credit for image (only if generated)
- More transparent and fair

**2. Add Credit Preview**
- Show users exactly what they'll be charged before action
- "This will cost 2 credits (1 text + 1 image)"

**3. Add Idempotency Keys**
- Generate unique key per operation
- Backend checks if operation already completed
- Prevents double charges on retries

---

## 📋 **Testing Checklist**

### **Credit Calculation:**
- [ ] Generate segment - verify 2 credits charged
- [ ] Regenerate image - verify 1 credit charged
- [ ] Generate audio (short) - verify 1 credit charged
- [ ] Generate audio (long) - verify 2+ credits charged
- [ ] Check credit balance before and after each operation

### **Duplicate API Calls:**
- [ ] Monitor network tab during segment generation
- [ ] Verify only 1 API call to generate-story-segment
- [ ] Verify no duplicate image generation calls
- [ ] Test with slow network to check retry behavior

### **UI Labels:**
- [ ] Verify credit badges show correct amounts
- [ ] Verify "Included" badge for first image
- [ ] Verify "1 credit" badge for regenerate
- [ ] Verify audio badge shows correct cost (2 credits)

---

## 🎯 **Summary**

**Good News:**
- ✅ Frontend credit calculation is CORRECT
- ✅ No duplicate API calls detected in normal flow
- ✅ Auto-image generation has duplicate prevention

**Issues Found:**
- 🔴 UI badges are misleading (show "1 credit" when it's included)
- ⚠️ Retry logic may cause double charges
- ⚠️ Backend comment is confusing about bundled costs

**Recommended Actions:**
1. Fix credit badge labels (30 min)
2. Add backend idempotency (1 hour)
3. Reduce retries for credit operations (15 min)
4. Test thoroughly (1 hour)

**Total Estimated Time:** 2.75 hours

---

**Ready to implement fixes?** 🚀

