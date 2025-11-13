# TTS Subscription Gating Pattern - Reference Guide for Video Generation

## Overview
This document outlines how Text-to-Speech (TTS) is properly locked behind subscriptions, serving as a reference architecture for implementing similar subscription checks for video generation.

## Key Files Involved

### Backend (Supabase Edge Functions)

1. **`/supabase/functions/generate-audio-v2/index.ts`** - Main TTS endpoint (Gemini)
2. **`/supabase/functions/generate-story-audio/index.ts`** - Secondary TTS endpoint (ElevenLabs)
3. **`/supabase/functions/check-subscription/index.ts`** - Subscription verification service
4. **`/supabase/functions/_shared/credit-system.ts`** - Credit validation and deduction
5. **`/supabase/functions/_shared/credit-costs.ts`** - Credit pricing configuration
6. **`/supabase/functions/_shared/response-handlers.ts`** - Standardized error responses

### Frontend (React)

1. **`/src/components/story-lifecycle/VoiceGenerationDrawer.tsx`** - UI for voice generation
2. **`/src/components/story-viewer/AudioControls.tsx`** - Audio player controls
3. **`/src/lib/api/ai-client.ts`** - Client for calling edge functions with error handling
4. **`/src/lib/api/credit-api.ts`** - Credit calculation utilities
5. **`/src/hooks/useSubscription.ts`** - Subscription state management

---

## PART 1: SUBSCRIPTION GATE IMPLEMENTATION

### 1.1 Backend Subscription Check (Subscription-First Gate)

**Location:** `/supabase/functions/generate-audio-v2/index.ts` (Lines 42-68)

```typescript
// Check if user has paid subscription (TTS requires subscription)
const { data: userProfile, error: profileError } = await creditService.supabase
  .from('profiles')
  .select('subscription_tier')
  .eq('id', userId)
  .single();

if (profileError || !userProfile) {
  logger.error('Failed to fetch user profile', { userId, error: profileError });
  throw new Error('Failed to verify subscription status');
}

const isPaidUser = userProfile.subscription_tier !== 'free';

if (!isPaidUser) {
  logger.warn('Free user attempted to use TTS', { userId, requestId });
  return ResponseHandler.error(
    'TTS_REQUIRES_SUBSCRIPTION',
    403, // Forbidden
    {
      error: 'feature_locked',
      message: 'Text-to-Speech (TTS) narration is only available for paid subscribers. Upgrade to unlock!',
      feature: 'tts',
      upgradeUrl: '/pricing'
    }
  );
}

logger.info('Subscription check passed for TTS', { userId, tier: userProfile.subscription_tier });
```

**Key Pattern:**
- Fetch user's `subscription_tier` from profiles table
- Check if tier is NOT 'free'
- Return 403 Forbidden with structured error object containing:
  - `error: 'feature_locked'` - Error classification
  - `message` - User-friendly explanation
  - `feature` - Feature identifier for analytics
  - `upgradeUrl` - Where to upgrade

---

### 1.2 Similar Pattern in Video Generation

**Location:** `/supabase/functions/generate-video-v2/index.ts` (Lines 87-116)

```typescript
// Check if user has paid subscription (Video requires subscription)
const supabase = createSupabaseClient(true);
const { data: userProfile, error: profileError } = await supabase
  .from('profiles')
  .select('subscription_tier')
  .eq('id', userId)
  .single();

if (profileError || !userProfile) {
  logger.error('Failed to fetch user profile', { userId, error: profileError });
  throw new Error('Failed to verify subscription status');
}

const isPaidUser = userProfile.subscription_tier !== 'free';

if (!isPaidUser) {
  logger.warn('Free user attempted to use Video', { userId, requestId });
  return ResponseHandler.error(
    'VIDEO_REQUIRES_SUBSCRIPTION',
    403, // Forbidden
    {
      error: 'feature_locked',
      message: 'Video animation is only available for paid subscribers. Upgrade to unlock!',
      feature: 'video',
      upgradeUrl: '/pricing'
    }
  );
}

logger.info('Subscription check passed for Video', { userId, tier: userProfile.subscription_tier });
```

**Note:** Video generation ALREADY implements the subscription check correctly!

---

## PART 2: CREDIT SYSTEM (Second Layer of Protection)

### 2.1 Credit Costs Configuration

**Location:** `/supabase/functions/_shared/credit-costs.ts`

```typescript
export const CREDIT_COSTS = {
  // Story Generation (FREE)
  story: 0,
  segment: 0,
  image: 0,
  
  // Audio Generation (PAID)
  audioPerWord: 0.01,         // $0.01 per word (100 words = 1 credit)
  audioPerChapter: 2,         // Flat rate: 2 credits per chapter
  
  // Video Animation (PAID - based on duration)
  videoShort: 5,              // 2-3 seconds
  videoMedium: 8,             // 4-5 seconds
  videoLong: 12,              // 6-8 seconds
  
  // Legacy (kept for backwards compatibility)
  audioGeneration: 1,         // Per 100 words
} as const;
```

### 2.2 Audio Credit Calculation

```typescript
/**
 * Calculate audio credits based on word count
 * Pricing: 1 credit per 100 words, rounded up
 */
export function calculateAudioCredits(text: string): number {
  const trimmedText = text.trim();
  if (!trimmedText) return 0;
  
  const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / 100));
}
```

**Examples:**
- 1-100 words = 1 credit
- 101-200 words = 2 credits
- 201-300 words = 3 credits

### 2.3 Credit Validation Flow (TTS Endpoint)

**Location:** `/supabase/functions/generate-audio-v2/index.ts` (Lines 83-116)

```typescript
// Calculate credits based on word count (1 credit per 100 words)
const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
const creditsRequired = calculateAudioCredits(text);

logger.info('Audio generation V2 started (Gemini TTS)', {
  requestId,
  userId,
  voiceId,
  textLength: text.length,
  wordCount,
  creditsRequired,
  pricing: '1 credit per 100 words (rounded up)'
});

// Validate credits BEFORE generating
const { hasCredits, currentCredits } = await creditService.checkUserCredits(userId, creditsRequired);
if (!hasCredits) {
  logger.error('Insufficient credits for audio generation V2', {
    userId,
    wordCount,
    creditsRequired,
    currentCredits,
    requestId
  });
  return ResponseHandler.error(
    'INSUFFICIENT_CREDITS',
    402,
    {
      required: creditsRequired,
      available: currentCredits,
      message: `Insufficient credits. Required: ${creditsRequired} credits for ${wordCount} words, Available: ${currentCredits}`
    }
  );
}

logger.info('Credits validated for audio generation V2', {
  userId,
  wordCount,
  creditsRequired,
  currentCredits,
  requestId
});

// Generate audio...

// Deduct credits AFTER successful generation
const creditResult = await creditService.deductCredits(
  userId,
  creditsRequired,
  'Audio generation (Gemini TTS - word-based)',
  requestId,
  'audio_generation',
  {
    requestId,
    wordCount,
    voiceId,
    creditsCalculation: `${wordCount} words = ${creditsRequired} credits (1 per 100 words)`
  }
);
```

**Critical Pattern:**
1. ✓ Calculate credits BEFORE generation
2. ✓ Validate user has sufficient credits (don't deduct yet)
3. ✓ Return 402 Payment Required if insufficient
4. ✓ Generate content on success
5. ✓ Deduct credits AFTER successful generation (not before!)
6. ✓ Return new balance with response

---

## PART 3: ERROR HANDLING & RESPONSE PATTERNS

### 3.1 Standard Error Codes

**Location:** `/supabase/functions/_shared/response-handlers.ts`

```typescript
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### 3.2 Feature-Locked Error Response

```typescript
ResponseHandler.error(
  'TTS_REQUIRES_SUBSCRIPTION',
  403, // HTTP Status: Forbidden
  {
    error: 'feature_locked',          // Error classification
    message: 'Text-to-Speech (TTS) narration is only available for paid subscribers. Upgrade to unlock!',
    feature: 'tts',                   // Feature identifier for tracking
    upgradeUrl: '/pricing'            // Where user should go to upgrade
  }
);
```

### 3.3 Insufficient Credits Error Response

```typescript
ResponseHandler.error(
  'INSUFFICIENT_CREDITS',
  402, // HTTP Status: Payment Required
  {
    required: creditsRequired,        // Credits needed
    available: currentCredits,        // Credits user has
    message: `Insufficient credits. Required: ${creditsRequired} credits for ${wordCount} words, Available: ${currentCredits}`
  }
);
```

---

## PART 4: FRONTEND ERROR HANDLING

### 4.1 AIClient Error Handling

**Location:** `/src/lib/api/ai-client.ts`

```typescript
export class AIClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

export class InsufficientCreditsError extends AIClientError {
  public creditsRequired: number;
  public creditsAvailable: number;
  
  constructor(
    public required: number,
    public available: number
  ) {
    super(`Insufficient credits. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_CREDITS', 400);
    this.creditsRequired = required;
    this.creditsAvailable = available;
  }
}
```

### 4.2 Frontend Credit Display

**Location:** `/src/components/story-lifecycle/VoiceGenerationDrawer.tsx` (Lines 74-94)

```typescript
// Calculate word count for display purposes
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

// Flat rate audio credits per chapter
const calculateAudioCredits = (): number => {
  return CREDIT_COSTS.audioPerChapter;
};

const creditsRequired = calculateAudioCredits();
const wordCount = countWords(chapter.content);

// Display in UI
<p className="text-xs text-[#C9C5D5] mt-1">
  {wordCount} words • <span className="font-semibold text-primary">{creditsRequired} credits</span> to generate voice
</p>
```

### 4.3 Frontend Error Handling in Voice Drawer

**Location:** `/src/components/story-lifecycle/VoiceGenerationDrawer.tsx` (Lines 140-245)

```typescript
const handleGenerate = async () => {
  try {
    setGenerating(true);

    // Call audio generation API
    const result = await AIClient.invoke('generate-story-audio', {
      text: chapter.content,
      segment_id: chapter.id,
      voice_id: voiceId,
      speed,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate voice');
    }

    // Update segment with audio URL and status
    await supabase
      .from('story_segments')
      .update({
        audio_url: result.data.audio_url,
        voice_status: 'ready',
        audio_generation_status: 'completed',
      })
      .eq('id', chapter.id);

    toast({
      title: 'Voice Generated!',
      description: `Chapter ${chapter.segment_number} now has voice narration.`,
    });

    onSuccess();
    onClose();
  } catch (error: any) {
    logger.error('Failed to generate voice', error);

    // Update status to failed with error
    await supabase
      .from('story_segments')
      .update({
        voice_status: 'failed',
        voice_error: error.message || 'Unknown error',
      })
      .eq('id', chapter.id);

    toast({
      title: 'Generation Failed',
      description: error.message || 'Failed to generate voice. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setGenerating(false);
  }
};
```

---

## PART 5: COMPREHENSIVE FLOW DIAGRAM

```
USER REQUESTS TTS/AUDIO GENERATION
         |
         v
[Frontend] VoiceGenerationDrawer.tsx
         |
         | AIClient.invoke('generate-story-audio')
         v
[Backend] generate-story-audio/index.ts
         |
         +---> 1. Get Authorization Header
         |     └─> Extract User ID
         |
         +---> 2. SUBSCRIPTION CHECK ⭐ (FIRST GATE)
         |     │
         |     ├─> Query: SELECT subscription_tier FROM profiles
         |     │
         |     └─> IF tier == 'free':
         |        └─> Return 403 Forbidden + 'feature_locked' error
         |           └─> Stop here, don't proceed
         |
         +---> 3. Parse Request Body
         |     └─> Extract: text, voice_id, segment_id
         |
         +---> 4. CREDIT CALCULATION
         |     └─> Calculate credits based on word count
         |        └─> 1 credit per 100 words
         |
         +---> 5. CREDIT CHECK ⭐ (SECOND GATE)
         |     │
         |     ├─> Query: SELECT current_balance FROM user_credits
         |     │
         |     └─> IF available < required:
         |        └─> Return 402 Payment Required
         |           └─> Stop here, don't proceed
         |
         +---> 6. GENERATE AUDIO (ElevenLabs API)
         |     └─> Success = Audio generated
         |
         +---> 7. UPLOAD TO STORAGE
         |     └─> Supabase Storage
         |
         +---> 8. DEDUCT CREDITS (AFTER SUCCESS)
         |     └─> RPC: spend_credits()
         |
         v
Return Success + audio_url + credits_remaining
         |
         v
[Frontend] Update UI
         |
         ├─> Display audio playback
         ├─> Show credits remaining
         └─> Display success toast
```

---

## PART 6: KEY IMPLEMENTATION PRINCIPLES

### Principle 1: Subscription-First, Credits-Second
- **ALWAYS** check subscription tier BEFORE doing any credit calculations
- Subscription gate is about **feature access**, not billing
- Credit system is about **usage limits**, not feature availability

### Principle 2: Fail-Safe Error Codes
- **403 Forbidden** - Feature locked due to subscription tier
- **402 Payment Required** - Insufficient credits for operation
- Use distinct error codes in response body for client-side handling

### Principle 3: Pre-Generation Validation
- Calculate costs BEFORE generation
- Validate credits BEFORE making expensive API calls
- Never waste expensive API calls on users who can't pay

### Principle 4: Post-Generation Credit Deduction
- Generate first on success
- Deduct credits ONLY after confirming generation succeeded
- This prevents credit deduction if generation fails
- Log the credit calculation with the deduction for auditing

### Principle 5: User Communication
- Always show credit costs BEFORE generation
- Show credit balance AFTER generation
- Display error messages with actionable guidance (upgrade link, etc.)

### Principle 6: Logging & Auditing
- Log every subscription check attempt
- Log credit validation with word counts and calculations
- Log successful deductions with full metadata
- Log failures with enough context for debugging

---

## PART 7: IMPLEMENTATION CHECKLIST FOR VIDEO GENERATION

To properly gate video generation behind subscriptions, follow this checklist:

### Backend Implementation
- [ ] Check subscription tier FIRST (before any generation)
- [ ] Return 403 with 'feature_locked' error if free tier
- [ ] Calculate video credits based on duration (5/8/12)
- [ ] Validate credits BEFORE generation
- [ ] Return 402 if insufficient credits
- [ ] Generate video on success
- [ ] Deduct credits AFTER successful generation
- [ ] Include credit calculation in deduction metadata
- [ ] Log all steps with requestId for tracking

### Frontend Implementation
- [ ] Display credit cost in UI BEFORE generation attempt
- [ ] Show current credit balance
- [ ] Handle 403 errors with upgrade prompts
- [ ] Handle 402 errors with "insufficient credits" message
- [ ] Display error messages from backend
- [ ] Update UI with remaining credits after generation
- [ ] Show generation progress/status
- [ ] Handle failures gracefully with retry option

### Database/RPC Functions
- [ ] Verify `spend_credits()` RPC function exists
- [ ] Verify credit calculation logic matches frontend
- [ ] Test credit deduction with various amounts
- [ ] Verify subscription tier check queries

### Testing
- [ ] Test free user → 403 error
- [ ] Test paid user with insufficient credits → 402 error
- [ ] Test paid user with sufficient credits → success
- [ ] Test credit balance updated correctly
- [ ] Test error messages displayed correctly
- [ ] Test logging captures all relevant details

---

## PART 8: EXACT CODE PATTERNS TO COPY

### Pattern 1: Subscription Gate (Copy This!)

```typescript
// Check if user has paid subscription (FEATURE requires subscription)
const { data: userProfile, error: profileError } = await creditService.supabase
  .from('profiles')
  .select('subscription_tier')
  .eq('id', userId)
  .single();

if (profileError || !userProfile) {
  logger.error('Failed to fetch user profile', { userId, error: profileError });
  throw new Error('Failed to verify subscription status');
}

const isPaidUser = userProfile.subscription_tier !== 'free';

if (!isPaidUser) {
  logger.warn('Free user attempted to use FEATURE', { userId, requestId });
  return ResponseHandler.error(
    'FEATURE_REQUIRES_SUBSCRIPTION',
    403,
    {
      error: 'feature_locked',
      message: 'FEATURE is only available for paid subscribers. Upgrade to unlock!',
      feature: 'feature_name',
      upgradeUrl: '/pricing'
    }
  );
}

logger.info('Subscription check passed for FEATURE', { userId, tier: userProfile.subscription_tier });
```

### Pattern 2: Credit Validation (Copy This!)

```typescript
// Calculate and validate credits
const creditsRequired = calculateCredits(params);

logger.info('FEATURE started', {
  requestId,
  userId,
  creditsRequired,
  pricing: 'describe pricing here'
});

// Validate credits BEFORE generating
const { hasCredits, currentCredits } = await creditService.checkUserCredits(userId, creditsRequired);
if (!hasCredits) {
  logger.error('Insufficient credits for FEATURE', {
    userId,
    creditsRequired,
    currentCredits,
    requestId
  });
  return ResponseHandler.error(
    'INSUFFICIENT_CREDITS',
    402,
    {
      required: creditsRequired,
      available: currentCredits,
      message: `Insufficient credits. Required: ${creditsRequired}, Available: ${currentCredits}`
    }
  );
}

logger.info('Credits validated for FEATURE', {
  userId,
  creditsRequired,
  currentCredits,
  requestId
});
```

### Pattern 3: Post-Generation Credit Deduction (Copy This!)

```typescript
// Generate content...
const result = await expensiveApiCall(params);

// Deduct credits AFTER successful generation
const creditResult = await creditService.deductCredits(
  userId,
  creditsRequired,
  'FEATURE description',
  requestId,
  'feature_type',
  {
    requestId,
    calculationDetails: 'explain how credits were calculated'
  }
);

logger.info('FEATURE completed successfully', {
  requestId,
  userId,
  creditsUsed: creditsRequired,
  newBalance: creditResult.newBalance,
  pricing: 'show pricing calculation'
});

return ResponseHandler.success({
  success: true,
  result: result,
  credits_used: creditsRequired,
  credits_remaining: creditResult.newBalance,
  pricing_info: 'user-friendly pricing explanation'
});
```

---

## PART 9: SUBSCRIPTION TIERS & CREDIT LIMITS

From `check-subscription/index.ts`:

```typescript
const creditsPerMonth = dbTier === 'starter' ? 100 : dbTier === 'premium' ? 300 : 10;
```

**Current Structure:**
- **Free Tier**: 10 credits/month
- **Starter Tier**: 100 credits/month  
- **Premium Tier**: 300 credits/month

**Credit Consumption Examples (Audio):**
- 100 words = 1 credit
- 1000 words = 10 credits
- 5000 words = 50 credits

**Credit Consumption Examples (Video - Proposed):**
- Short video (2-3 sec) = 5 credits
- Medium video (4-5 sec) = 8 credits
- Long video (6-8 sec) = 12 credits

---

## SUMMARY

The TTS implementation provides a **two-layer protection system**:

1. **Subscription Tier Gate** - Prevents free users from accessing the feature entirely
2. **Credit System** - Limits usage for paid users based on monthly allocation

The **exact same pattern is already implemented for video generation** in `generate-video-v2/index.ts`.

The key is to:
- Always check subscription tier FIRST
- Return clear, actionable error messages
- Deduct credits ONLY after successful generation
- Log comprehensively for auditing
- Display costs to users BEFORE generation
