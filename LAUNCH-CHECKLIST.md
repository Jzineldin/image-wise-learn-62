# ✅ TALE FORGE LAUNCH CHECKLIST

**Use this checklist to track your progress to launch.**

---

## 🔴 CRITICAL - DO NOT LAUNCH WITHOUT

### **Stripe Webhook (HIGHEST PRIORITY)**
- [ ] Read `STRIPE-WEBHOOK-SETUP-GUIDE.md`
- [ ] Deploy webhook: `supabase functions deploy stripe-webhook`
- [ ] Get webhook URL: `https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook`
- [ ] Configure webhook in Stripe Dashboard
- [ ] Add events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- [ ] Get signing secret from Stripe
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Supabase
- [ ] Test with Stripe CLI: `stripe trigger checkout.session.completed`
- [ ] Check logs: `supabase functions logs stripe-webhook`
- [ ] Test with real payment (test mode)
- [ ] Verify credits added to database
- [ ] Test all price tiers:
  - [ ] Small Pack ($5 = 50 credits)
  - [ ] Medium Pack ($9 = 100 credits)
  - [ ] Large Pack ($20 = 250 credits)
  - [ ] Starter subscription ($9.99 = 100 credits/month)
  - [ ] Premium subscription ($19.99 = 300 credits/month)

### **Beta Migration Verification**
- [ ] Run `verify-beta-migration.sql` in Supabase SQL Editor
- [ ] Verify beta columns exist in profiles table
- [ ] Verify user_feedback table exists
- [ ] Verify handle_new_user() function contains "beta_credits := 100"
- [ ] Test new signup in incognito mode
- [ ] Verify new user gets 100 credits
- [ ] Verify new user has `is_beta_user = true`
- [ ] Verify new user has `founder_status = 'founder'`
- [ ] Verify founder badge displays in navigation
- [ ] Check transaction log for "Beta Founder Bonus - 100 free credits! 🎉"

---

## 🟡 HIGH PRIORITY - FIX BEFORE LAUNCH

### **Google OAuth**
- [ ] Go to Supabase Dashboard → Authentication → Providers → Google
- [ ] Verify Client ID is set
- [ ] Verify Client Secret is set
- [ ] Verify redirect URLs are whitelisted:
  - [ ] `https://zfczvngxnpdchicotipf.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:5173/auth/callback` (for dev)
- [ ] Test Google sign-in flow
- [ ] Verify user created in database
- [ ] Verify user receives 100 credits
- [ ] Verify user has founder status
- [ ] Verify founder badge displays

### **Logo Blur Fix**
- [ ] Check logo file sizes in `src/assets/`
- [ ] If > 100 KB, optimize:
  - [ ] Option A: Run `node scripts/optimize-images.js`
  - [ ] Option B: Use Squoosh.app to manually optimize
- [ ] Target size: 50-80 KB
- [ ] Test logo on desktop (Chrome, Safari, Firefox)
- [ ] Test logo on mobile (iOS Safari, Android Chrome)
- [ ] Verify crisp display at all sizes

---

## 🟢 FINAL CHECKS - BEFORE GOING LIVE

### **Content & Legal**
- [x] ✅ Footer updated to 2025
- [x] ✅ Blog link removed from footer
- [x] ✅ Testimonials link added to footer
- [x] ✅ Privacy Policy updated to "January 2025"
- [x] ✅ Terms of Service updated to "January 2025"
- [ ] Privacy Policy reviewed by lawyer (optional but recommended)
- [ ] Terms of Service reviewed by lawyer (optional but recommended)

### **Landing Page**
- [ ] Beta announcement banner displays correctly
- [ ] "Claim Founder Status" CTA is prominent
- [ ] Social proof displays (47 founders joined, 5.0 rating)
- [ ] Value proposition is clear within 3 seconds
- [ ] Get fresh eyes review from someone unfamiliar with the product
- [ ] Test on mobile devices
- [ ] Test on different screen sizes

### **Testimonials Page**
- [ ] Navigate to `/testimonials`
- [ ] Check for visual overlay issues
- [ ] Verify all testimonials display correctly
- [ ] Test category filters
- [ ] Test on mobile devices

### **Cross-Browser Testing**
- [ ] Chrome (desktop) - All features work
- [ ] Safari (desktop) - All features work
- [ ] Firefox (desktop) - All features work
- [ ] Edge (desktop) - All features work
- [ ] iOS Safari (mobile) - All features work
- [ ] Android Chrome (mobile) - All features work

### **Mobile Responsiveness**
- [ ] Landing page looks good on mobile
- [ ] Navigation menu works on mobile
- [ ] Story creation flow works on mobile
- [ ] Dashboard works on mobile
- [ ] Pricing page works on mobile
- [ ] Payment flow works on mobile

### **Authentication Flow**
- [ ] Email signup works
- [ ] Email login works
- [ ] Google signup works
- [ ] Google login works
- [ ] Password reset works
- [ ] Email verification works (if enabled)

### **Story Creation Flow**
- [ ] Create story wizard works
- [ ] All steps complete successfully
- [ ] Story generates correctly
- [ ] Images generate correctly
- [ ] Audio generates correctly
- [ ] Credits deducted correctly
- [ ] Story saves to library

### **Payment Flow**
- [ ] Pricing page displays correctly
- [ ] "Buy Credits" button works
- [ ] Stripe checkout opens
- [ ] Payment completes successfully
- [ ] Redirect to success page works
- [ ] Credits added to account
- [ ] Transaction logged correctly
- [ ] Subscription management works (if applicable)

### **Admin Panel**
- [ ] Admin can access `/admin`
- [ ] User management works
- [ ] Feedback management works
- [ ] Analytics display correctly
- [ ] Credit adjustment works

### **Performance**
- [ ] Page load time < 3 seconds
- [ ] Images load quickly
- [ ] No console errors
- [ ] No broken links
- [ ] All API calls succeed

---

## 🚀 PRODUCTION DEPLOYMENT

### **Environment Variables**
- [ ] `STRIPE_SECRET_KEY` set to PRODUCTION key (starts with `sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` set to PRODUCTION secret (from live mode webhook)
- [ ] `SUPABASE_URL` correct
- [ ] `SUPABASE_ANON_KEY` correct
- [ ] `SUPABASE_SERVICE_ROLE_KEY` correct (keep secret!)
- [ ] All other API keys set (OpenAI, ElevenLabs, etc.)

### **Stripe Configuration**
- [ ] Switch Stripe Dashboard to "Live mode"
- [ ] Create NEW webhook endpoint in live mode (same URL)
- [ ] Configure same events as test mode
- [ ] Get NEW signing secret (different from test mode!)
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live secret
- [ ] Verify webhook is active

### **Database**
- [ ] Beta migration applied to production database
- [ ] All tables exist
- [ ] All RLS policies enabled
- [ ] All triggers enabled
- [ ] Backup created

### **Deployment**
- [ ] Code deployed to production
- [ ] Edge functions deployed
- [ ] Environment variables set
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Custom domain working (if applicable)

---

## 🧪 POST-LAUNCH TESTING

### **Smoke Tests (Do Immediately After Launch)**
- [ ] Visit homepage - loads correctly
- [ ] Sign up with real email - works
- [ ] Receive 100 credits - verified
- [ ] Founder badge displays - verified
- [ ] Create a story - works
- [ ] Credits deducted - verified
- [ ] Buy credits with real card - works
- [ ] Credits added - verified
- [ ] Check Stripe Dashboard - payment received
- [ ] Check webhook logs - no errors

### **Monitoring (First 24 Hours)**
- [ ] Monitor Supabase logs for errors
- [ ] Monitor Stripe webhook deliveries
- [ ] Monitor user signups
- [ ] Monitor payment success rate
- [ ] Monitor story creation success rate
- [ ] Check for user feedback/complaints
- [ ] Respond to any issues immediately

---

## 📊 SUCCESS METRICS

Track these after launch:

**Day 1:**
- [ ] Number of signups: _____
- [ ] Number of payments: _____
- [ ] Payment success rate: _____%
- [ ] Number of stories created: _____
- [ ] Number of errors: _____

**Week 1:**
- [ ] Total signups: _____
- [ ] Total revenue: $_____
- [ ] Average credits per user: _____
- [ ] User retention rate: _____%
- [ ] Customer support tickets: _____

---

## 🆘 EMERGENCY CONTACTS

**If something breaks:**

1. **Check Logs:**
   - Supabase: `supabase functions logs`
   - Stripe: Dashboard → Webhooks → Recent deliveries

2. **Rollback Plan:**
   - Disable webhook in Stripe Dashboard (if causing issues)
   - Revert to previous deployment (if needed)
   - Manually add credits to affected users

3. **Support:**
   - Have customer support email ready
   - Prepare apology message template
   - Have refund process ready

---

## ✅ FINAL SIGN-OFF

**Before you launch, confirm:**

- [ ] I have tested the complete payment flow
- [ ] I have verified credits are added correctly
- [ ] I have tested on multiple browsers
- [ ] I have tested on mobile devices
- [ ] I have a backup plan if something breaks
- [ ] I am ready to monitor the launch closely
- [ ] I am ready to respond to user issues quickly

**Signed:** _________________ **Date:** _________________

---

## 🎉 LAUNCH!

**When all checkboxes are complete, you're ready to launch!**

**Good luck! 🚀**

---

**Checklist Version:** 1.0  
**Last Updated:** January 5, 2025  
**Status:** Ready to use

