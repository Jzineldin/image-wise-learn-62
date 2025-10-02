# Testing Guide: Story Quality Improvements

**Purpose:** Verify that grammar fixes and quality improvements are working correctly  
**Date:** October 2025  
**Estimated Testing Time:** 30 minutes

---

## 🎯 **What We're Testing**

1. **Grammar Fixes** - Duplicate words, capitalization
2. **Pronoun Usage** - "he/she" instead of "it" for animals
3. **Sensory Details** - Colors, sounds, textures, feelings
4. **Choice Impact Previews** - Action + Emotion + Anticipation
5. **Overall Story Quality** - Engagement and readability

---

## 🧪 **Test Scenarios**

### **Test 1: Basic Grammar Validation (Critical)**

**Objective:** Verify duplicate words and capitalization are fixed

**Steps:**
1. Create a new story:
   - Age Group: 4-6
   - Genre: Adventure
   - Prompt: "A curious cat finds something shiny in the backyard"
   - Character: "Curious Cat" (or similar)

2. Generate the first segment

3. **Check for Grammar Issues:**
   - ✅ NO duplicate words (e.g., "the the", "a a")
   - ✅ ALL sentences start with capital letters
   - ✅ Proper spacing around punctuation

**Expected Result:**
```
✅ PASS: "The curious cat winks at you..."
❌ FAIL: "the the curious cat winks at you..."
```

**If Test Fails:**
- Check Edge Function logs for validation errors
- Verify `validateAndCorrectText()` is being called
- Check if AI prompt includes grammar rules

---

### **Test 2: Pronoun Usage (High Priority)**

**Objective:** Verify animals use "he/she" instead of "it"

**Steps:**
1. Use the same story from Test 1
2. Read the first segment carefully

3. **Check Pronoun Usage:**
   - ✅ Uses "he/she" or character name for the cat
   - ✅ NOT using "it" for the cat
   - ✅ Natural pronoun flow (first mention → pronoun → reference)

**Expected Result:**
```
✅ PASS: "The curious cat sees something shiny. She wants to explore."
⚠️ ACCEPTABLE: "The curious cat sees something shiny. The cat wants to explore."
❌ FAIL: "The curious cat sees something shiny. It wants to explore."
```

**Note:** This is guided by prompts, not auto-corrected. Some "it" usage may still occur but should be significantly reduced.

---

### **Test 3: Sensory Details (Medium Priority)**

**Objective:** Verify story includes sensory descriptions

**Steps:**
1. Use the same story from Test 1
2. Count sensory details in the first segment

3. **Check for Sensory Details (Target: 2-3):**
   - ✅ Visual: colors, shapes, sizes
   - ✅ Auditory: sounds
   - ✅ Tactile: textures
   - ✅ Emotional: feelings

**Expected Result:**
```
✅ PASS (3 sensory details):
"The curious orange cat winks at you with bright green eyes. It's a sunny day, 
and you're playing in your backyard. Suddenly, the cat sees something shiny 
sparkling beyond the fence."

Visual: "orange cat", "bright green eyes", "shiny sparkling"
Emotional: "Suddenly" (creates excitement)
```

**Scoring:**
- 3+ sensory details = ✅ PASS
- 1-2 sensory details = ⚠️ ACCEPTABLE
- 0 sensory details = ❌ FAIL

---

### **Test 4: Choice Impact Previews (High Priority)**

**Objective:** Verify choice impacts include action + emotion + anticipation

**Steps:**
1. Use the same story from Test 1
2. Read the impact preview for each choice

3. **Check Impact Structure (for each choice):**
   - ✅ Describes what happens (action consequence)
   - ✅ Includes how character feels (emotional response)
   - ✅ Hints at what's next (anticipation/mystery)

**Expected Result:**
```
✅ PASS:
Choice: "Climb the fence to follow the cat"
Impact: "You climb over the fence and follow the curious cat into the neighbor's 
garden. Your heart beats with excitement! What amazing things will you discover 
together?"

✓ Action: "You climb over the fence and follow the curious cat"
✓ Emotion: "Your heart beats with excitement!"
✓ Anticipation: "What amazing things will you discover together?"
```

**Scoring:**
- All 3 elements present = ✅ PASS
- 2 elements present = ⚠️ ACCEPTABLE
- 1 or fewer elements = ❌ FAIL

---

### **Test 5: Choice Text Quality (Medium Priority)**

**Objective:** Verify choices start with action verbs and are concise

**Steps:**
1. Use the same story from Test 1
2. Examine the choice text (not the impact)

3. **Check Choice Text:**
   - ✅ Starts with an action verb (climb, look, ask, explore, help, follow)
   - ✅ Is 5-10 words long
   - ✅ Is clear and age-appropriate

**Expected Result:**
```
✅ PASS:
- "Climb the fence to follow the cat" (6 words, starts with "Climb")
- "Look around the yard first" (5 words, starts with "Look")

❌ FAIL:
- "The fence looks interesting to climb" (doesn't start with action verb)
- "You should probably think about whether or not to climb" (too long, 11 words)
```

---

### **Test 6: Multi-Language Support (Critical for Swedish)**

**Objective:** Verify Swedish stories work correctly

**Steps:**
1. Create a new story:
   - Age Group: 7-9
   - Genre: Fantasy
   - Language: Swedish (sv)
   - Prompt: "En magisk drake hittar en skattkarta"

2. Generate the first segment

3. **Check Swedish Content:**
   - ✅ Story content is in Swedish
   - ✅ Choice text is in Swedish
   - ✅ Impact previews are in Swedish
   - ✅ NO English words mixed in
   - ✅ Grammar fixes still apply (capitalization, no duplicates)

**Expected Result:**
```
✅ PASS:
"Den magiska draken hittar en gammal skattkarta i skogen. Hon blir väldigt 
upphetsad! Vad kan skatten innehålla?"

❌ FAIL:
"The magical dragon hittar en gammal skattkarta..." (mixed English/Swedish)
```

---

### **Test 7: Age-Appropriate Vocabulary (All Ages)**

**Objective:** Verify vocabulary matches age group

**Steps:**
1. Create stories for each age group:
   - 4-6: Simple words, short sentences
   - 7-9: Elementary vocabulary, medium sentences
   - 10-12: Intermediate vocabulary, varied sentences
   - 13+: Advanced vocabulary, complex sentences

2. **Check Vocabulary Complexity:**
   - ✅ 4-6: "cat", "run", "happy", "shiny" (very simple)
   - ✅ 7-9: "curious", "explore", "mysterious" (elementary)
   - ✅ 10-12: "ancient", "discovered", "cautiously" (intermediate)
   - ✅ 13+: "enigmatic", "contemplated", "treacherous" (advanced)

---

## 📊 **Test Results Template**

Use this template to record your test results:

```
=== STORY QUALITY IMPROVEMENTS TEST RESULTS ===
Date: [DATE]
Tester: [NAME]

Test 1: Grammar Validation
- Duplicate words: ✅ PASS / ❌ FAIL
- Capitalization: ✅ PASS / ❌ FAIL
- Punctuation: ✅ PASS / ❌ FAIL
Notes: [Any issues found]

Test 2: Pronoun Usage
- Uses "he/she" for animals: ✅ PASS / ⚠️ ACCEPTABLE / ❌ FAIL
- Natural pronoun flow: ✅ PASS / ❌ FAIL
Notes: [Any issues found]

Test 3: Sensory Details
- Count: [NUMBER] sensory details
- Score: ✅ PASS (3+) / ⚠️ ACCEPTABLE (1-2) / ❌ FAIL (0)
Examples: [List sensory details found]

Test 4: Choice Impact Previews
- Choice 1: ✅ PASS / ⚠️ ACCEPTABLE / ❌ FAIL
  - Action: ✅ / ❌
  - Emotion: ✅ / ❌
  - Anticipation: ✅ / ❌
- Choice 2: ✅ PASS / ⚠️ ACCEPTABLE / ❌ FAIL
  - Action: ✅ / ❌
  - Emotion: ✅ / ❌
  - Anticipation: ✅ / ❌

Test 5: Choice Text Quality
- Starts with action verb: ✅ PASS / ❌ FAIL
- Word count (5-10): ✅ PASS / ❌ FAIL
- Age-appropriate: ✅ PASS / ❌ FAIL

Test 6: Multi-Language (Swedish)
- Content in Swedish: ✅ PASS / ❌ FAIL / N/A
- No English mixing: ✅ PASS / ❌ FAIL / N/A
- Grammar fixes applied: ✅ PASS / ❌ FAIL / N/A

Test 7: Age-Appropriate Vocabulary
- 4-6: ✅ PASS / ❌ FAIL / N/A
- 7-9: ✅ PASS / ❌ FAIL / N/A
- 10-12: ✅ PASS / ❌ FAIL / N/A
- 13+: ✅ PASS / ❌ FAIL / N/A

OVERALL ASSESSMENT:
- Total Tests Passed: [X] / 7
- Critical Issues: [LIST]
- Recommendations: [LIST]
```

---

## 🔍 **Debugging Tips**

### **If Grammar Fixes Aren't Working:**

1. **Check Edge Function Logs:**
   ```bash
   # View logs for generate-story function
   supabase functions logs generate-story --tail
   
   # View logs for generate-story-segment function
   supabase functions logs generate-story-segment --tail
   ```

2. **Look for Validation Log Entries:**
   ```
   "Text corrections applied" - Indicates validation ran
   "hadDuplicates: true" - Duplicate words were found and fixed
   "hadCapitalizationIssues: true" - Capitalization was fixed
   ```

3. **Verify Function Deployment:**
   ```bash
   supabase functions list
   # Check deployment timestamp
   ```

---

### **If Sensory Details Are Missing:**

1. **Check AI Prompt:**
   - Verify `prompt-templates.ts` includes sensory detail requirements
   - Check if system prompt is being used correctly

2. **Review AI Response:**
   - Check Edge Function logs for raw AI response
   - See if AI is following instructions

3. **Adjust Temperature:**
   - Current: 0.6
   - Try: 0.7-0.8 for more creative descriptions

---

### **If Choice Impacts Are Weak:**

1. **Check Prompt Requirements:**
   - Verify 3-element structure is in prompt
   - Check examples in prompt are clear

2. **Review Generated Impacts:**
   - Are they too short? (increase word count requirement)
   - Are they too generic? (add more specific examples)

3. **Consider Model Selection:**
   - Some AI models are better at creative writing
   - Check which model is being used in logs

---

## 📈 **Success Criteria**

**Minimum Passing Scores:**
- Test 1 (Grammar): 100% pass (critical)
- Test 2 (Pronouns): 70% pass (high priority)
- Test 3 (Sensory Details): 80% pass (medium priority)
- Test 4 (Choice Impacts): 80% pass (high priority)
- Test 5 (Choice Text): 90% pass (medium priority)
- Test 6 (Multi-Language): 100% pass if applicable (critical)
- Test 7 (Vocabulary): 90% pass (medium priority)

**Overall Success:** 6/7 tests pass with minimum scores

---

## 🚀 **Next Steps After Testing**

### **If All Tests Pass:**
1. ✅ Deploy to production
2. ✅ Monitor user feedback
3. ✅ Track quality metrics
4. ✅ Document success

### **If Some Tests Fail:**
1. ⚠️ Identify root cause
2. ⚠️ Adjust prompts or validation logic
3. ⚠️ Re-test failed scenarios
4. ⚠️ Iterate until passing

### **If Critical Tests Fail:**
1. ❌ Do NOT deploy to production
2. ❌ Debug Edge Functions
3. ❌ Review prompt templates
4. ❌ Check validation function logic
5. ❌ Re-test from scratch

---

## 📞 **Support**

**If you encounter issues:**
1. Check Edge Function logs
2. Review `STORY-QUALITY-IMPROVEMENTS-SUMMARY.md`
3. Verify deployment status
4. Test with different age groups/genres
5. Document unexpected behavior

**Common Issues:**
- **Grammar fixes not applied:** Check if `validateAndCorrectText()` is called
- **Prompts not working:** Verify prompt template deployment
- **Swedish not working:** Check language code is passed correctly
- **Sensory details missing:** AI may need more explicit examples

---

**Happy Testing! 🎉**

