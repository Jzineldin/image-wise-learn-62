# What's Next: Unified Credits System

**Status:** ✅ Database deployed, components ready, documentation complete

---

## ✅ What You've Completed

1. **Database Migration** - Applied to remote Supabase
2. **Test Script** - Verified all RPC functions work
3. **Components** - VideoGateModal, FeatureGateModal, hooks ready
4. **Documentation** - 6 comprehensive guides created

---

## 🎯 Next Steps (Choose Your Path)

### Path A: Quick Integration (2 hours)

**Goal:** Get video gating working ASAP

1. **Integrate VideoGateModal** (30 min)
   - Open: `src/components/story-viewer/VideoGenerationPanel.tsx`
   - Follow: `INTEGRATION_EXAMPLE.md`
   - Test with 0 credits → should show gate modal

2. **Add Credit Balance Display** (30 min)
   - Add `useQuotas()` hook to your main layout/navigation
   - Display: `{creditBalance} credits` in header
   - Example:
     ```typescript
     const { creditBalance, chaptersRemaining } = useQuotas();
     return <div>Credits: {creditBalance}</div>;
     ```

3. **Test End-to-End** (1 hour)
   - Create test account
   - Set credits to 0 in Supabase Studio
   - Try video generation → see gate modal
   - Verify upgrade CTA works
   - Set credits to 100, try again → should work

### Path B: Full Integration (1-2 days)

**Goal:** Integrate all features properly

1. **Day 1 Morning: Video + TTS Gating**
   - Video: Follow `INTEGRATION_EXAMPLE.md`
   - TTS: Similar pattern, use `FeatureGateModal` with `feature="tts"`
   - Test both with 0 and sufficient credits

2. **Day 1 Afternoon: Chapter Limits**
   - Find chapter creation flow
   - Add `useCanGenerateChapter()` pre-check
   - Show `ChapterLimitReachedModal` when limit hit
   - Test: create 4 chapters → 5th should be gated

3. **Day 2 Morning: UI Polish**
   - Add credit balance to navigation
   - Add chapter counter (if free user)
   - Add tooltips explaining costs
   - Test user experience flow

4. **Day 2 Afternoon: Testing**
   - Manual QA (see checklist below)
   - Fix any bugs
   - Deploy to staging

### Path C: Production Rollout (6 weeks)

**Goal:** Gradually deploy to all users

Follow **ROLLOUT_PLAN.md** week by week:
- Week 1: Backend setup (cron jobs, webhooks)
- Week 2: Feature flag at 10%
- Week 3: Ramp to 50%
- Week 4: 100% rollout
- Week 5: User communication
- Week 6: Subscriber credits

---

## 📋 Quick QA Checklist

Before deploying, test these scenarios:

### Video Generation
- [ ] **0 credits** → Shows VideoGateModal
- [ ] **30 credits** → Generates successfully, balance → 0
- [ ] **100 credits** → Generates, balance → 70
- [ ] **Subscriber with 500 credits** → Works
- [ ] **Subscriber with 0 credits** → Shows "monthly credits used" variant

### Chapter Creation
- [ ] **Free user, 0/4 used** → Creates successfully
- [ ] **Free user, 3/4 used** → Creates successfully, now 4/4
- [ ] **Free user, 4/4 used** → Shows ChapterLimitReachedModal
- [ ] **Subscriber** → Unlimited (no counter shown)

### UI/UX
- [ ] Credit balance updates after generation
- [ ] Gate modals are dismissible
- [ ] Upgrade CTAs navigate to `/pricing`
- [ ] No infinite spinners anywhere
- [ ] Clear error messages

---

## 🔧 Files to Modify

### High Priority (Core Gating)
1. `src/components/story-viewer/VideoGenerationPanel.tsx` - Add video gating
2. `src/components/story-lifecycle/AnimationGenerationDrawer.tsx` - Add TTS gating
3. Your main navigation/header component - Add credit balance display

### Medium Priority (UX Polish)
4. Chapter creation component - Add chapter limit gating
5. Settings page - Add credit/chapter info section
6. Pricing page - Update copy to mention new model

### Low Priority (Nice to Have)
7. Onboarding flow - Add deferred auth (see IMPLEMENTATION_GUIDE.md)
8. Dashboard - Add credit/chapter stats
9. Admin panel - Add credit management tools

---

## 📚 Documentation Reference

| Document | When to Use |
|----------|-------------|
| **INTEGRATION_EXAMPLE.md** | Integrating video gating RIGHT NOW |
| **QUICK_START.md** | Learning the basics (15 min) |
| **IMPLEMENTATION_GUIDE.md** | Complete integration reference |
| **ROLLOUT_PLAN.md** | Planning production deployment |
| **DEPLOYMENT_STATUS.md** | Current status & next steps |
| **EMAIL_TEMPLATES.md** | User communication copy |

---

## 💡 Pro Tips

1. **Start Small:** Just add video gating first. See it work. Then expand.

2. **Test with Real Data:**
   - Reset your own credit balance in Supabase Studio
   - Experience the gate modals yourself
   - You'll find UX improvements

3. **Use Feature Flags:**
   - Wrap gating logic in `if (featureFlag.enabled)`
   - Deploy with flag OFF
   - Test in production
   - Enable gradually (10% → 50% → 100%)

4. **Monitor Analytics:**
   - Every gate modal has events
   - Track: `feature_generation_gated`, `upgrade_prompt_clicked`
   - Optimize based on data

5. **Communicate Early:**
   - Send migration email BEFORE enforcing limits
   - Give users 1 week to understand new model
   - Monitor support tickets for confusion

---

## 🆘 Need Help?

### Issue: "Hook not found"
**Fix:** Make sure you created the hook files:
- `src/hooks/useQuotas.ts`
- `src/hooks/useEntitlementCheck.ts`

### Issue: "Module not found: VideoGateModal"
**Fix:** Check file exists:
- `src/components/modals/VideoGateModal.tsx`
- `src/components/modals/FeatureGateModal.tsx`

### Issue: "RPC function doesn't exist"
**Fix:** Migration didn't apply. Run:
```bash
npx supabase db push
```

### Issue: "Credits not deducting"
**Fix:** Backend edge function needs to call `deduct_credits` RPC. See IMPLEMENTATION_GUIDE.md Section 3.

---

## 🎯 Recommended First Task

**Do this RIGHT NOW (30 minutes):**

1. Open `INTEGRATION_EXAMPLE.md`
2. Follow Step 1-4 for VideoGenerationPanel
3. Test with your account (set credits to 0 in Supabase Studio)
4. See the gate modal work!
5. Feel the satisfaction of eliminating infinite spinners 🎉

**Then:**
- Read QUICK_START.md (15 min)
- Decide on Path A, B, or C above
- Start integrating!

---

## 📊 Success Metrics (Track These)

After integration, monitor:
- **Gate Modal Views** - How often users hit limits
- **Upgrade Clicks** - Conversion from gate → pricing page
- **Support Tickets** - Are users confused?
- **Conversion Rate** - Free → Paid percentage

**Target:** 12% conversion (from 8% baseline)

---

**You're ready to go! Start with INTEGRATION_EXAMPLE.md** 🚀

Questions? Check the docs or ping for help!
