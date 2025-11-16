# Rollout Plan: Unified Credits & Onboarding System

**Timeline:** 6 weeks
**Start Date:** Week of 2025-11-18
**Go-Live Target:** Week of 2025-12-30

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Success Metrics](#success-metrics)
3. [Phase-by-Phase Plan](#phase-by-phase-plan)
4. [Risk Mitigation](#risk-mitigation)
5. [Customer Communication](#customer-communication)
6. [Rollback Plan](#rollback-plan)

---

## Executive Summary

### Goals

1. **Eliminate infinite spinners** → Replace with clear gating modals
2. **Increase onboarding completion** → 55% to 70% via deferred auth
3. **Improve conversion** → 8% to 12% via clear upgrade prompts
4. **Maintain user trust** → Honor existing 100-credit balances

### Phased Approach

| Week | Phase | Traffic % | Key Activities |
|------|-------|-----------|----------------|
| 1 | Foundation | 0% | DB migration, backend setup |
| 2 | Backend | 0% | RPC functions, credit drip cron |
| 3 | Frontend (Alpha) | 10% | Gating modals, quota hooks |
| 4 | Frontend (Beta) | 50% | Onboarding flow, A/B test |
| 5 | Migration | 100% | User credits migration, emails |
| 6 | Subscriber Credits | 100% | Monthly grants, monitoring |

---

## Success Metrics

### North Star Metrics

| Metric | Baseline | Week 3 Target | Week 6 Target |
|--------|----------|---------------|---------------|
| **Onboarding Completion** | 55% | 60% | 70% |
| **Free→Paid Conversion (30-day)** | 8% | 10% | 12% |
| **Feature Attach Rate (TTS)** | 15% | 25% | 35% |
| **Daily Active Creators** | 25% of MAU | 28% | 30% |

### Health Metrics (Watch for Regression)

| Metric | Threshold | Alert If... |
|--------|-----------|-------------|
| **Support Tickets (Credits)** | <10/day | >30/day |
| **Failed Generation Rate** | <5% | >10% |
| **Subscriber Churn** | <5%/month | >10%/month |
| **Onboarding Abandonment** | <45% | >55% |

### Analytics Events to Monitor

```sql
-- Onboarding funnel (PostHog)
SELECT
  step,
  COUNT(*) as users,
  COUNT(*) / LAG(COUNT(*)) OVER (ORDER BY step) as completion_rate
FROM onboarding_events
WHERE date >= '2025-11-18'
GROUP BY step
ORDER BY step;

-- Gating events
SELECT
  feature,
  reason,
  COUNT(*) as occurrences,
  AVG(credits_available) as avg_balance
FROM feature_generation_gated
WHERE date >= '2025-11-18'
GROUP BY feature, reason;

-- Conversion attribution
SELECT
  source,
  COUNT(*) as conversions,
  AVG(mrr) as average_mrr
FROM subscription_purchased
WHERE date >= '2025-11-18'
GROUP BY source
ORDER BY conversions DESC;
```

---

## Phase-by-Phase Plan

### Week 1: Foundation (Nov 18-24)

**Goal:** Database migration, backend infrastructure

**Tasks:**
- [x] Run `20251116000000_unified_credits_model.sql` migration
- [ ] Verify all users have credit_balance >= 100
- [ ] Test RPC functions in SQL Editor
- [ ] Deploy daily credit drip edge function (not scheduled yet)
- [ ] Review database indexes, add if missing

**Deployment:**
```bash
# Staging
npx supabase db reset
npx supabase migration up

# Production (Blue-Green)
# 1. Create snapshot backup
# 2. Run migration during low-traffic window (2am PST)
# 3. Monitor Supabase logs for 1 hour
```

**Success Criteria:**
- ✅ Migration completes in <5 minutes
- ✅ Zero errors in Supabase logs
- ✅ All existing users have 100+ credits
- ✅ RPC functions return expected results

**Rollback:**
If errors occur, restore from snapshot and investigate offline.

---

### Week 2: Backend (Nov 25-Dec 1)

**Goal:** Credit drip cron, entitlement APIs

**Tasks:**
- [ ] Schedule daily credit drip cron (dry run first)
- [ ] Test cron manually: `SELECT grant_daily_credits();`
- [ ] Verify free users receive +10 credits, subscribers excluded
- [ ] Deploy edge functions for quota APIs (if needed)
- [ ] Load test RPC functions (100 req/sec)

**Cron Setup:**
```sql
-- Option 1: pg_cron (recommended)
SELECT cron.schedule(
  'daily-credit-drip',
  '0 0 * * *', -- Midnight UTC
  $$SELECT grant_daily_credits();$$
);

-- Option 2: External cron (GitHub Actions)
# See .github/workflows/daily-credit-drip.yml
```

**Monitoring:**
```bash
# Check cron execution
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-credit-drip')
ORDER BY runid DESC
LIMIT 10;

# Verify credits granted
SELECT COUNT(*) as users_credited
FROM profiles
WHERE last_daily_credit_at::date = CURRENT_DATE;
```

**Success Criteria:**
- ✅ Cron runs daily at midnight UTC
- ✅ ~80% of free users receive credits (some may be inactive)
- ✅ No duplicate grants (idempotency working)
- ✅ RPC functions respond in <200ms (p95)

---

### Week 3: Frontend Alpha (Dec 2-8)

**Goal:** Deploy gating modals to 10% of users

**Tasks:**
- [ ] Deploy VideoGateModal, FeatureGateModal components
- [ ] Deploy useQuotas, useEntitlementCheck hooks
- [ ] Enable feature flag `unified_credits_model` at 10%
- [ ] Integrate analytics events (PostHog)
- [ ] Monitor for JavaScript errors (Sentry)

**Feature Flag Configuration:**
```typescript
// In your feature flag provider (LaunchDarkly/PostHog)
{
  "unified_credits_model": {
    "enabled": true,
    "rollout_percentage": 10,
    "targeting": {
      "exclude": ["power_users"], // Exclude top 10% to reduce risk
      "include": ["new_signups"]   // Prioritize new users
    }
  }
}
```

**A/B Test Setup:**
```typescript
// Variant A: New gating modals
// Variant B: Old behavior (infinite spinner)

const variant = useFeatureFlag('unified_credits_model') ? 'A' : 'B';

// Track assignment
trackEvent({
  event: 'ab_test_assigned',
  properties: { test: 'unified_credits', variant }
});
```

**Success Criteria:**
- ✅ <0.1% JavaScript error rate
- ✅ Gating modals render correctly
- ✅ Analytics events firing (check PostHog)
- ✅ No increase in support tickets

**Rollback:**
If issues, set feature flag to 0%. Investigate logs.

---

### Week 4: Frontend Beta (Dec 9-15)

**Goal:** Ramp to 50%, test onboarding flow

**Tasks:**
- [ ] Review Week 3 metrics (gating events, errors)
- [ ] Ramp feature flag to 50%
- [ ] Deploy new onboarding flow (deferred auth)
- [ ] A/B test: New onboarding vs. old
- [ ] Monitor onboarding completion rate

**Onboarding A/B Test:**
```typescript
// Variant A: Deferred auth (new)
// Variant B: Auth-first (old)

const showNewOnboarding = useFeatureFlag('deferred_auth_onboarding');

// Track funnel
trackEvent({
  event: 'onboarding_step_viewed',
  properties: { step: 'story_starter', variant: showNewOnboarding ? 'A' : 'B' }
});
```

**Expected Results:**
- Variant A completion: 65-70%
- Variant B completion: 55% (baseline)
- Statistical significance after ~1000 users per variant

**Success Criteria:**
- ✅ Variant A shows >10% lift in completion
- ✅ No increase in drop-off at first chapter
- ✅ Auth prompts show correctly during generation

**Decision Point:**
If Variant A wins, ramp to 100%. If loses or flat, investigate and iterate.

---

### Week 5: Migration & Communication (Dec 16-22)

**Goal:** Migrate all users, send emails

**Tasks:**
- [ ] Enable feature flag at 100%
- [ ] Send "Your credits just got better" email to all users
- [ ] In-app announcement banner (7 days)
- [ ] Monitor support tickets for confusion
- [ ] Prepare FAQ doc for customer support

**Email Campaign:**
See `EMAIL_TEMPLATES.md` for full copy.

**Subject:** Your credits just got better ✨

**Timing:**
- Day 1: Send to 10% (test deliverability)
- Day 2: Send to remaining 90%
- Day 3-9: In-app banner for all users

**In-App Banner:**
```tsx
<Banner variant="info" dismissible>
  <Sparkles className="w-4 h-4" />
  <span>
    New: Chapters + Credits system! Create 4 free stories/day. Get 10 daily credits for voice & video.
  </span>
  <Link to="/pricing">Learn More</Link>
</Banner>
```

**Support Ticket Categories to Monitor:**
- "I lost my credits" → Verify balance, reassure
- "Chapter limit confusing" → Explain chapters vs. credits
- "Can't generate video" → Check balance, show upgrade

**Success Criteria:**
- ✅ <5% email bounce rate
- ✅ <30 support tickets/day (credits-related)
- ✅ No drop in DAU

---

### Week 6: Subscriber Credits (Dec 23-29)

**Goal:** Grant monthly credits to subscribers

**Tasks:**
- [ ] Integrate Stripe webhook for monthly credit grants
- [ ] Test on Stripe sandbox
- [ ] Run backfill for existing subscribers
- [ ] Send "500 credits/mo now available" email to subscribers
- [ ] Monitor subscriber churn

**Stripe Webhook Integration:**
```typescript
// In webhook handler (e.g., Supabase Edge Function)
if (event.type === 'invoice.payment_succeeded') {
  const subscription = event.data.object;
  const userId = subscription.metadata.user_id;

  // Grant 500 credits
  await supabase.rpc('grant_subscriber_monthly_credits', {
    user_uuid: userId
  });

  // Log event
  await logEvent('subscriber_credits_granted', { userId, amount: 500 });
}
```

**Backfill Existing Subscribers:**
```sql
-- One-time backfill
SELECT grant_subscriber_monthly_credits(id)
FROM profiles
WHERE subscription_status = 'active';
```

**Subscriber Email:**
**Subject:** Subscriber bonus: 500 credits every month 🎉

**Success Criteria:**
- ✅ All active subscribers receive 500 credits
- ✅ `credits_reset_at` set correctly (30 days from now)
- ✅ Subscriber churn <5% (same as baseline)

---

## Risk Mitigation

### Risk 1: Users lose credits due to bug

**Likelihood:** Low
**Impact:** Critical

**Mitigation:**
- Database constraint prevents negative balances
- Credit transactions table logs all movements (immutable)
- Refund mechanism in place for generation failures

**Contingency:**
```sql
-- If users report lost credits, audit trail:
SELECT * FROM credit_transactions
WHERE user_id = '<user_uuid>'
ORDER BY created_at DESC;

-- Restore balance if needed
UPDATE user_credits
SET current_balance = <correct_amount>
WHERE user_id = '<user_uuid>';
```

### Risk 2: Infinite loop in daily credit drip

**Likelihood:** Medium
**Impact:** High (spam users with credits)

**Mitigation:**
- `last_daily_credit_at` prevents duplicate grants
- Cron job runs in transaction (atomic)
- Monitor cron logs daily

**Contingency:**
Pause cron, investigate logs, fix bug, resume.

### Risk 3: Conversion drops instead of increasing

**Likelihood:** Medium
**Impact:** High (revenue loss)

**Mitigation:**
- A/B test before full rollout
- Monitor conversion daily
- Keep feature flag for quick rollback

**Contingency:**
If conversion drops >20%, rollback to 50% traffic. Investigate:
- Are upgrade prompts too aggressive?
- Is pricing unclear?
- Are users hitting gates too early?

### Risk 4: Subscriber churn spike

**Likelihood:** Low
**Impact:** Critical

**Mitigation:**
- Frame monthly credits as "bonus" not "requirement"
- Email emphasizes unlimited chapters (core value)
- Monitor churn weekly

**Contingency:**
If churn >10%, send recovery email:
"We heard you. Here's what you get as a subscriber..." (emphasize value)

---

## Customer Communication

### Email Sequence

**Email 1: All Users (Week 5)**
- Subject: Your credits just got better ✨
- Content: See `EMAIL_TEMPLATES.md`
- CTA: Open the app and try it

**Email 2: Subscribers (Week 6)**
- Subject: Subscriber bonus: 500 credits every month
- Content: See `EMAIL_TEMPLATES.md`
- CTA: Create a story with voice & video

**Email 3: Users Who Hit Limits (Triggered)**
- Subject: You're creating a lot! Here's how to keep going
- Trigger: 4/4 chapters used
- CTA: View pricing plans

### In-App Announcements

**Week 5-6: Modal on First Login**
```tsx
<Dialog open={!hasSeenAnnouncement}>
  <DialogContent>
    <DialogTitle>Credits & Chapters—Now Clearer</DialogTitle>
    <div>
      <h4>📝 Chapters (4/day free)</h4>
      <p>Create text + image stories</p>

      <h4>💎 Credits (10/day free)</h4>
      <p>Add voice, animations, video</p>

      <p>Your 100 signup credits? Still yours!</p>
    </div>
    <Button onClick={() => setHasSeenAnnouncement(true)}>
      Got It, Let's Create!
    </Button>
  </DialogContent>
</Dialog>
```

---

## Rollback Plan

### Scenario 1: Critical Bug in Migration

**Symptoms:**
- Users can't generate chapters
- Credit balances showing negative
- Database errors in Supabase logs

**Rollback Steps:**
1. **Immediate:** Restore database from snapshot (taken before migration)
2. **Communication:** Email users: "We're experiencing technical issues. Your data is safe."
3. **Investigation:** Review migration script, fix bug offline
4. **Re-deploy:** After fix verified in staging

**Downtime:** ~15 minutes
**Data Loss:** None (snapshot restore)

### Scenario 2: Frontend Errors Spike

**Symptoms:**
- JavaScript error rate >1%
- Users reporting "modals won't close"
- Sentry alerts

**Rollback Steps:**
1. **Immediate:** Set feature flag `unified_credits_model` to 0%
2. **Investigation:** Review Sentry logs, identify component causing error
3. **Hotfix:** Deploy fix, re-enable at 10%

**Downtime:** None (flag flip)
**User Impact:** Reverts to old behavior (infinite spinners, but functional)

### Scenario 3: Conversion Drops >20%

**Symptoms:**
- Daily conversions down from 8% to <6%
- Support tickets: "Too expensive" or "Confusing"

**Rollback Steps:**
1. **Pause:** Reduce feature flag to 50% (keep new users in experiment)
2. **Analysis:** Review analytics for drop-off points
3. **Iteration:** Adjust copy, pricing tiers, or gating thresholds
4. **A/B Test:** Test variant with changes vs. original

**Timeline:** 1 week to analyze + iterate

---

## Post-Launch Monitoring

### Daily Check (Week 5-8)

- [ ] Conversion rate vs. baseline
- [ ] Onboarding completion rate
- [ ] Support tickets (credits-related)
- [ ] Cron job execution (daily credits granted)

### Weekly Review (Week 5-12)

- [ ] ARPPU trend (should increase with credit top-ups in future)
- [ ] Feature attach rates (TTS, Video, Animate)
- [ ] Subscriber churn
- [ ] NPS score (track user sentiment)

### Monthly OKR Tracking

| Metric | Q4 Target | Actual | Status |
|--------|-----------|--------|--------|
| Free→Paid Conversion | 12% | TBD | 🟡 In Progress |
| Onboarding Completion | 70% | TBD | 🟡 In Progress |
| ARPPU | $11.50 | TBD | 🟡 In Progress |
| Subscriber Churn | <5% | TBD | 🟡 In Progress |

---

## Go/No-Go Decision Points

### Week 3 Go/No-Go

**Criteria to Proceed to 50%:**
- [ ] <0.1% JavaScript error rate
- [ ] Gating modals working correctly
- [ ] No spike in support tickets
- [ ] Analytics events firing

**If No-Go:** Stay at 10%, investigate issues

### Week 4 Go/No-Go

**Criteria to Proceed to 100%:**
- [ ] Onboarding completion >60%
- [ ] Conversion stable or improving
- [ ] No critical bugs
- [ ] Team confident in rollout

**If No-Go:** Stay at 50%, iterate on onboarding

### Week 6 Go/No-Go (Subscriber Credits)

**Criteria to Proceed:**
- [ ] Stripe webhook tested on sandbox
- [ ] Backfill script tested on staging
- [ ] Email copy approved
- [ ] Subscriber churn <5%

**If No-Go:** Delay subscriber credits by 1 week

---

## Success Criteria (Final)

By **Week 12** (end of Q1 2026), we expect:

| Metric | Baseline | Target | Actual |
|--------|----------|--------|--------|
| Onboarding Completion | 55% | 70% | TBD |
| Free→Paid Conversion | 8% | 12% | TBD |
| TTS Attach Rate | 15% | 35% | TBD |
| Video Attach Rate | 5% | 20% | TBD |
| ARPPU | $9.99 | $11.50 | TBD |
| Support Tickets/Day | 5 | <10 | TBD |

**If targets met:** Declare success, document learnings, plan Phase 2 (credit top-ups)
**If targets missed:** Analyze data, iterate, extend timeline

---

## Next Steps

1. **Week 1 Kickoff:** Run migration on staging
2. **Week 2:** Setup cron jobs
3. **Week 3:** Deploy to 10% traffic
4. **Weekly Reviews:** Every Friday, review metrics and decide on next phase

**Project Owner:** [Your Name]
**Last Updated:** 2025-11-16

---

**Questions or Issues?**
- Slack: #project-unified-credits
- Email: [your-email]
- Docs: See IMPLEMENTATION_GUIDE.md, EMAIL_TEMPLATES.md
