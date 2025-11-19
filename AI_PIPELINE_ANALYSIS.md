# AI Pipeline Analysis & Testing Strategy

**Date:** 2025-01-09  
**Status:** Analysis of Google Service Integration & Testing Gaps

---

## 📊 Current Situation

### What We Found
The codebase has **multiple AI service implementations**, but the tests haven't been updated to match:

#### Current Services Available:
1. **Google AI Unified Service** (`google-ai-unified-service.ts`)
   - Gemini 2.5 Flash for story text (main)
   - Gemini Nano Banana for images (free)
   - Gemini TTS for narration (free)
   - Veo 3.1 for video animation
   - ✅ **Working** - REST API implementation

2. **Google Gemini Image Service** (`google-gemini-image-service.ts`)
   - Specialized image generation
   - ✅ **Working** - REST API

3. **OpenRouter Service** (in `ai-service.ts`)
   - Cydonia 24B model
   - Claude 3.5 Sonnet (multilingual)
   - ⚠️ **Current primary** but tests don't reflect Google swap

4. **Legacy Services** (still in code)
   - OpenAI
   - Replicate
   - ❌ **Tests still assume these are primary**

5. **Other Services**:
   - Vertex AI Service (`vertex-ai-service.ts`)
   - Freepik Image Service (`freepik-image-service.ts`)

---

## 🔍 The Problem

### Root Cause: Service Swap Not Reflected in Tests

**What Happened:**
- ✅ Frontend code calls edge functions correctly
- ✅ Edge functions use Google services (working)
- ❌ Tests still mock OpenAI/Replicate responses
- ❌ Tests don't validate Google service responses
- ❌ No tests for Google Gemini integration
- ❌ Test assertions don't match Google response format

### Why Tests Are Failing:
```
1. AI Validation Tests (5/12 failing)
   - Expect OpenAI response format
   - Receive Google Gemini format
   - Mismatch in response parsing

2. API Tests (4/24 failing)  
   - Test assertions hard-coded for old providers
   - Input validation tests checking wrong things
   - Mock data doesn't match actual Google API responses
```

---

## 🧪 What Tests Need to Be Created/Fixed

### Priority 1: Create Google Service Tests
```
Tests Needed:
1. Google Gemini Text Generation Tests
   - Story page generation
   - Story seeds
   - Story segments
   - Title generation
   
2. Google Gemini Image Tests
   - Image generation with prompts
   - Response format validation
   - Error handling
   
3. Google TTS Tests
   - Audio generation
   - Voice selection
   - Language support
   
4. Google Veo Video Tests
   - Video generation
   - Animation quality
   - Response validation

Files to Create:
- tests/api/google-services.spec.ts (new)
- tests/unit/google-ai-service.spec.ts (new)
- tests/unit/google-image-service.spec.ts (new)
```

### Priority 2: Fix Existing Tests to Match Google
```
Files to Update:
1. tests/api/story-generation-api.spec.ts
   - Remove OpenAI mocks
   - Add Google Gemini mocks
   - Update response format expectations
   
2. tests/unit/ai-validation.spec.ts
   - Fix validation logic to match Google schemas
   - Update test fixtures
   - Adjust assertion thresholds
```

### Priority 3: Add Integration Tests
```
Tests Needed:
1. Google → Story Generation Pipeline
   - Request → Google Gemini → Response → Database
   - Choice generation
   - Language support
   
2. Google → Image Generation Pipeline
   - Text prompt → Image URL → Storage
   - Quality validation
   
3. Google → Audio Generation Pipeline
   - Text → Audio file → Storage
   - Voice quality
   
4. Full Story Creation Flow
   - Text + Image + Audio together
   - Timing and orchestration
   - Error recovery
```

---

## 📋 Detailed Testing Strategy

### Phase 1: Google Service Unit Tests

#### Test 1.1: GoogleAIUnifiedService - Story Generation
```typescript
describe('GoogleAIUnifiedService - Story Generation', () => {
  it('should generate story page with choices for 4-6 age group', async () => {
    // Uses Gemini 2.5 Flash
    // Returns: { pageText, choices: [{ choiceText, nextPrompt }] }
    // Validates: Age-appropriate content, valid choices
  });
  
  it('should handle different age groups (7-9, 10-12, 13+)', async () => {
    // Tests age-specific instructions
    // Validates language complexity
  });
  
  it('should validate schema matches expectations', async () => {
    // Expects EXACT schema from google-ai-unified-service.ts
    // Properties: pageText (STRING), choices (ARRAY)
  });
});
```

#### Test 1.2: GoogleGeminiImageService - Images
```typescript
describe('GoogleGeminiImageService - Image Generation', () => {
  it('should generate image from story description', async () => {
    // Uses Gemini Nano (FREE)
    // Input: Story text + art style
    // Output: Image URL
  });
  
  it('should handle character consistency prompts', async () => {
    // Reference images + style descriptions
  });
});
```

#### Test 1.3: GoogleAIUnifiedService - Audio
```typescript
describe('GoogleAIUnifiedService - Text-to-Speech', () => {
  it('should generate audio from story text', async () => {
    // Uses Gemini TTS (FREE)
    // Input: Text + language code
    // Output: Audio URL
  });
  
  it('should support multiple languages', async () => {
    // English, Swedish, etc.
  });
});
```

### Phase 2: API Integration Tests

#### Test 2.1: Story Generation API
```typescript
describe('POST /generate-story with Google Services', () => {
  it('should call GoogleAIUnifiedService correctly', async () => {
    // Mock Google API
    // Call edge function
    // Verify: GoogleAIUnifiedService.generateStoryPage() called
    // Validate response format matches expectations
  });
  
  it('should handle Google API errors gracefully', async () => {
    // API timeout
    // Rate limits
    // Invalid responses
  });
  
  it('should validate credit deduction before/after', async () => {
    // Credits deducted
    // Story saved
    // Metadata recorded
  });
});
```

#### Test 2.2: Image Generation API
```typescript
describe('POST /generate-story-image with Google', () => {
  it('should use GoogleGeminiImageService', async () => {
    // Verify correct service called
    // Validate response format
  });
});
```

### Phase 3: End-to-End Pipeline Tests

#### Test 3.1: Full Story Creation
```typescript
describe('Full Story Generation Pipeline', () => {
  it('should generate story + images + audio in sequence', async () => {
    1. Call generate-story → Google Gemini (text)
    2. Call generate-story-image → Google Gemini (image)
    3. Call generate-story-audio → Google Gemini (audio)
    4. Verify all components saved to database
  });
  
  it('should handle partial failures', async () => {
    // Text succeeds, image fails → still return text
    // Text succeeds, audio fails → still return text + image
  });
});
```

---

## 🔧 Implementation Plan

### Step 1: Create Google Service Test Fixtures
```
Location: tests/fixtures/google-fixtures.ts

Export:
- GOOGLE_STORY_RESPONSE (valid story format)
- GOOGLE_IMAGE_RESPONSE (valid image format)
- GOOGLE_AUDIO_RESPONSE (valid audio format)
- GOOGLE_ERROR_RESPONSES (error formats)
```

### Step 2: Create Google Service Unit Tests
```
Create: tests/unit/google-ai-service.spec.ts
- Import GoogleAIUnifiedService
- Test each method
- Mock API calls
- Validate responses

Create: tests/unit/google-image-service.spec.ts
- Import GoogleGeminiImageService
- Test image generation
- Mock API calls
```

### Step 3: Update Existing Tests
```
Edit: tests/api/story-generation-api.spec.ts
- Remove OpenAI mocks
- Add Google Gemini mocks
- Update assertions
- Re-run tests

Edit: tests/unit/ai-validation.spec.ts
- Update validation logic
- Fix assertion thresholds
- Add Google response examples
```

### Step 4: Add Integration Tests
```
Create: tests/integration/google-pipeline.spec.ts
- Test full story creation
- Test error handling
- Test retry logic
```

---

## 📊 Testing Matrix

| Service | Component | Test Type | Status | Priority |
|---------|-----------|-----------|--------|----------|
| Google Gemini | Text Generation | Unit | ❌ MISSING | 1 |
| Google Gemini | Image Generation | Unit | ❌ MISSING | 1 |
| Google Gemini | Audio Generation | Unit | ❌ MISSING | 1 |
| Google Veo | Video Generation | Unit | ❌ MISSING | 1 |
| Story API | Full Pipeline | Integration | ❌ MISSING | 2 |
| Google Services | Error Handling | Unit | ❌ MISSING | 2 |
| Google Services | Rate Limiting | Unit | ❌ MISSING | 2 |
| Legacy | OpenAI (deprecated) | Unit | ⚠️ OUTDATED | 3 |
| Legacy | Replicate (deprecated) | Unit | ⚠️ OUTDATED | 3 |

---

## 🚀 Quick Start: Fix Tests

### Option A: Quick Fix (2-4 hours)
Fix the failing tests to work with Google services:
```bash
1. Update test mocks to Google format
2. Fix assertions
3. Run tests
```

### Option B: Comprehensive Fix (4-8 hours)
Create full Google service test suite:
```bash
1. Create new test files
2. Add unit tests for each Google service
3. Update existing tests
4. Add integration tests
5. Run full suite
```

### Option C: Recommended (6-10 hours)
Do Option B + add missing services:
```bash
1. Test all Google services
2. Test legacy services for backwards compatibility
3. Add fallback/error handling tests
4. Document service architecture
```

---

## 📝 Example: Creating a Google Service Test

```typescript
// tests/unit/google-ai-service.spec.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleAIUnifiedService, StoryConfig } from '../supabase/functions/_shared/google-ai-unified-service.ts';

describe('GoogleAIUnifiedService', () => {
  let service: GoogleAIUnifiedService;
  
  beforeEach(() => {
    vi.stubEnv('GOOGLE_GEMINI_API_KEY', 'test-key');
    service = new GoogleAIUnifiedService('test-key');
  });
  
  describe('generateStoryPage', () => {
    it('should generate story page for 4-6 age group', async () => {
      const config: StoryConfig = {
        childName: 'Emma',
        ageGroup: '4-6 years old',
        theme: 'Adventure',
        character: 'Brave Knight'
      };
      
      const result = await service.generateStoryPage(
        config,
        'A mysterious forest appears before you...'
      );
      
      // Validate response format
      expect(result).toHaveProperty('pageText');
      expect(result).toHaveProperty('choices');
      expect(Array.isArray(result.choices)).toBe(true);
      expect(result.choices.length).toBe(2);
      
      // Validate choice format
      result.choices.forEach(choice => {
        expect(choice).toHaveProperty('choiceText');
        expect(choice).toHaveProperty('nextPrompt');
        expect(typeof choice.choiceText).toBe('string');
        expect(typeof choice.nextPrompt).toBe('string');
      });
    });
  });
});
```

---

## ✅ Success Criteria

### Tests Passing
- [ ] All Google service unit tests (>10 tests)
- [ ] All API tests use Google mocks (24/24)
- [ ] All validation tests pass (12/12)
- [ ] All integration tests pass (>5 tests)

### Coverage
- [ ] GoogleAIUnifiedService: >80% coverage
- [ ] GoogleGeminiImageService: >80% coverage
- [ ] Story generation pipeline: >80% coverage

### Documentation
- [ ] Google service architecture documented
- [ ] Test fixtures documented
- [ ] Migration guide for developers

---

## 🎯 Recommendation

**Start with Option B (Comprehensive Fix):**

This will:
1. ✅ Fix all failing tests
2. ✅ Ensure Google services work correctly
3. ✅ Document the new architecture
4. ✅ Provide examples for future development
5. ✅ Establish best practices

**Estimated Time: 6-8 hours**

**Why:**
- Tests will be production-ready
- Easier to maintain going forward
- Catches bugs early
- Documents implementation

---

## 📋 Files to Modify/Create

### New Test Files
```
- tests/unit/google-ai-service.spec.ts (150-200 lines)
- tests/unit/google-image-service.spec.ts (100-150 lines)
- tests/integration/google-pipeline.spec.ts (200-300 lines)
- tests/fixtures/google-fixtures.ts (100-200 lines)
```

### Existing Test Files to Update
```
- tests/api/story-generation-api.spec.ts (major update)
- tests/unit/ai-validation.spec.ts (moderate update)
```

### No Code Changes Needed
✅ The services are working correctly  
✅ The edge functions are calling Google APIs  
✅ Only tests need to be updated

---

**Status:** Ready to implement  
**Next Steps:** Create Google service tests  
**Timeline:** 1-2 days for comprehensive testing

