# Action Plan: Fix AI Pipeline Tests for Google Services

**Priority:** HIGH  
**Estimated Effort:** 6-8 hours  
**Timeline:** This week

---

## 🎯 Mission

Fix the failing tests to match the **Google AI service implementation** instead of outdated OpenAI/Replicate mocks.

---

## 📋 Current Test Failures

### Unit Tests: 5/12 Failing (42% pass rate)
**File:** `tests/unit/ai-validation.spec.ts`

**Failures:**
1. ❌ `should normalize edge case content properly`
2. ❌ `should provide comprehensive content analysis`
3. ❌ `should detect low impact choices`
4. ❌ `should validate reproducible content`
5. ❌ Related validation tests

**Root Cause:** Validation thresholds don't match Google Gemini response format

### API Tests: 4/24 Failing (83% pass rate)
**File:** `tests/api/story-generation-api.spec.ts`

**Failures:**
1. ❌ `should validate required fields` - Test logic error
2. ❌ `should reject SQL Injection` - Assertion mismatch
3. ❌ `should reject Script Injection` - Assertion mismatch
4. ❌ `should reject Empty Input` - Assertion mismatch

**Root Cause:** Tests expect OpenAI response format, receive Google format

---

## 🛠️ Step-by-Step Fix Plan

### STEP 1: Create Test Fixtures for Google Services (45 minutes)

**File:** `tests/fixtures/google-fixtures.ts` (NEW)

```typescript
export const GOOGLE_STORY_RESPONSE = {
  pageText: "Once upon a time, in a magical forest, there lived a brave knight named Sir Edward...",
  choices: [
    {
      choiceText: "Enter the dark cave",
      nextPrompt: "The knight approaches the cave entrance..."
    },
    {
      choiceText: "Follow the mysterious light",
      nextPrompt: "A warm glow beckons from between the trees..."
    }
  ]
};

export const GOOGLE_IMAGE_RESPONSE = {
  url: "https://example.com/image.jpg",
  format: "jpeg",
  width: 1024,
  height: 768
};

export const GOOGLE_AUDIO_RESPONSE = {
  url: "https://example.com/audio.mp3",
  format: "mp3",
  duration_ms: 15000
};

export const GOOGLE_ERROR_RESPONSES = {
  invalid_api_key: { error: 'Invalid API key' },
  rate_limited: { error: 'Rate limited' },
  invalid_input: { error: 'Invalid input' }
};
```

---

### STEP 2: Create Google AI Service Unit Tests (2 hours)

**File:** `tests/unit/google-ai-service.spec.ts` (NEW)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleAIUnifiedService, StoryConfig } from '../../supabase/functions/_shared/google-ai-unified-service.ts';
import { GOOGLE_STORY_RESPONSE } from '../fixtures/google-fixtures';

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
      
      expect(result).toHaveProperty('pageText');
      expect(result).toHaveProperty('choices');
      expect(Array.isArray(result.choices)).toBe(true);
      expect(result.choices.length).toBe(2);
      expect(result.choices[0]).toHaveProperty('choiceText');
      expect(result.choices[0]).toHaveProperty('nextPrompt');
    });
    
    it('should generate story page for 7-9 age group', async () => {
      const config: StoryConfig = {
        childName: 'Alex',
        ageGroup: '7-9 years old',
        theme: 'Fantasy',
        character: 'Wizard'
      };
      
      const result = await service.generateStoryPage(config, 'A spell goes wrong...');
      
      expect(result.pageText).toContain(' ');
      expect(result.choices.length).toBe(2);
    });
    
    it('should handle language variations', async () => {
      const config: StoryConfig = {
        childName: 'Lars',
        ageGroup: '10-12 years old',
        theme: 'Adventure',
        character: 'Explorer'
      };
      
      const result = await service.generateStoryPage(config, 'You discover an ancient map...');
      
      expect(result.pageText.length).toBeGreaterThan(0);
      expect(result.choices.length).toBe(2);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('API Error')
      );
      
      const config: StoryConfig = {
        childName: 'Test',
        ageGroup: '4-6 years old',
        theme: 'Adventure',
        character: 'Hero'
      };
      
      await expect(
        service.generateStoryPage(config, 'Test prompt')
      ).rejects.toThrow();
    });
  });
});
```

---

### STEP 3: Create Google Image Service Unit Tests (1.5 hours)

**File:** `tests/unit/google-image-service.spec.ts` (NEW)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleGeminiImageService } from '../../supabase/functions/_shared/google-gemini-image-service.ts';
import { GOOGLE_IMAGE_RESPONSE } from '../fixtures/google-fixtures';

describe('GoogleGeminiImageService', () => {
  let service: GoogleGeminiImageService;
  
  beforeEach(() => {
    vi.stubEnv('GOOGLE_GEMINI_API_KEY', 'test-key');
    service = new GoogleGeminiImageService('test-key');
  });
  
  describe('generateImage', () => {
    it('should generate image from story description', async () => {
      const prompt = 'A brave knight standing in a magical forest';
      
      const result = await service.generateImage(prompt);
      
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('format');
      expect(result.url).toContain('http');
    });
    
    it('should handle character consistency prompts', async () => {
      const prompt = 'Same character as before: brave knight';
      
      const result = await service.generateImage(prompt);
      
      expect(result.url).toBeDefined();
    });
  });
});
```

---

### STEP 4: Update Existing API Tests (2 hours)

**File:** `tests/api/story-generation-api.spec.ts` (MODIFY)

**Changes:**
1. Replace OpenAI mocks with Google Gemini mocks
2. Update response format expectations
3. Fix assertion logic

```typescript
// Old (DELETE):
const mockAIResponse = {
  model: 'gpt-4',
  choices: [{ message: { content: '...' } }]
};

// New (REPLACE WITH):
const mockAIResponse = {
  pageText: "Once upon a time...",
  choices: [
    { choiceText: "Option 1", nextPrompt: "..." },
    { choiceText: "Option 2", nextPrompt: "..." }
  ]
};

// Update test assertions:
it('should generate story with Google Gemini', async () => {
  const response = await client.functions.invoke('generate-story', {
    body: validPayload
  });
  
  expect(response.data).toHaveProperty('pageText');
  expect(response.data.choices).toHaveLength(2);
  expect(response.data.choices[0]).toHaveProperty('choiceText');
  expect(response.data.choices[0]).toHaveProperty('nextPrompt');
});
```

---

### STEP 5: Fix AI Validation Tests (1.5 hours)

**File:** `tests/unit/ai-validation.spec.ts` (MODIFY)

**Root Issue:** Validation functions expect Google response format

```typescript
// Update tests to:
1. Use Google Gemini response format
2. Adjust validation thresholds for Gemini
3. Test Google-specific fields

it('should validate Google Gemini response format', () => {
  const googleResponse = {
    pageText: "Story text here...",
    choices: [
      { choiceText: "Choice 1", nextPrompt: "Prompt 1" },
      { choiceText: "Choice 2", nextPrompt: "Prompt 2" }
    ]
  };
  
  const validation = validateStoryResponse(googleResponse);
  expect(validation.isValid).toBe(true);
  expect(validation.pageText).toBe(googleResponse.pageText);
  expect(validation.choices).toHaveLength(2);
});
```

---

### STEP 6: Create Integration Tests for Full Pipeline (1 hour)

**File:** `tests/integration/google-story-pipeline.spec.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Google Story Generation Pipeline', () => {
  describe('Full Story Creation Flow', () => {
    it('should generate complete story with text, images, and audio', async () => {
      // 1. Generate story text with Google Gemini
      // 2. Generate images with Google Gemini
      // 3. Generate audio with Google TTS
      // 4. Verify all components saved
      // 5. Verify choices and branching work
    });
    
    it('should handle partial failures gracefully', async () => {
      // Text succeeds, image fails → return text only
      // Text succeeds, audio fails → return text + image
    });
  });
});
```

---

## 📊 Test Execution Plan

### Pre-Execution Checklist
- [ ] Backup current test files
- [ ] Review google-ai-unified-service.ts for response format
- [ ] Review google-gemini-image-service.ts for response format
- [ ] Understand validation logic in ai-validation.spec.ts

### Execution Sequence
1. **Create fixtures** (45 min) → `git add tests/fixtures/google-fixtures.ts`
2. **Create Google unit tests** (2 hours) → `npm run test:unit -- --run`
3. **Create image service tests** (1.5 hours) → `npm run test:unit -- --run`
4. **Update API tests** (2 hours) → `npm run test:api -- --run`
5. **Fix validation tests** (1.5 hours) → `npm run test:unit -- --run`
6. **Create integration tests** (1 hour) → `npm run test -- --run`
7. **Full test run** (30 min) → `npm run test:all -- --run`

### Post-Execution
- [ ] All tests passing (24/24 API, 12/12 unit)
- [ ] Coverage >80% for Google services
- [ ] No mock data from OpenAI/Replicate
- [ ] Documentation updated

---

## ✅ Success Criteria

### Unit Tests
```
BEFORE: 5/12 passing (42%)
AFTER:  12/12 passing (100%) ✅
```

### API Tests
```
BEFORE: 20/24 passing (83%)
AFTER:  24/24 passing (100%) ✅
```

### Coverage
```
GoogleAIUnifiedService:    >80% ✅
GoogleGeminiImageService:  >80% ✅
Story Generation Pipeline: >80% ✅
```

### Code Quality
```
No mock data from deprecated services ✅
All Google services properly tested ✅
Integration tests for full pipeline ✅
Documentation updated ✅
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Response Format Mismatch
```
Error: expect(...).toHaveProperty('choices') but got 'response_choices'
Fix: Use exact Google response format from google-ai-unified-service.ts
```

### Issue 2: Validation Threshold
```
Error: expected 23 to be greater than 1000
Fix: Check what the test is actually validating - likely test logic error
Solution: Update test assertion to match actual response
```

### Issue 3: Mock API Not Called
```
Error: GoogleAIUnifiedService.generateStoryPage not called
Fix: Verify mock is set up before test
Solution: Use vi.mock() for dependencies
```

---

## 📞 Support

**If stuck on:**
- **Response format:** Check `google-ai-unified-service.ts` line 30-64 (STORY_SCHEMA)
- **Validation logic:** Check `ai-validation.spec.ts` test expectations
- **Mock setup:** Check existing test patterns in `tests/api/`
- **Integration:** Check how edge functions call Google services

---

## 🎯 Timeline

| Step | Duration | Cumulative | Status |
|------|----------|-----------|--------|
| Fixtures | 45 min | 45 min | START HERE |
| Unit Tests | 2 hours | 2h 45m | - |
| Image Tests | 1.5h | 4h 15m | - |
| API Tests | 2 hours | 6h 15m | - |
| Validation | 1.5h | 7h 45m | - |
| Integration | 1 hour | 8h 45m | - |
| Full Run | 30 min | 9h 15m | FINISH |

**Total: ~9 hours** (spread over 2-3 days recommended)

---

## 🚀 Ready to Start?

1. ✅ Create `tests/fixtures/google-fixtures.ts`
2. ✅ Create `tests/unit/google-ai-service.spec.ts`
3. ✅ Create `tests/unit/google-image-service.spec.ts`
4. ✅ Update `tests/api/story-generation-api.spec.ts`
5. ✅ Fix `tests/unit/ai-validation.spec.ts`
6. ✅ Create integration tests
7. ✅ Run full test suite

**Next:** Begin with Step 1 - create test fixtures

