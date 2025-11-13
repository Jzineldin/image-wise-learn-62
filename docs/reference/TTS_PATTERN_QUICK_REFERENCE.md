# TTS Subscription Pattern - Quick Reference

## Three-Layer Protection Architecture

```
Free Users                    Paid Users
     |                             |
     v                             v
[LAYER 1: Subscription Gate]
- Check: subscription_tier != 'free'
- Response: 403 Forbidden + 'feature_locked'
- Blocks: 100% of free users
     |
     +-> Free User STOPPED HERE
     |
     v (Paid users continue)
[LAYER 2: Credit Validation] 
- Check: currentCredits >= required
- Response: 402 Payment Required
- Blocks: Users out of credits
     |
     +-> Low-credit Paid User STOPPED HERE
     |
     v (Sufficient credit users continue)
[LAYER 3: Generation + Deduction]
- Generate content with expensive API
- Deduct credits AFTER success
- Only this layer costs money!
```

## Quick Implementation Guide

### Step 1: Subscription Gate (FIRST - ALWAYS)
```typescript
const { data: userProfile } = await supabase
  .from('profiles')
  .select('subscription_tier')
  .eq('id', userId)
  .single();

if (userProfile.subscription_tier === 'free') {
  return ResponseHandler.error('FEATURE_REQUIRES_SUBSCRIPTION', 403, {
    error: 'feature_locked',
    message: 'Only available for paid subscribers',
    feature: 'feature_name',
    upgradeUrl: '/pricing'
  });
}
```

### Step 2: Calculate Credits
```typescript
const creditsRequired = calculateCredits(content);
// Example: 1 credit per 100 words (rounded up)
// Example: 5/8/12 credits per short/medium/long video
```

### Step 3: Validate Credits (BEFORE generation)
```typescript
const { hasCredits, currentCredits } = await creditService.checkUserCredits(userId, creditsRequired);
if (!hasCredits) {
  return ResponseHandler.error('INSUFFICIENT_CREDITS', 402, {
    required: creditsRequired,
    available: currentCredits,
    message: `Need ${creditsRequired}, you have ${currentCredits}`
  });
}
```

### Step 4: Generate (Make expensive API call)
```typescript
const result = await expensiveAPI(content);
```

### Step 5: Deduct Credits (AFTER success only)
```typescript
const creditResult = await creditService.deductCredits(
  userId,
  creditsRequired,
  'Feature name',
  requestId,
  'feature_type',
  { calculationDetails: 'how credits calculated' }
);

return ResponseHandler.success({
  result,
  credits_used: creditsRequired,
  credits_remaining: creditResult.newBalance
});
```

## HTTP Status Codes

- **200** - Success
- **400** - Bad request (validation error)
- **402** - Payment required (insufficient credits)
- **403** - Forbidden (feature locked to paid users only)
- **500** - Server error

## Error Codes in Response Body

- `INSUFFICIENT_CREDITS` - User out of credits (402)
- `FEATURE_REQUIRES_SUBSCRIPTION` - Free user trying paid feature (403)
- `VALIDATION_ERROR` - Invalid input
- `AUTHENTICATION_FAILED` - No/invalid token
- `INTERNAL_ERROR` - Server error

## Key Files to Reference

**Backend:**
- TTS Audio: `/supabase/functions/generate-audio-v2/index.ts`
- TTS Audio (v1): `/supabase/functions/generate-story-audio/index.ts`
- Video: `/supabase/functions/generate-video-v2/index.ts` (ALREADY IMPLEMENTED!)
- Credit System: `/supabase/functions/_shared/credit-system.ts`
- Credit Costs: `/supabase/functions/_shared/credit-costs.ts`

**Frontend:**
- Voice UI: `/src/components/story-lifecycle/VoiceGenerationDrawer.tsx`
- API Client: `/src/lib/api/ai-client.ts`

## Current Credit Pricing

**Audio (per 100 words):**
- 1-100 words = 1 credit
- 101-200 words = 2 credits
- etc.

**Video (per duration):**
- 2-3 seconds = 5 credits
- 4-5 seconds = 8 credits
- 6-8 seconds = 12 credits

**Monthly Allowances:**
- Free: 10 credits
- Starter: 100 credits
- Premium: 300 credits

## What's Already Done for Video

Video generation (`generate-video-v2/index.ts`) ALREADY has:
- ✅ Subscription gate (lines 87-116)
- ✅ 403 error with 'feature_locked'
- ✅ Correct error structure

What's MISSING for Video:
- ❌ Credit validation before generation
- ❌ Credit deduction after generation
- ❌ Credit cost display in UI

## Common Mistakes to Avoid

1. ❌ Checking credits before subscription (wrong order!)
2. ❌ Generating before validating credits (wastes API calls)
3. ❌ Deducting credits before confirming generation succeeded
4. ❌ Using 401 instead of 403 for feature gating
5. ❌ Returning error details in wrong format
6. ❌ Not logging credit calculations for auditing

## Testing Checklist

- [ ] Free user → 403 + 'feature_locked'
- [ ] Paid user with 0 credits → 402 + 'INSUFFICIENT_CREDITS'
- [ ] Paid user with enough credits → Success
- [ ] Credit balance decreases after generation
- [ ] Error messages display in frontend
- [ ] Costs shown before generation attempt
- [ ] All operations logged with requestId

## For Video Generation Implementation

1. Add credit calculation function (duration-based)
2. Add credit validation in `generate-story-video/index.ts`
3. Add credit deduction after successful generation
4. Add frontend UI to show video credit costs
5. Test all three layers (subscription → credits → generation)

See `TTS_SUBSCRIPTION_PATTERN.md` for complete implementation guide.
