# Quick Start: Unified Credits System

**For:** Developers integrating the new credits & chapters model
**Time:** 15 minutes to understand, 2 hours to integrate
**Prerequisites:** Familiarity with React, Supabase, TypeScript

---

## TL;DR

**Old Way (Infinite Spinner):**
```typescript
const generateVideo = async () => {
  setIsLoading(true);
  await api.generateVideo(); // Might fail silently
  setIsLoading(false);
};
```

**New Way (Gated Upfront):**
```typescript
const generateVideo = async () => {
  const canGenerate = await checkEntitlement('video');
  if (!canGenerate.allowed) {
    showGateModal(); // Clear upgrade path
    return;
  }
  // Generate...
};
```

---

## 5-Minute Integration Guide

### Step 1: Import Hooks

```typescript
import { useQuotas } from '@/hooks/useQuotas';
import { useEntitlementCheck } from '@/hooks/useEntitlementCheck';
```

### Step 2: Use in Component

```typescript
function MyComponent() {
  const { creditBalance, chaptersRemaining, isSubscriber } = useQuotas();
  const { checkEntitlement } = useEntitlementCheck();

  // Display balance
  return <div>Credits: {creditBalance}</div>;
}
```

### Step 3: Gate Features

```typescript
const handleGenerateVideo = async () => {
  // Pre-check
  const result = await checkEntitlement('video');

  // Gate if insufficient
  if (!result.allowed) {
    setShowGateModal(true);
    return;
  }

  // Generate
  await generateVideo();
};
```

### Step 4: Show Gate Modal

```typescript
import { VideoGateModal } from '@/components/modals/VideoGateModal';

<VideoGateModal
  open={showGate}
  onClose={() => setShowGate(false)}
  currentBalance={creditBalance}
  isSubscriber={isSubscriber}
/>
```

**Done!** No more infinite spinners.

---

## Common Patterns

### Pattern 1: Video Generation

```typescript
import { VideoGateModal } from '@/components/modals/VideoGateModal';
import { useEntitlementCheck } from '@/hooks/useEntitlementCheck';
import { useQuotas } from '@/hooks/useQuotas';

function VideoButton({ chapterId }) {
  const { checkEntitlement } = useEntitlementCheck();
  const { creditBalance, isSubscriber, refreshQuotas } = useQuotas();
  const [showGate, setShowGate] = useState(false);

  const handleClick = async () => {
    const result = await checkEntitlement('video');
    if (!result.allowed) {
      setShowGate(true);
      return;
    }

    await generateVideo(chapterId);
    refreshQuotas(); // Update UI
  };

  return (
    <>
      <Button onClick={handleClick}>Generate Video (30 credits)</Button>
      <VideoGateModal
        open={showGate}
        onClose={() => setShowGate(false)}
        currentBalance={creditBalance}
        isSubscriber={isSubscriber}
      />
    </>
  );
}
```

### Pattern 2: TTS Generation

```typescript
import { FeatureGateModal } from '@/components/modals/FeatureGateModal';
import { calculateTTSCredits } from '@/shared/credit-costs';

function TTSButton({ text }) {
  const { checkEntitlement } = useEntitlementCheck();
  const { creditBalance } = useQuotas();
  const [showGate, setShowGate] = useState(false);
  const [cost, setCost] = useState(0);

  const handleClick = async () => {
    const estimatedCost = calculateTTSCredits(text);
    setCost(estimatedCost);

    const result = await checkEntitlement('tts', { text });
    if (!result.allowed) {
      setShowGate(true);
      return;
    }

    await generateTTS(text);
    refreshQuotas();
  };

  return (
    <>
      <Button onClick={handleClick}>Add Voice</Button>
      <FeatureGateModal
        open={showGate}
        onClose={() => setShowGate(false)}
        feature="tts"
        cost={cost}
        currentBalance={creditBalance}
      />
    </>
  );
}
```

### Pattern 3: Chapter Creation

```typescript
import { useCanGenerateChapter } from '@/hooks/useEntitlementCheck';
import { ChapterLimitReachedModal } from '@/components/modals/ChapterLimitReachedModal';
import { useChapterResetTime } from '@/hooks/useQuotas';

function NewChapterButton() {
  const { checkEntitlement } = useCanGenerateChapter();
  const [showLimit, setShowLimit] = useState(false);
  const hoursUntilReset = useChapterResetTime();

  const handleClick = async () => {
    const result = await checkEntitlement();
    if (!result.allowed) {
      setShowLimit(true);
      return;
    }

    const chapter = await createChapter();

    // IMPORTANT: Increment usage after success
    await supabase.rpc('increment_chapter_usage', { user_uuid: user.id });
    refreshQuotas();
  };

  return (
    <>
      <Button onClick={handleClick}>New Chapter</Button>
      <ChapterLimitReachedModal
        open={showLimit}
        onClose={() => setShowLimit(false)}
        hoursUntilReset={hoursUntilReset}
        chaptersUsed={4}
      />
    </>
  );
}
```

---

## Credit Costs Reference

```typescript
import {
  calculateTTSCredits,      // Text → credits (2cr/sec)
  calculateAnimateCredits,   // Fixed 15 credits
  calculateVideoCredits,     // Fixed 30 credits
  estimateTTSDuration        // Text → seconds
} from '@/shared/credit-costs';

// Example
const text = "Once upon a time..."; // ~50 words
const duration = estimateTTSDuration(text); // ~20 seconds
const cost = calculateTTSCredits(text);     // 40 credits
```

| Feature | Cost | Example |
|---------|------|---------|
| TTS | 2 cr/sec | 30 sec narration = 60 credits |
| Animate Scene | 15 cr | Each scene = 15 credits |
| Video (30sec) | 30 cr | Each video = 30 credits |
| Text/Image | FREE | Uses chapters, not credits |

---

## RPC Functions Reference

### get_user_quotas(user_uuid)

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

### can_generate_chapter(user_uuid)

**Returns (Allowed):**
```json
{ "allowed": true, "remaining": 2 }
```

**Returns (Gated):**
```json
{
  "allowed": false,
  "reason": "daily_limit",
  "used": 4,
  "limit": 4,
  "resets_at": "2025-11-17T00:00:00Z"
}
```

### check_credit_entitlement(user_uuid, feature_type, estimated_cost)

**feature_type:** `'tts' | 'animate' | 'video'`

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

### increment_chapter_usage(user_uuid)

**Call after successful chapter generation.**

**Returns:**
```json
{ "success": true, "used": 3, "limit": 4 }
```

---

## Testing Locally

### 1. Reset Your Credit Balance

```sql
-- Give yourself 1000 credits for testing
UPDATE user_credits
SET current_balance = 1000
WHERE user_id = auth.uid();
```

### 2. Reset Chapter Usage

```sql
-- Reset daily chapters
UPDATE profiles
SET chapters_used_today = 0,
    chapters_reset_at = NOW() + INTERVAL '1 day'
WHERE id = auth.uid();
```

### 3. Test Gating

```sql
-- Exhaust chapters
UPDATE profiles
SET chapters_used_today = 4
WHERE id = auth.uid();

-- Deplete credits
UPDATE user_credits
SET current_balance = 0
WHERE user_id = auth.uid();
```

### 4. Test Subscriber Flow

```sql
-- Make yourself a subscriber
UPDATE profiles
SET subscription_status = 'active'
WHERE id = auth.uid();

-- Grant monthly credits
SELECT grant_subscriber_monthly_credits(auth.uid());
```

---

## Common Errors & Fixes

### Error: "User not authenticated"

**Cause:** Calling RPC function without auth
**Fix:**
```typescript
const { user } = useAuth();
if (!user?.id) return;
```

### Error: "Quotas not loading"

**Cause:** useQuotas() called before user logged in
**Fix:**
```typescript
const { quotas, isLoading } = useQuotas();
if (isLoading) return <Spinner />;
```

### Error: "Credits not deducted after generation"

**Cause:** Backend edge function not calling deduct_credits
**Fix:** Ensure generation functions call `deduct_credits` RPC:
```typescript
// In edge function
await supabase.rpc('deduct_credits', {
  user_uuid: userId,
  credits_amount: cost,
  description: 'tts_generation',
  reference_id: jobId
});
```

### Error: "Chapter usage not incrementing"

**Cause:** Forgot to call `increment_chapter_usage` after generation
**Fix:**
```typescript
await createChapter();
await supabase.rpc('increment_chapter_usage', { user_uuid: user.id });
```

---

## Analytics Events

Track user behavior for optimization:

```typescript
import { trackEvent } from '@/lib/analytics/events';

// When gated
trackEvent({
  event: 'feature_generation_gated',
  properties: {
    feature: 'video',
    reason: 'insufficient_credits',
    credits_required: 30,
    credits_available: 10
  }
});

// When upgraded
trackEvent({
  event: 'subscription_purchased',
  properties: {
    plan: 'monthly',
    source: 'video_gated',
    mrr: 9.99
  }
});
```

---

## Troubleshooting Checklist

- [ ] Migration ran successfully?
  ```sql
  SELECT * FROM daily_quotas LIMIT 1;
  ```
- [ ] User has credits?
  ```sql
  SELECT * FROM user_credits WHERE user_id = auth.uid();
  ```
- [ ] RPC functions work?
  ```sql
  SELECT get_user_quotas(auth.uid());
  ```
- [ ] Modals imported correctly?
  ```typescript
  import { VideoGateModal } from '@/components/modals/VideoGateModal';
  ```
- [ ] Analytics firing?
  ```typescript
  console.log in trackEvent() to verify
  ```

---

## Need More Details?

- **Full Integration:** See IMPLEMENTATION_GUIDE.md
- **Deployment:** See ROLLOUT_PLAN.md
- **User Communication:** See EMAIL_TEMPLATES.md
- **Overview:** See UNIFIED_CREDITS_SUMMARY.md

---

## Support

**Questions?**
- Slack: #project-unified-credits
- Docs: /docs (this folder)
- Owner: [Your Name]

**Last Updated:** 2025-11-16
