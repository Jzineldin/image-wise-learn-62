# Unified Credits Execution Plan (Derived from Latest Documentation)

_Instruction recap:_ Review the most recent documentation drop and turn it into a concrete action plan. This plan stitches together the guidance from the new docs so engineering, product, and GTM teams can move in lockstep.

---

## 1. Source Material Reviewed

| Document | Purpose in this Plan | Key Sections Referenced |
|----------|---------------------|--------------------------|
| `UNIFIED_CREDITS_SUMMARY.md` | Baseline summary, deliverables, metrics | "What Was Delivered", "Key Metrics & Targets" |
| `IMPLEMENTATION_GUIDE.md` | Detailed integration steps, API/RPC specs, cron/webhook setup | Sections 3-6 |
| `QUICK_START.md` | Developer on-ramp for hooks + modals | "5-Minute Integration Guide" |
| `INTEGRATION_EXAMPLE.md` | Concrete reference for `VideoGenerationPanel` gating | Steps 1-4 |
| `WHATS_NEXT.md` | Tactical task list + QA checklist + prioritization paths | "Path A/B/C", "Quick QA Checklist", "Files to Modify" |
| `DEPLOYMENT_STATUS.md` | Current readiness, gaps before staging/prod | "Pre-Production Checklist", "Next Steps" |
| `ROLLOUT_PLAN.md` | Week-by-week production rollout | "Phase-by-Phase Plan" |
| `EMAIL_TEMPLATES.md` | External comms copy for rollout | All templates |
| `test-unified-credits.sql` | DB verification script | Full script |

---

## 2. Objectives & Guardrails

1. **Eliminate dead-end UX** – All compute-heavy actions must pre-check entitlements and show the appropriate gate modal (`VideoGateModal`, `FeatureGateModal`, `ChapterLimitReachedModal`).
2. **Protect conversion & trust** – Honor existing balances, communicate changes proactively, and monitor support load (targets from `UNIFIED_CREDITS_SUMMARY.md`).
3. **Ship safely** – Follow the 6-week phased rollout (`ROLLOUT_PLAN.md`) with feature flags plus clear rollback paths (`DEPLOYMENT_STATUS.md`).
4. **Operational readiness** – Cron jobs (`grant_daily_credits`), Stripe webhooks, analytics events, and SQL testing must be in place before ramping traffic.

---

## 3. Phased Delivery Plan

### Phase 0 – Orientation & Environment Prep (Day 0-1)
- Read `QUICK_START.md` + `UNIFIED_CREDITS_SUMMARY.md` for context; confirm local Supabase + env vars ready.
- Run `test-unified-credits.sql` against local/staging per `DEPLOYMENT_STATUS.md` to ensure migrations applied.
- Align team on default implementation path (Path B from `WHATS_NEXT.md` unless time constrained).

### Phase 1 – Feature Integration Sprint (Week 1)
1. **Video gating (highest impact)**
   - Follow `INTEGRATION_EXAMPLE.md` in `src/components/story-viewer/VideoGenerationPanel.tsx`.
   - Instrument analytics (`trackEvent`) per `IMPLEMENTATION_GUIDE.md` §5.
2. **TTS/Animate gating**
   - Mirror video flow using `FeatureGateModal` and `calculateTTSCredits`/`calculateAnimateCredits`.
   - Ensure backend edge functions call `deduct_credits` RPC (Implementation Guide §3-4).
3. **Chapter limits UI**
   - Use `useCanGenerateChapter` + `ChapterLimitReachedModal` before chapter creation flows.
4. **Global quota surfacing**
   - Inject `useQuotas` into nav/header + dashboard to display credit + chapter counts (per `WHATS_NEXT.md` HP#2 and Implementation Guide §4).
5. **Refactor gating states**
   - Remove obsolete infinite spinner logic; ensure `refreshQuotas()` triggers after successful jobs.

### Phase 2 – QA & Hardening (Week 1-2 overlap)
- Execute `WHATS_NEXT.md` QA checklist (video scenarios, chapter usage, UI balances).
- Run Supabase RPC tests (success + failure) via `test-unified-credits.sql`.
- Add regression tests (unit + integration) around new hooks/modals if time permits.
- Validate analytics events land in PostHog/Sentry sample env.

### Phase 3 – Staging Deployment & Feature Flag Ramp (Week 2-3)
- Use `DEPLOYMENT_STATUS.md` "Pre-Production Checklist" to close open TODOs (staging DB test, backups, feature flag scaffolding).
- Deploy frontend to staging; enable `unified_credits_model` flag at 0%, then 10% of staging users for smoke testing (per `ROLLOUT_PLAN.md`, Week 3 guidance).
- Schedule/verify daily credit drip cron + dry-run subscriber webhook (Implementation Guide §6).
- Document test evidence in staging release notes (link to QA checklist results).

### Phase 4 – Production Rollout & Communication (Week 4-5)
- Follow `ROLLOUT_PLAN.md` Weeks 3-5 for traffic ramp (10% → 50% → 100%). Keep flag pointer ready for rollback.
- Ship onboarding tweaks/deferred auth variant in tandem if capacity allows (ROLLOUT PLAN Week 4 & Implementation Guide exec summary).
- Execute comms plan:
  - Send teaser + main campaign using copy blocks in `EMAIL_TEMPLATES.md`.
  - Launch in-app banner snippet (ROLLOUT PLAN Week 5) pointing to `/pricing`.
  - Prep support macros referencing `UNIFIED_CREDITS_SUMMARY.md` FAQ lines.
- Track success metrics daily (onboarding completion, conversion, attach rates) vs. targets.

### Phase 5 – Subscriber Credits & Continuous Monitoring (Week 6+)
- Enable Stripe webhook path (`grant_subscriber_monthly_credits`) and run backfill query from `ROLLOUT_PLAN.md` Week 6.
- Monitor cron + webhook logs; set alerts for failures.
- Review metric trends weekly; adjust pricing or UX if conversion deviates (>20% drop triggers rollback per `ROLLOUT_PLAN.md`).
- Kick off Phase 2 initiatives (credit add-ons, additional analytics) called out in `UNIFIED_CREDITS_SUMMARY.md` "Iterate" section.

---

## 4. Cross-Cutting Workstreams

| Workstream | Actions | Reference |
|------------|---------|-----------|
| **Observability & Analytics** | Ensure `feature_generation_gated`, `upgrade_prompt_shown`, `subscription_purchased` events emit with required properties; wire into dashboards before ramp (Implementation Guide §5). | `IMPLEMENTATION_GUIDE.md`, `ROLLOUT_PLAN.md` (Success Metrics) |
| **Data & Ops** | Daily cron scheduling, Stripe webhook deploy, credit transaction auditing scripts ready pre-GoLive. | `IMPLEMENTATION_GUIDE.md` §6, `DEPLOYMENT_STATUS.md` Backend TODOs |
| **Support & Comms** | Train CX via `EMAIL_TEMPLATES.md`, prepare FAQ + macro responses, add in-app announcement. | `EMAIL_TEMPLATES.md`, `ROLLOUT_PLAN.md` Week 5 |
| **Risk Management** | Follow rollback paths (feature flag to 0%, DB restore) and monitor thresholds (<0.1% JS errors, <30 tickets/day). | `ROLLOUT_PLAN.md` Risk section, `DEPLOYMENT_STATUS.md` Rollback Plan |

---

## 5. Milestones & Deliverables

| Week | Milestone | Deliverables | Owners |
|------|-----------|--------------|--------|
| 0 | Kickoff | Alignment doc + environment readiness notes | Eng Lead + PM |
| 1 | Integration Complete | PRs for video/TTS/animate gating, quota UI, analytics hooks | Frontend Squad |
| 2 | QA Sign-off | QA checklist report, Supabase test log, staging build | QA + Platform |
| 3 | Staging Ramp | Feature flag config, cron/webhook verified, 10% user cohort live | Platform + Backend |
| 4 | Production 50% | Monitoring dashboards, onboarding experiment running | Growth Eng |
| 5 | Full Rollout & Comms | Email campaign send, in-app banner live, support briefed | Marketing + CX |
| 6 | Subscriber Credits | Stripe webhook live, backfill script results, monitoring alerts | Billing + Data |

---

## 6. Action Checklist (Traceable to Docs)

1. **Read & align** – `QUICK_START.md`, `UNIFIED_CREDITS_SUMMARY.md`.
2. **Integrate gating** – `INTEGRATION_EXAMPLE.md`, `IMPLEMENTATION_GUIDE.md` (§3-4).
3. **Surface quotas globally** – Refer to `WHATS_NEXT.md` HP items.
4. **Run DB/RPC tests** – `test-unified-credits.sql`, checklist in `DEPLOYMENT_STATUS.md`.
5. **Execute QA matrix** – `WHATS_NEXT.md` QA checklist.
6. **Turn on analytics** – Implementation Guide §5 + success metrics tables in `ROLLOUT_PLAN.md`.
7. **Prep cron & webhooks** – Implementation Guide §6.
8. **Plan rollout** – `ROLLOUT_PLAN.md`, `DEPLOYMENT_STATUS.md` timeline.
9. **Send comms** – `EMAIL_TEMPLATES.md` (Week 5), update support macros.
10. **Monitor & iterate** – Targets from `UNIFIED_CREDITS_SUMMARY.md` & `ROLLOUT_PLAN.md`.

---

## 7. Dependencies & Risks

- **Supabase migrations** must stay in sync across local/staging/prod – always re-run `test-unified-credits.sql` after deployment.
- **Feature flag provider** needs staged rollout support; ensure ability to instantly drop to 0%.
- **Cron/Webhook secrets** must be in env stores before Week 3.
- **Analytics coverage** – without event validation, we cannot judge success; add checks to CI or staging smoke tests.

---

## 8. Reference Index

- `UNIFIED_CREDITS_SUMMARY.md`
- `IMPLEMENTATION_GUIDE.md`
- `QUICK_START.md`
- `INTEGRATION_EXAMPLE.md`
- `WHATS_NEXT.md`
- `DEPLOYMENT_STATUS.md`
- `ROLLOUT_PLAN.md`
- `EMAIL_TEMPLATES.md`
- `test-unified-credits.sql`

This plan should stay synced with the above docs—update this file whenever any source doc changes materially.
