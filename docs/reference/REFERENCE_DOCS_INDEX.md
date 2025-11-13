# Reference Documentation Index

## TTS Subscription Pattern Documentation

### Main Documents

1. **TTS_SUBSCRIPTION_PATTERN.md** (20KB)
   - Complete reference guide for how TTS is locked behind subscriptions
   - 9 major sections covering backend, frontend, error handling, and flow diagrams
   - Contains 3 exact code patterns ready to copy/adapt
   - Complete implementation checklist for video generation
   - Subscription tier information and credit limits

2. **TTS_PATTERN_QUICK_REFERENCE.md** (4KB)
   - Quick reference guide with the essential patterns
   - 5-step implementation guide
   - HTTP status codes and error codes
   - Key file references
   - Testing checklist
   - Good for quick lookups while coding

## Key Findings Summary

### Architecture
- **Two-layer protection**: Subscription gate + Credit system
- **Order matters**: Check subscription FIRST, then credits, then generate
- **Deduction timing**: Validate BEFORE, deduct AFTER success only

### Subscription Gate
- Blocks 100% of free users from feature access
- Returns: HTTP 403 Forbidden + error: 'feature_locked'
- Includes: Upgrade URL and user-friendly message

### Credit System
- First layer: Calculate required credits
- Second layer: Validate user has sufficient credits
- Third layer: Generate content on success
- Fourth layer: Deduct credits AFTER confirmed success

### Current Implementation Status

**Audio/TTS (FULLY IMPLEMENTED):**
- `/supabase/functions/generate-audio-v2/index.ts` - Best reference
- `/supabase/functions/generate-story-audio/index.ts` - Alternative pattern
- Both have full subscription gate + credit system

**Video (PARTIALLY IMPLEMENTED):**
- `/supabase/functions/generate-video-v2/index.ts`
- Has: Subscription gate (lines 87-116)
- Missing: Credit validation & deduction

### Exact Code Patterns Documented

1. **Subscription Gate Pattern** - Copy this code
   - Query subscription_tier from profiles table
   - Check if tier != 'free'
   - Return 403 with 'feature_locked' error

2. **Credit Validation Pattern** - Copy this code
   - Calculate credits before generation
   - Check user has sufficient credits
   - Return 402 if insufficient

3. **Post-Generation Credit Deduction Pattern** - Copy this code
   - Generate content successfully first
   - Deduct credits using RPC call
   - Return balance with success response

## How to Use These Documents

### If you're implementing video credit system:
1. Read: TTS_PATTERN_QUICK_REFERENCE.md (5 min)
2. Copy: Pattern 1 (Subscription gate) - already in video!
3. Copy: Pattern 2 (Credit validation)
4. Copy: Pattern 3 (Credit deduction)
5. Reference: TTS_SUBSCRIPTION_PATTERN.md for detailed explanations

### If you're debugging credit issues:
1. Check: TTS_PATTERN_QUICK_REFERENCE.md for error codes
2. Reference: PART 3 in TTS_SUBSCRIPTION_PATTERN.md for error responses
3. Look up: Key file locations in either document

### If you're designing a new paid feature:
1. Start with: TTS_PATTERN_QUICK_REFERENCE.md overview
2. Deep dive: TTS_SUBSCRIPTION_PATTERN.md PART 6 (Implementation Principles)
3. Copy exact code: PART 8 (Patterns to Copy)
4. Test with: PART 7 (Implementation Checklist)

## Key File Locations

### Backend TTS Implementation
- `/supabase/functions/generate-audio-v2/index.ts` - BEST REFERENCE
- `/supabase/functions/generate-story-audio/index.ts` - ALTERNATIVE
- `/supabase/functions/_shared/credit-system.ts` - Credit logic
- `/supabase/functions/_shared/credit-costs.ts` - Pricing configuration
- `/supabase/functions/check-subscription/index.ts` - Subscription verification

### Backend Video Implementation
- `/supabase/functions/generate-video-v2/index.ts` - Needs credit system
- `/supabase/functions/generate-story-video/index.ts` - Alternative endpoint

### Frontend Implementation
- `/src/components/story-lifecycle/VoiceGenerationDrawer.tsx` - UI EXAMPLE
- `/src/lib/api/ai-client.ts` - Error handling
- `/src/lib/api/credit-api.ts` - Credit calculations

## Critical Implementation Rules

**RULE 1: Check Subscription FIRST**
- Before any credit calculation
- Before any generation
- Block free users immediately with 403

**RULE 2: Validate Credits BEFORE Generation**
- Calculate cost of operation first
- Check if user has enough
- Return 402 if not
- Never call expensive APIs until credits are validated

**RULE 3: Deduct Credits ONLY After Success**
- Generate content with external API
- Only deduct if generation succeeded
- Log the deduction with full metadata

**RULE 4: Clear Error Messages**
- Free users: Show upgrade URL
- Low credit users: Show required vs available credits
- Generation errors: Show original error + recovery steps

**RULE 5: Comprehensive Logging**
- Log every subscription check (with result)
- Log credit calculations (with word count or duration)
- Log successful deductions (with full details)
- Use requestId for request tracing

## HTTP Status Codes Used

- **200** OK - Success
- **402** Payment Required - Insufficient credits
- **403** Forbidden - Feature locked (free tier)
- **500** Internal Server Error - Server-side errors

## Error Codes in Response

- `INSUFFICIENT_CREDITS` - User out of credits
- `FEATURE_REQUIRES_SUBSCRIPTION` - Free tier user
- `VALIDATION_ERROR` - Invalid input
- `AUTHENTICATION_FAILED` - Auth failed
- `INTERNAL_ERROR` - Server error

## Credit System Parameters

**Audio Pricing:**
- 1 credit per 100 words (rounded up)
- Examples: 1-100 words = 1 credit, 101-200 = 2 credits, etc.

**Video Pricing (Proposed):**
- 5 credits for 2-3 second videos
- 8 credits for 4-5 second videos
- 12 credits for 6-8 second videos

**Monthly Credit Allowances:**
- Free tier: 10 credits/month
- Starter tier: 100 credits/month
- Premium tier: 300 credits/month

## Next Steps for Video Implementation

1. **Backend (generate-story-video/index.ts):**
   - Add credit calculation function (duration-based)
   - Add credit validation before generation
   - Add credit deduction after success

2. **Frontend:**
   - Add video credit cost display in UI
   - Handle 402 errors (insufficient credits)
   - Display error messages properly
   - Show remaining credits after generation

3. **Testing:**
   - Test free user blocks (403)
   - Test low credit blocks (402)
   - Test successful generation with credit deduction
   - Verify error messages

4. **Validation:**
   - Ensure credit calculation matches frontend
   - Verify subscription_tier query works
   - Confirm RPC spend_credits() function exists
   - Test with various credit amounts

## Document Version

Created: November 13, 2025
Last Updated: November 13, 2025
Status: Complete - Ready for implementation reference

## Document Structure

```
TTS_SUBSCRIPTION_PATTERN.md
├── Part 1: Subscription Gate Implementation
├── Part 2: Credit System (Second Layer)
├── Part 3: Error Handling & Response Patterns
├── Part 4: Frontend Error Handling
├── Part 5: Comprehensive Flow Diagram
├── Part 6: Key Implementation Principles
├── Part 7: Implementation Checklist for Video
├── Part 8: Exact Code Patterns to Copy
└── Part 9: Subscription Tiers & Credit Limits

TTS_PATTERN_QUICK_REFERENCE.md
├── Three-Layer Protection Architecture
├── Quick Implementation Guide
├── HTTP Status Codes
├── Error Codes
├── Key Files to Reference
├── Current Credit Pricing
├── What's Done for Video vs What's Missing
├── Common Mistakes to Avoid
├── Testing Checklist
└── Implementation Steps
```

---

For detailed implementation guidance, see the main reference documents.
