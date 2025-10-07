# 🔧 FIX: Switch Stripe to Test Mode

## 🚨 **CRITICAL ISSUE FOUND**

You're currently using **LIVE MODE** Stripe keys, which means:
- ❌ Test card `4242 4242 4242 4242` won't work
- ❌ Any payments will charge REAL money
- ❌ You could accidentally charge real customers during testing

**You MUST switch to test mode before testing payments!**

---

## ✅ **SOLUTION: Use Test Mode Keys**

### **Step 1: Get Your Stripe TEST Keys**

1. Go to https://dashboard.stripe.com/
2. **Toggle to "Test mode"** (top-right corner - should show a toggle switch)
3. Navigate to **Developers** → **API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal" to see it

### **Step 2: Update Supabase Environment Variables**

Go to Supabase Dashboard:
https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/settings/functions

1. Click **Edge Functions** → **Secrets**
2. Find `STRIPE_SECRET_KEY`
3. Update it to your **TEST** secret key (starts with `sk_test_...`)
4. Click **Save**

**Example:**
```
STRIPE_SECRET_KEY=sk_test_51RiigeDSKngmC6wH...
```

### **Step 3: Verify Test Mode**

After updating, verify you're in test mode:

1. Go to Stripe Dashboard
2. Ensure toggle shows "Test mode" (usually orange/yellow indicator)
3. Any payments you make will now use test mode

---

## 🧪 **NOW YOU CAN TEST WITH TEST CARD**

Once you've switched to test mode, you can use:

**Test Card Number:** `4242 4242 4242 4242`
**Expiry:** Any future date (e.g., `12/25`)
**CVC:** Any 3 digits (e.g., `123`)
**ZIP:** Any 5 digits (e.g., `12345`)

This card will simulate successful payments without charging real money!

---

## 📋 **COMPLETE TESTING CHECKLIST**

### **1. Switch to Test Mode** ✅
- [ ] Toggle Stripe Dashboard to "Test mode"
- [ ] Get test secret key (`sk_test_...`)
- [ ] Update `STRIPE_SECRET_KEY` in Supabase
- [ ] Verify webhook secret is also from test mode

### **2. Test Payment Flow**
- [ ] Sign in to Tale Forge
- [ ] Go to pricing page
- [ ] Click "Buy Pack" on Medium Pack
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete checkout
- [ ] Verify credits added

### **3. Verify in Database**
```sql
SELECT 
  p.email,
  uc.current_balance,
  ct.description,
  ct.amount,
  ct.created_at
FROM profiles p
LEFT JOIN user_credits uc ON p.id = uc.user_id
LEFT JOIN credit_transactions ct ON p.id = ct.user_id
WHERE p.email = 'YOUR_EMAIL_HERE'
ORDER BY ct.created_at DESC
LIMIT 5;
```

### **4. Check Webhook Logs**
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Click on your webhook endpoint
- [ ] Check "Recent deliveries" tab
- [ ] Verify 200 OK responses

---

## ⚠️ **IMPORTANT: Test vs Live Mode**

### **Test Mode (For Development)**
- Keys start with `pk_test_...` and `sk_test_...`
- Use test cards (4242 4242 4242 4242)
- No real money charged
- Separate webhook endpoint needed

### **Live Mode (For Production)**
- Keys start with `pk_live_...` and `sk_live_...`
- Real credit cards only
- Real money charged
- Separate webhook endpoint needed

**NEVER mix test and live keys!**

---

## 🔄 **WHEN TO SWITCH TO LIVE MODE**

Only switch to live mode when:
1. ✅ All testing complete
2. ✅ Webhook verified working in test mode
3. ✅ All payment flows tested
4. ✅ Ready for real customers
5. ✅ Legal pages complete (Privacy, Terms)
6. ✅ Refund policy in place

**Steps to go live:**
1. Toggle Stripe to "Live mode"
2. Get live keys (`pk_live_...`, `sk_live_...`)
3. Update Supabase environment variables
4. Create NEW webhook endpoint in live mode
5. Get NEW webhook secret (different from test!)
6. Update `STRIPE_WEBHOOK_SECRET` in Supabase
7. Test with small real payment
8. Immediately refund test payment
9. Launch! 🚀

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Still can't use test card**

**Check:**
1. Stripe Dashboard shows "Test mode" toggle is ON
2. `STRIPE_SECRET_KEY` in Supabase starts with `sk_test_...`
3. Clear browser cache and try again
4. Check browser console for errors

### **Issue: Webhook not working in test mode**

**Fix:**
1. Create webhook endpoint in TEST mode (not live mode)
2. Get signing secret from TEST mode webhook
3. Update `STRIPE_WEBHOOK_SECRET` with TEST secret
4. Test with: `stripe trigger checkout.session.completed`

---

## ✅ **QUICK START**

**Right now, do this:**

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/
2. **Toggle to "Test mode"** (top-right)
3. **Get test secret key:** Developers → API keys → Secret key (starts with `sk_test_...`)
4. **Update Supabase:** https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/settings/functions
5. **Update `STRIPE_SECRET_KEY`** to test key
6. **Try payment again** with test card `4242 4242 4242 4242`

**That's it! You should now be able to test payments without charging real money.** 🎉


