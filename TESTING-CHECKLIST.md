# Image Generation Testing Checklist

## 🎯 Testing Objectives

Verify that the new image generation system produces:
- ✅ Clearly illustrated images (NOT photorealistic)
- ✅ Vibrant, colorful, engaging visuals
- ✅ Age-appropriate, child-friendly content
- ✅ Consistent style across story segments
- ✅ High quality without being hyperdetailed

---

## 📋 Pre-Testing Setup

### 1. Verify Deployment
```bash
# Check that the function is deployed
supabase functions list --project-ref hlrvpuqwurtdbjkramcp
```

**Expected:** `generate-story-image` should be listed with recent deployment timestamp

### 2. Check Current Configuration

**File:** `supabase/functions/generate-story-image/index.ts`
- Line 92: `style = 'digital_storybook'` ✅
- Line 169: `steps: 35` ✅
- Line 170: `guidance: 7.0` ✅

**File:** `supabase/functions/_shared/image-service.ts`
- Lines 350-398: New style prompts present ✅
- Lines 399-439: Enhanced negative prompts present ✅

---

## 🧪 Test Cases

### Test 1: Basic Image Generation (Default Style)

**Objective:** Verify default `digital_storybook` style works correctly

**Steps:**
1. Create a new story in Tale Forge
2. Use any age group and genre
3. Wait for first image to generate
4. Examine the generated image

**Success Criteria:**
- [ ] Image loads successfully
- [ ] Image is clearly illustrated (NOT photographic)
- [ ] Colors are vibrant and appealing
- [ ] Style is painterly/storybook-like
- [ ] No photorealistic elements
- [ ] No scary/inappropriate content
- [ ] Characters look friendly and age-appropriate

**If Failed:** Check Edge Function logs for errors

---

### Test 2: Multiple Segments (Consistency)

**Objective:** Verify style consistency across story segments

**Steps:**
1. Continue the story from Test 1
2. Make 2-3 choices to generate new segments
3. Wait for images to generate for each segment
4. Compare all images

**Success Criteria:**
- [ ] All images have similar illustrated style
- [ ] Color palette is consistent
- [ ] Characters maintain consistent appearance
- [ ] No sudden shifts to photorealism
- [ ] Overall aesthetic is cohesive

**If Failed:** Check seed generation and style parameters

---

### Test 3: Different Age Groups

**Objective:** Verify style works for all age groups

**Test 3a: Ages 0-3**
- Create story for ages 0-3
- Generate image
- [ ] Very simple, clear, friendly
- [ ] Bright colors
- [ ] No complex details

**Test 3b: Ages 5-7**
- Create story for ages 5-7
- Generate image
- [ ] Engaging and colorful
- [ ] Appropriate detail level
- [ ] Whimsical and fun

**Test 3c: Ages 8-10**
- Create story for ages 8-10
- Generate image
- [ ] More sophisticated but still illustrated
- [ ] Rich colors and details
- [ ] Engaging for older children

**Test 3d: Ages 10-12**
- Create story for ages 10-12
- Generate image
- [ ] Sophisticated illustration
- [ ] Still clearly NOT photorealistic
- [ ] Appeals to pre-teens

---

### Test 4: Different Genres

**Objective:** Verify style works across genres

**Test 4a: Fantasy/Magic**
- Create fantasy story
- Generate image
- [ ] Magical, whimsical atmosphere
- [ ] Vibrant fantasy colors
- [ ] Enchanted feel
- [ ] NOT photorealistic

**Test 4b: Adventure**
- Create adventure story
- Generate image
- [ ] Exciting, dynamic
- [ ] Bold colors
- [ ] Action-appropriate but safe
- [ ] Illustrated style maintained

**Test 4c: Educational**
- Create educational story
- Generate image
- [ ] Clear, easy to understand
- [ ] Appropriate for learning
- [ ] Friendly and inviting
- [ ] Illustrated style

**Test 4d: Bedtime/Calm**
- Create bedtime story
- Generate image
- [ ] Soft, gentle colors
- [ ] Peaceful atmosphere
- [ ] Comforting and safe
- [ ] Illustrated style

---

### Test 5: Character Consistency

**Objective:** Verify characters maintain consistent appearance

**Steps:**
1. Create story with 2-3 specific characters
2. Generate first image
3. Note character appearances
4. Continue story and generate 2 more images
5. Compare character appearances

**Success Criteria:**
- [ ] Characters recognizable across images
- [ ] Similar colors and features
- [ ] Consistent style
- [ ] No sudden changes in appearance

**Note:** Some variation is expected, but characters should be generally recognizable

---

### Test 6: Edge Cases

**Test 6a: Very Long Scene Description**
- Create story with very detailed scene (200+ words)
- Generate image
- [ ] Image captures main elements
- [ ] Not overwhelmed with details
- [ ] Still maintains illustrated style

**Test 6b: Multiple Characters (3+)**
- Create story with 3+ characters in scene
- Generate image
- [ ] All characters present
- [ ] No anatomical issues
- [ ] Characters distinguishable
- [ ] Illustrated style maintained

**Test 6c: Complex Setting**
- Create story with complex environment (castle, forest, underwater, etc.)
- Generate image
- [ ] Setting is recognizable
- [ ] Details are appropriate
- [ ] Not photorealistic
- [ ] Illustrated style maintained

---

## 🔍 Quality Assessment Criteria

### Visual Style Assessment

**Rate each generated image on these criteria (1-5 scale):**

| Criterion | 1 (Poor) | 3 (Acceptable) | 5 (Excellent) |
|-----------|----------|----------------|---------------|
| **Illustration Quality** | Looks photographic | Somewhat illustrated | Clearly illustrated |
| **Color Vibrancy** | Dull, muted | Moderate colors | Vibrant, engaging |
| **Age Appropriateness** | Scary/inappropriate | Mostly appropriate | Perfectly safe |
| **Style Consistency** | Inconsistent | Mostly consistent | Very consistent |
| **Overall Appeal** | Unappealing | Acceptable | Beautiful |

**Target Score:** 4-5 on all criteria

---

## 🚨 Red Flags to Watch For

### Critical Issues (Must Fix Immediately)

- [ ] **Photorealistic images** - Images look like photographs
- [ ] **Scary/inappropriate content** - Dark, violent, or disturbing imagery
- [ ] **Anatomical issues** - Deformed characters, extra limbs, etc.
- [ ] **Generation failures** - Images fail to generate or return errors
- [ ] **Text in images** - Unwanted text, watermarks, or captions

**If any critical issue found:** Stop testing and investigate immediately

### Minor Issues (Should Fix Soon)

- [ ] **Dull colors** - Images lack vibrancy
- [ ] **Inconsistent style** - Style varies too much between images
- [ ] **Too cartoonish** - Images look cheap or overly simplified
- [ ] **Character inconsistency** - Characters change appearance too much
- [ ] **Slow generation** - Images take too long to generate (>60 seconds)

**If minor issues found:** Note for adjustment but continue testing

---

## 🎨 Style Comparison Testing (Optional)

### Test Different Styles

To compare styles, change line 92 in `generate-story-image/index.ts` and redeploy:

**Test A: `digital_storybook` (Current Default)**
```typescript
style = 'digital_storybook'
```
- Generate 3 images
- Rate: Illustration quality, color vibrancy, appeal
- Notes: _______________

**Test B: `watercolor_fantasy`**
```typescript
style = 'watercolor_fantasy'
```
- Generate 3 images
- Rate: Illustration quality, color vibrancy, appeal
- Notes: _______________

**Test C: `gouache`**
```typescript
style = 'gouache'
```
- Generate 3 images
- Rate: Illustration quality, color vibrancy, appeal
- Notes: _______________

**Test D: `soft_painting`**
```typescript
style = 'soft_painting'
```
- Generate 3 images
- Rate: Illustration quality, color vibrancy, appeal
- Notes: _______________

**Test E: `flat_illustration`**
```typescript
style = 'flat_illustration'
```
- Generate 3 images
- Rate: Illustration quality, color vibrancy, appeal
- Notes: _______________

**Conclusion:** Which style do you prefer? _______________

---

## 📊 Performance Testing

### Generation Speed

**Test:** Generate 5 images and measure time for each

| Image # | Start Time | End Time | Duration | Status |
|---------|------------|----------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

**Average Duration:** _____ seconds

**Target:** < 45 seconds per image

**If slower:** Check OVH API status, consider optimizing steps parameter

---

## 🐛 Debugging Guide

### If Images Are Too Photorealistic

**Check:**
1. Negative prompt includes anti-photorealism keywords
2. Style is set to illustrated style (not `realistic`)
3. Guidance is 7.0 or higher
4. Positive prompt includes `illustration`, `storybook`, `painted` keywords

**Fix:**
- Increase guidance to 7.5 or 8.0
- Add more anti-realism keywords to negative prompt
- Switch to `watercolor_fantasy` or `flat_illustration` style

### If Images Are Too Dull/Low Quality

**Check:**
1. Steps parameter (should be 30-40)
2. Guidance parameter (should be 6.5-7.5)
3. Color keywords in positive prompt

**Fix:**
- Increase steps to 40
- Add `vibrant colors`, `saturated`, `rich colors` to prompt
- Switch to `gouache` or `digital_storybook` style

### If Images Fail to Generate

**Check:**
1. Edge Function logs in Supabase dashboard
2. OVH API status
3. Credit balance
4. Network connectivity

**Fix:**
- Check error messages in logs
- Verify API keys are set correctly
- Ensure sufficient credits
- Try regenerating

### If Characters Are Inconsistent

**Check:**
1. Seed generation (should be based on story_id + segment_id)
2. Character descriptions in prompt
3. Style consistency

**Fix:**
- Verify seed is being generated correctly
- Ensure character descriptions are detailed
- Use same style for all segments

---

## ✅ Final Checklist

### Before Declaring Success

- [ ] Generated at least 10 test images
- [ ] Tested all age groups (0-3, 3-5, 5-7, 8-10, 10-12)
- [ ] Tested multiple genres (fantasy, adventure, educational, bedtime)
- [ ] Verified NO photorealistic images
- [ ] Verified NO inappropriate content
- [ ] Verified consistent style across segments
- [ ] Verified vibrant, appealing colors
- [ ] Verified age-appropriate aesthetics
- [ ] Average quality score: 4+ out of 5
- [ ] Average generation time: < 45 seconds
- [ ] No critical issues found

### If All Checks Pass

🎉 **SUCCESS!** The image generation system is working as intended.

### If Any Checks Fail

📝 **Document issues and refer to:**
- `IMAGE-STYLE-IMPLEMENTATION-GUIDE.md` for adjustments
- `PROMPT-KEYWORDS-REFERENCE.md` for prompt tuning
- Debugging section above for specific fixes

---

## 📝 Test Results Summary

**Date:** _______________
**Tester:** _______________
**Version:** _______________

**Overall Assessment:**
- [ ] Excellent - Ready for production
- [ ] Good - Minor adjustments needed
- [ ] Fair - Significant adjustments needed
- [ ] Poor - Major rework required

**Recommended Style:** _______________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

**Next Steps:**
_______________________________________________
_______________________________________________
_______________________________________________

