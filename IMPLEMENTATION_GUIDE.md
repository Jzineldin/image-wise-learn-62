# Implementation Guide: Unified Credits & Onboarding System

**Date:** 2025-11-16
**Status:** Ready for Implementation
**Estimated Effort:** 4 engineers × 6 weeks = 24 eng-weeks

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Integration Steps](#integration-steps)
4. [API Reference](#api-reference)
5. [Component Usage](#component-usage)
6. [Testing Guide](#testing-guide)
7. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### What Changed

**Old System:**
- Unclear credit pricing (1cr/100 words TTS)
- Infinite spinners on video generation failures
- Auth-first onboarding (friction)
- No daily free allowances

**New System:**
- **Hybrid Model:** Chapters (daily quota for text/image) + Credits (for TTS/Video/Animate)
- **Clear Pricing:** TTS @ 2cr/sec, Animate @ 15cr, Video @ 30cr
- **Deferred Auth:** First chapter in <60s, auth prompt during generation
- **Daily Free:** 10 credits/day + 100 signup bonus
- **No Dead Ends:** Every gated moment shows upgrade path

### Key Benefits

- **40% increase in onboarding completion** (projected, based on deferred auth patterns)
- **Zero infinite spinners** (pre-flight entitlement checks)
- **Clear monetization** (compute-intensive features cost credits, creation is free/chapter-limited)
- **Fair to users** (100 signup credits = ~50sec TTS or 3 videos to try features)

---

## System Architecture

### Database Schema

```
┌─────────────────┐
│ profiles        │
├─────────────────┤
│ + chapters_used_today
│ + chapters_reset_at
│ + last_daily_credit_at
│ + onboarding_completed_at
│ + onboarding_state (jsonb)
└─────────────────┘

┌─────────────────┐
│ user_credits    │
├─────────────────┤
│ + monthly_credits_granted
│ + monthly_credits_used
│ + credits_reset_at
└─────────────────┘

┌─────────────────┐
│ daily_quotas    │ (NEW)
├─────────────────┤
│ user_id (PK)
│ quota_date (PK)
│ chapters_used
│ credits_earned
└─────────────────┘
```

### RPC Functions (Supabase)

| Function | Purpose | Returns |
|----------|---------|---------|
| `get_user_quotas(user_uuid)` | Fetch all quotas | `{credits, chapters, subscription}` |
| `can_generate_chapter(user_uuid)` | Pre-check chapter generation | `{allowed, reason?, resets_at?}` |
| `check_credit_entitlement(user_uuid, feature_type, estimated_cost)` | Pre-check credit features | `{allowed, cost, balance, deficit?}` |
| `increment_chapter_usage(user_uuid)` | Increment after generation | `{success, used, limit}` |
| `grant_daily_credits()` | Cron job (daily) | `[{user_id, credits_granted}]` |
| `grant_subscriber_monthly_credits(user_uuid)` | Webhook (billing) | `{success, credits_granted, next_reset}` |

---

## Integration Steps

### Step 1: Run Database Migration

```bash
# Apply the migration
npx supabase migration up

# Or via Supabase Studio:
# 1. Navigate to SQL Editor
# 2. Copy contents of supabase/migrations/20251116000000_unified_credits_model.sql
# 3. Run migration
# 4. Verify tables created:
SELECT * FROM daily_quotas LIMIT 1;
SELECT * FROM profiles WHERE id = auth.uid();
```

**Verification:**
- All existing users should have `credit_balance >= 100` (signup bonus)
- `chapters_used_today` defaults to 0
- No errors in Supabase logs

### Step 2: Update Credit Costs in Codebase

**Files Already Updated:**
- ✅ `/shared/credit-costs.ts` (frontend)
- ✅ `/supabase/functions/_shared/credit-costs.ts` (backend)

**New Functions Available:**
```typescript
import {
  calculateTTSCredits,           // Estimate from text
  calculateAnimateCredits,        // Fixed 15cr
  calculateVideoCredits,          // Fixed 30cr
  estimateTTSDuration             // Words → seconds
} from '@/shared/credit-costs';

// Example
const text = "Once upon a time..."; // 50 words
const duration = estimateTTSDuration(text); // ~20 seconds
const cost = calculateTTSCredits(text);     // 40 credits
```

### Step 3: Integrate Gating Modals

#### Video Generation (Replace Infinite Spinner)

**Before:**
```typescript
// Old code that spins forever
const generateVideo = async () => {
  setIsGenerating(true);
  await apiCall(); // Might fail silently
  setIsGenerating(false);
};
```

**After:**
```typescript
import { VideoGateModal } from '@/components/modals/VideoGateModal';
import { useEntitlementCheck } from '@/hooks/useEntitlementCheck';
import { useQuotas } from '@/hooks/useQuotas';

const { checkEntitlement } = useEntitlementCheck();
const { creditBalance, isSubscriber } = useQuotas();
const [showVideoGate, setShowVideoGate] = useState(false);

const handleGenerateVideo = async () => {
  // PRE-FLIGHT CHECK
  const entitlement = await checkEntitlement('video');

  if (!entitlement.allowed) {
    setShowVideoGate(true); // Show modal, not spinner
    return;
  }

  // Proceed with generation
  setIsGenerating(true);
  const result = await generateVideo(chapterId);
  // Handle success/failure
};

// Render
<>
  <Button onClick={handleGenerateVideo}>
    Generate Video (30 credits)
  </Button>

  <VideoGateModal
    open={showVideoGate}
    onClose={() => setShowVideoGate(false)}
    currentBalance={creditBalance}
    isSubscriber={isSubscriber}
  />
</>
```

#### TTS/Animate Generation

```typescript
import { FeatureGateModal } from '@/components/modals/FeatureGateModal';

const handleGenerateTTS = async (text: string) => {
  const cost = calculateTTSCredits(text);
  const entitlement = await checkEntitlement('tts', { text });

  if (!entitlement.allowed) {
    setShowTTSGate(true);
    setTTSCost(cost);
    return;
  }

  // Proceed with generation
  await generateTTS(text);
};

<FeatureGateModal
  open={showTTSGate}
  onClose={() => setShowTTSGate(false)}
  feature="tts"
  cost={ttsCost}
  currentBalance={creditBalance}
/>
```

### Step 4: Integrate Quota Hooks

**useQuotas Hook:**
```typescript
import { useQuotas } from '@/hooks/useQuotas';

function MyComponent() {
  const {
    quotas,              // Full quota object
    creditBalance,       // Current credit balance
    chaptersRemaining,   // Chapters left today (null if subscriber)
    isSubscriber,        // Boolean
    isLoading,
    refreshQuotas        // Force refresh
  } = useQuotas();

  // Display in UI
  return (
    <div>
      <p>Credits: {creditBalance}</p>
      {!isSubscriber && chaptersRemaining !== null && (
        <p>Chapters today: {chaptersRemaining}/4</p>
      )}
    </div>
  );
}
```

**Chapter Generation with Gating:**
```typescript
import { useCanGenerateChapter } from '@/hooks/useEntitlementCheck';
import { ChapterLimitReachedModal } from '@/components/modals/ChapterLimitReachedModal';
import { useChapterResetTime } from '@/hooks/useQuotas';

const { checkEntitlement } = useCanGenerateChapter();
const [showChapterLimit, setShowChapterLimit] = useState(false);
const hoursUntilReset = useChapterResetTime();

const handleCreateChapter = async () => {
  const entitlement = await checkEntitlement();

  if (!entitlement.allowed) {
    setShowChapterLimit(true);
    return;
  }

  // Proceed with generation
  const chapter = await createChapter();

  // Increment usage AFTER successful generation
  await supabase.rpc('increment_chapter_usage', { user_uuid: user.id });

  refreshQuotas(); // Update UI
};

<ChapterLimitReachedModal
  open={showChapterLimit}
  onClose={() => setShowChapterLimit(false)}
  hoursUntilReset={hoursUntilReset}
  chaptersUsed={4}
/>
```

### Step 5: Add Analytics Tracking

```typescript
import { trackEvent } from '@/lib/analytics/events';

// On chapter generation gated
trackEvent({
  event: 'feature_generation_gated',
  properties: {
    feature: 'chapter',
    reason: 'daily_limit',
    credits_required: 0,
    credits_available: creditBalance
  }
});

// On upgrade prompt shown
trackEvent({
  event: 'upgrade_prompt_shown',
  properties: {
    trigger: 'video_gated',
    context: 'video_gate_modal'
  }
});

// On subscription purchased
trackEvent({
  event: 'subscription_purchased',
  properties: {
    plan: 'monthly',
    source: 'video_gated',
    mrr: 9.99
  }
});
```

### Step 6: Setup Cron Jobs

**Daily Credit Drip (10 credits to free users):**

Create Supabase Edge Function:
```typescript
// supabase/functions/daily-credit-drip/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase.rpc('grant_daily_credits');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    users_credited: data.length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Configure Cron (via Supabase or external):**
```bash
# Option 1: Supabase pg_cron
SELECT cron.schedule(
  'daily-credit-drip',
  '0 0 * * *', -- Every midnight UTC
  $$SELECT grant_daily_credits();$$
);

# Option 2: External cron job (e.g., GitHub Actions)
# POST https://your-project.supabase.co/functions/v1/daily-credit-drip
# Authorization: Bearer <anon_key>
```

**Monthly Subscriber Credits (on billing webhook):**

```typescript
// In your Stripe webhook handler
if (event.type === 'invoice.payment_succeeded') {
  const subscription = event.data.object.subscription;
  const userId = metadata.user_id;

  await supabase.rpc('grant_subscriber_monthly_credits', {
    user_uuid: userId
  });
}
```

---

## API Reference

### RPC Functions

#### `get_user_quotas(user_uuid: UUID)`

**Returns:**
```json
{
  "credits": {
    "balance": 85,
    "monthly_granted": 0,
    "monthly_used": 15,
    "next_daily_drip_at": "2025-11-17T00:00:00Z"
  },
  "chapters": {
    "used_today": 2,
    "limit_per_day": 4,
    "resets_at": "2025-11-17T00:00:00Z"
  },
  "subscription": {
    "is_active": false,
    "monthly_credits": null,
    "credits_reset_at": null
  }
}
```

#### `check_credit_entitlement(user_uuid, feature_type, estimated_cost)`

**Parameters:**
- `feature_type`: `'tts' | 'animate' | 'video'`
- `estimated_cost`: Integer (credits)

**Returns (Allowed):**
```json
{
  "allowed": true,
  "cost": 30,
  "balance": 85,
  "remaining_after": 55
}
```

**Returns (Gated):**
```json
{
  "allowed": false,
  "reason": "insufficient_credits",
  "required": 30,
  "available": 10,
  "deficit": 20
}
```

---

## Component Usage

### VideoGateModal

**Props:**
```typescript
interface VideoGateModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  isSubscriber?: boolean;
}
```

**Example:**
```tsx
<VideoGateModal
  open={showGate}
  onClose={() => setShowGate(false)}
  currentBalance={creditBalance}
  isSubscriber={isSubscriber}
/>
```

### FeatureGateModal

**Props:**
```typescript
interface FeatureGateModalProps {
  open: boolean;
  onClose: () => void;
  feature: 'tts' | 'animate' | 'video';
  cost: number;
  currentBalance: number;
  isSubscriber?: boolean;
}
```

**Example:**
```tsx
<FeatureGateModal
  open={showTTSGate}
  onClose={() => setShowTTSGate(false)}
  feature="tts"
  cost={40}
  currentBalance={creditBalance}
/>
```

---

## Testing Guide

### Manual QA Checklist

- [ ] **Free User (0 credits):**
  - [ ] Video button → shows VideoGateModal
  - [ ] TTS button → shows FeatureGateModal
  - [ ] Upgrade CTA navigates to `/pricing?source=video_gated`

- [ ] **Free User (50 credits):**
  - [ ] TTS on short text (20 credits) → generates successfully
  - [ ] Video (30 credits) → generates successfully
  - [ ] TTS on long text (60 credits) → shows gate modal

- [ ] **Free User (4 chapters used):**
  - [ ] New chapter button → shows ChapterLimitReachedModal
  - [ ] Modal shows hours until reset
  - [ ] After midnight (test by changing `chapters_reset_at`) → can generate again

- [ ] **Subscriber:**
  - [ ] Chapter counter NOT shown in UI
  - [ ] Can generate unlimited chapters
  - [ ] Video with 0 credits → shows "Monthly credits used" variant

- [ ] **Daily Credit Drip:**
  - [ ] Run `SELECT grant_daily_credits();` manually
  - [ ] Free users receive +10 credits
  - [ ] `last_daily_credit_at` updated
  - [ ] Subscribers NOT affected

### Automated Tests

**Test entitlement checks:**
```typescript
describe('useEntitlementCheck', () => {
  it('gates video when credits insufficient', async () => {
    // Mock user with 10 credits
    const { result } = renderHook(() => useEntitlementCheck());
    const entitlement = await result.current.checkEntitlement('video');

    expect(entitlement.allowed).toBe(false);
    expect(entitlement.deficit).toBe(20); // Need 30, have 10
  });

  it('allows chapter for free user with quota remaining', async () => {
    // Mock user with 2/4 chapters used
    const { result } = renderHook(() => useCanGenerateChapter());
    const entitlement = await result.current.checkEntitlement();

    expect(entitlement.allowed).toBe(true);
    expect(entitlement.remaining).toBe(2);
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run migration on staging database
- [ ] Verify all existing users have >= 100 credits
- [ ] Test RPC functions in Supabase SQL Editor
- [ ] Review database indexes (should be created by migration)
- [ ] Feature flag `unified_credits_model` set to 0% (off)

### Week 1: Backend Rollout

- [ ] Deploy migration to production
- [ ] Monitor for errors in Supabase logs
- [ ] Verify credit transactions table logging correctly
- [ ] Setup daily credit drip cron job (dry run first)
- [ ] Grant daily credits manually, verify balances update

### Week 2-3: Frontend Rollout (Gradual)

- [ ] Deploy new components (VideoGateModal, FeatureGateModal)
- [ ] Enable feature flag at 10% traffic
- [ ] Monitor analytics: `feature_generation_gated` events
- [ ] Check support tickets for confusion/bugs
- [ ] Ramp to 50% if no issues

### Week 4: Full Rollout

- [ ] Enable at 100%
- [ ] Send email to all users (see EMAIL_TEMPLATES.md)
- [ ] In-app announcement banner for 7 days
- [ ] Monitor conversion rate (target: 12%)
- [ ] Monitor ARPPU (target: $9.99+)

### Week 5-6: Subscriber Credits

- [ ] Integrate Stripe webhook for monthly credit grants
- [ ] Test on sandbox Stripe account
- [ ] Send email to subscribers ("500 credits/mo now available")
- [ ] Monitor subscriber churn (should be <5%)

---

## Troubleshooting

### Issue: Users not receiving daily credits

**Diagnosis:**
```sql
SELECT id, last_daily_credit_at, subscription_status
FROM profiles
WHERE last_daily_credit_at < NOW() - INTERVAL '2 days'
  AND subscription_status != 'active';
```

**Fix:**
```sql
SELECT grant_daily_credits();
```

### Issue: Negative credit balance

**Diagnosis:**
```sql
SELECT * FROM user_credits WHERE current_balance < 0;
```

**Fix (shouldn't happen due to constraint, but if it does):**
```sql
UPDATE user_credits
SET current_balance = 0
WHERE current_balance < 0;

-- Add constraint if missing
ALTER TABLE user_credits
ADD CONSTRAINT check_positive_balance CHECK (current_balance >= 0);
```

### Issue: Chapter quota not resetting

**Diagnosis:**
```sql
SELECT id, chapters_used_today, chapters_reset_at
FROM profiles
WHERE chapters_reset_at < NOW()
  AND chapters_used_today > 0;
```

**Fix:**
```sql
UPDATE profiles
SET chapters_used_today = 0,
    chapters_reset_at = (NOW() + INTERVAL '1 day')::date::timestamptz
WHERE chapters_reset_at < NOW();
```

---

## Next Steps

1. **Review and approve** this implementation guide
2. **Run migration** on staging environment
3. **Test all gating scenarios** manually
4. **Deploy to production** with feature flag at 0%
5. **Gradually ramp** to 100% over 4 weeks
6. **Monitor metrics** (see ROLLOUT_PLAN.md)

---

## Support & Questions

- **Technical Issues:** Check Supabase logs, review this guide
- **Business Questions:** See ROLLOUT_PLAN.md for phasing and communication
- **User Communication:** See EMAIL_TEMPLATES.md for customer messaging

**Implementation Owner:** [Your Name]
**Last Updated:** 2025-11-16
