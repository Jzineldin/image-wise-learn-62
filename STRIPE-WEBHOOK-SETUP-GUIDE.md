# 🔧 Stripe Webhook Setup Guide

## ⚠️ CRITICAL: This MUST be completed before launch!

Without this webhook, **users will pay money but receive NO credits**.

---

## 📋 Prerequisites

1. ✅ Stripe account with API keys
2. ✅ Supabase project deployed
3. ✅ `STRIPE_SECRET_KEY` environment variable set in Supabase
4. ❌ **NEW:** `STRIPE_WEBHOOK_SECRET` environment variable (we'll create this)

---

## 🚀 Step 1: Deploy the Webhook Function

The webhook handler has been created at: `supabase/functions/stripe-webhook/index.ts`

### Deploy to Supabase:

```bash
# Navigate to your project directory
cd /path/to/tale-forge

# Deploy the webhook function
supabase functions deploy stripe-webhook

# Verify deployment
supabase functions list
```

**Expected Output:**
```
NAME              VERSION  CREATED AT
stripe-webhook    1        2025-01-05 ...
create-checkout   ...      ...
check-subscription ...     ...
```

---

## 🔑 Step 2: Get Your Webhook Endpoint URL

Your webhook URL will be:
```
https://zfczvngxnpdchicotipf.supabase.co/functions/v1/stripe-webhook
```

**Format:** `https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook`

Where `[PROJECT_REF]` is your Supabase project reference ID.

---

## 🎯 Step 3: Configure Webhook in Stripe Dashboard

### 3.1 Go to Stripe Dashboard

1. Log in to https://dashboard.stripe.com/
2. Navigate to **Developers** → **Webhooks**
3. Click **"Add endpoint"**

### 3.2 Configure the Endpoint

**Endpoint URL:**
```
https://zfczvngxnpdchicotipf.supabase.co/functions/v1/stripe-webhook
```

**Events to listen to:**
- ✅ `checkout.session.completed`
- ✅ `invoice.payment_succeeded`
- ✅ `customer.subscription.deleted`

**API Version:** Use your account's default (should be `2025-08-27` or similar)

### 3.3 Get the Signing Secret

After creating the webhook:
1. Click on the webhook you just created
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)

**Example:** `whsec_1234567890abcdefghijklmnopqrstuvwxyz`

---

## 🔐 Step 4: Add Webhook Secret to Supabase

### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/zfczvngxnpdchicotipf
2. Navigate to **Settings** → **Edge Functions**
3. Scroll to **Secrets**
4. Click **"Add new secret"**
5. Name: `STRIPE_WEBHOOK_SECRET`
6. Value: `whsec_...` (paste the secret from Stripe)
7. Click **"Save"**

### Option B: Using Supabase CLI

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

---

## ✅ Step 5: Test the Webhook

### 5.1 Install Stripe CLI (if not already installed)

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```powershell
scoop install stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 5.2 Login to Stripe CLI

```bash
stripe login
```

### 5.3 Forward Webhooks to Local (for testing)

```bash
stripe listen --forward-to https://zfczvngxnpdchicotipf.supabase.co/functions/v1/stripe-webhook
```

**Expected Output:**
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

### 5.4 Trigger a Test Event

**In a new terminal:**

```bash
# Test checkout.session.completed
stripe trigger checkout.session.completed
```

**Expected Output:**
```
Setting up fixture for: checkout.session.completed
Running fixture for: checkout.session.completed
Trigger succeeded! Check dashboard for event details.
```

### 5.5 Verify in Logs

**Check Supabase Logs:**
```bash
supabase functions logs stripe-webhook
```

**Expected Log Output:**
```
[STRIPE-WEBHOOK] Webhook signature verified - eventType: checkout.session.completed
[STRIPE-WEBHOOK] Processing checkout.session.completed - sessionId: cs_test_...
[STRIPE-WEBHOOK] Credits added successfully - userId: ..., creditsAdded: 100
```

---

## 🧪 Step 6: End-to-End Test with Real Payment

### 6.1 Use Stripe Test Mode

Make sure you're in **Test Mode** (toggle in top-right of Stripe Dashboard).

### 6.2 Test Credit Purchase

1. Open your app in **incognito window**
2. Sign up with test email: `test-payment@example.com`
3. Go to **Pricing** page
4. Click **"Buy Credits"** on Medium Pack ($9 = 100 credits)
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/26`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
6. Complete payment
7. Verify redirect to `/success` page

### 6.3 Verify Credits Were Added

**Run this SQL in Supabase Dashboard → SQL Editor:**

```sql
SELECT 
  p.email,
  p.is_beta_user,
  p.founder_status,
  uc.current_balance,
  ct.description,
  ct.amount,
  ct.created_at
FROM profiles p
LEFT JOIN user_credits uc ON p.id = uc.user_id
LEFT JOIN credit_transactions ct ON p.id = ct.user_id
WHERE p.email = 'test-payment@example.com'
ORDER BY ct.created_at DESC;
```

**Expected Result:**
```
email                      | is_beta_user | founder_status | current_balance | description                    | amount | created_at
---------------------------|--------------|----------------|-----------------|--------------------------------|--------|------------------
test-payment@example.com   | true         | founder        | 200             | Stripe payment - One-time...   | 100    | 2025-01-05 ...
test-payment@example.com   | true         | founder        | 200             | Beta Founder Bonus - 100...    | 100    | 2025-01-05 ...
```

**Breakdown:**
- 100 credits from beta signup
- 100 credits from payment
- **Total: 200 credits** ✅

---

## 🔄 Step 7: Test Subscription Renewal

Subscriptions are trickier to test because they renew monthly.

### 7.1 Create Test Subscription

1. Sign up with new test email: `test-subscription@example.com`
2. Go to **Pricing** page
3. Subscribe to **Starter Plan** ($9.99/month = 100 credits/month)
4. Use test card: `4242 4242 4242 4242`
5. Complete payment

### 7.2 Verify Initial Credits

```sql
SELECT current_balance 
FROM user_credits uc
JOIN profiles p ON p.id = uc.user_id
WHERE p.email = 'test-subscription@example.com';
```

**Expected:** 200 credits (100 beta + 100 subscription)

### 7.3 Simulate Renewal (Stripe CLI)

```bash
# Get the subscription ID from Stripe Dashboard
# Then trigger renewal:
stripe trigger invoice.payment_succeeded --override subscription=sub_...
```

### 7.4 Verify Renewal Credits Added

```sql
SELECT current_balance 
FROM user_credits uc
JOIN profiles p ON p.id = uc.user_id
WHERE p.email = 'test-subscription@example.com';
```

**Expected:** 300 credits (100 beta + 100 initial + 100 renewal)

---

## 📊 Step 8: Monitor Webhook Activity

### In Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click on your webhook
3. View **"Recent deliveries"**

**Successful webhook:**
- ✅ Status: `200 OK`
- ✅ Response: `{"received": true}`

**Failed webhook:**
- ❌ Status: `400` or `500`
- ❌ Check error message
- ❌ Check Supabase logs

### In Supabase:

```bash
# Real-time logs
supabase functions logs stripe-webhook --follow

# Filter for errors
supabase functions logs stripe-webhook | grep ERROR
```

---

## 🚨 Troubleshooting

### Issue: "Invalid signature" error

**Cause:** Wrong webhook secret

**Fix:**
1. Get the correct secret from Stripe Dashboard
2. Update in Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
3. Redeploy: `supabase functions deploy stripe-webhook`

### Issue: "User not found" error

**Cause:** Email mismatch between Stripe and Supabase

**Fix:**
1. Check Stripe customer email matches Supabase profile email
2. Verify case sensitivity (emails should be lowercase)

### Issue: Credits not added

**Cause:** Unknown price_id

**Fix:**
1. Check `PRICE_TO_CREDITS` mapping in `stripe-webhook/index.ts`
2. Verify price_id matches exactly
3. Add missing price_id if needed

### Issue: Webhook not receiving events

**Cause:** Webhook URL incorrect or not deployed

**Fix:**
1. Verify webhook URL in Stripe Dashboard
2. Check function is deployed: `supabase functions list`
3. Test with Stripe CLI: `stripe trigger checkout.session.completed`

---

## ✅ Launch Checklist

Before going live:

- [ ] Webhook function deployed to Supabase
- [ ] `STRIPE_WEBHOOK_SECRET` environment variable set
- [ ] Webhook configured in Stripe Dashboard (PRODUCTION mode)
- [ ] Test payment completed successfully
- [ ] Credits verified in database
- [ ] Webhook logs show successful processing
- [ ] All price_ids mapped correctly
- [ ] Subscription renewal tested

---

## 🎯 Production Deployment

### Switch to Production Mode:

1. **Stripe Dashboard:**
   - Toggle from "Test mode" to "Live mode" (top-right)
   - Create NEW webhook endpoint (same URL, but in live mode)
   - Get NEW signing secret (different from test mode!)
   - Configure same events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`

2. **Supabase:**
   - Update `STRIPE_WEBHOOK_SECRET` with PRODUCTION secret
   - Verify `STRIPE_SECRET_KEY` is PRODUCTION key (starts with `sk_live_...`)

3. **Test with Real Card:**
   - Use a real credit card (will be charged!)
   - Verify credits added
   - Immediately refund if testing

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs: `supabase functions logs stripe-webhook`
2. Check Stripe webhook delivery logs
3. Verify all environment variables are set correctly
4. Test with Stripe CLI first before real payments

---

**CRITICAL:** Do NOT launch without completing this setup!

**Status:** 🔴 NOT READY until all checklist items are complete


