# 🧪 WEBHOOK TESTING GUIDE

## OPTION 1: Test with Stripe CLI (Recommended - 5 minutes)

This is the fastest way to verify your webhook is working!

### **Step 1: Install Stripe CLI** (if not already installed)

**Windows:**
```powershell
# Download from: https://github.com/stripe/stripe-cli/releases/latest
# Or use Scoop:
scoop install stripe
```

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

### **Step 2: Login to Stripe**
```bash
stripe login
```
This will open your browser to authenticate.

### **Step 3: Trigger Test Webhook Event**

**Test checkout.session.completed event:**
```bash
stripe trigger checkout.session.completed
```

This will send a test event to your webhook URL!

### **Step 4: Check Webhook Logs**

Go to Supabase Dashboard:
1. Navigate to: https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/functions/stripe-webhook/logs
2. Look for recent logs
3. Check for successful processing

### **Step 5: Verify in Database**

Run this query in Supabase SQL Editor:
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
WHERE ct.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY ct.created_at DESC
LIMIT 5;
```

---

## OPTION 2: Test with Real Payment (Test Mode - 15 minutes)

### **Step 1: Sign In to Tale Forge**

1. Go to http://localhost:8080/auth
2. Sign in with an existing account OR create a new one
3. Verify your email (check inbox)

### **Step 2: Purchase Credits**

1. Go to http://localhost:8080/pricing
2. Click "Buy Pack" on Medium Pack ($9 = 100 credits)
3. You'll be redirected to Stripe Checkout

### **Step 3: Complete Test Payment**

Use Stripe test card:
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### **Step 4: Verify Success**

After payment:
1. You should be redirected to success page
2. Check your credits in the app (should increase by 100)

### **Step 5: Verify in Database**

Run this query in Supabase SQL Editor:
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

Replace `YOUR_EMAIL_HERE` with the email you used to sign in.

### **Step 6: Check Webhook Logs**

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Check "Recent deliveries" tab
4. Look for successful 200 responses

---

## 🔍 WHAT TO LOOK FOR

### **✅ Success Indicators:**

**In Supabase Logs:**
```
[INFO] Webhook received: checkout.session.completed
[INFO] Processing payment for user: <user_id>
[INFO] Adding 100 credits to user
[INFO] Credits added successfully
```

**In Database:**
- `current_balance` increased by correct amount
- New transaction in `credit_transactions` table
- Description: "Stripe payment - One-time purchase - 100 credits"

**In Stripe Dashboard:**
- Webhook delivery shows 200 OK response
- Event successfully processed

### **❌ Error Indicators:**

**In Supabase Logs:**
```
[ERROR] Webhook signature verification failed
[ERROR] Failed to add credits
[ERROR] User not found
```

**In Stripe Dashboard:**
- Webhook delivery shows 400/500 error
- Multiple retry attempts

---

## 🐛 TROUBLESHOOTING

### **Issue: Webhook signature verification failed**

**Cause:** STRIPE_WEBHOOK_SECRET is incorrect or not set

**Fix:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" next to "Signing secret"
4. Copy the secret (starts with `whsec_...`)
5. Update in Supabase: Dashboard → Settings → Edge Functions → Secrets
6. Update `STRIPE_WEBHOOK_SECRET` value

### **Issue: Credits not added**

**Cause:** Price ID not found in mapping

**Fix:**
1. Check Supabase logs for the price ID
2. Verify it matches one in `supabase/functions/stripe-webhook/index.ts`
3. If not, add it to the `PRICE_TO_CREDITS` mapping

### **Issue: User not found**

**Cause:** User ID in Stripe metadata doesn't match Supabase user

**Fix:**
1. Ensure user is logged in when purchasing
2. Check that `client_reference_id` is set in checkout session
3. Verify user exists in `profiles` table

---

## 📊 EXPECTED RESULTS

### **For Medium Pack ($9 = 100 credits):**

**Before Purchase:**
```sql
current_balance: 100 (beta bonus)
```

**After Purchase:**
```sql
current_balance: 200 (100 beta + 100 purchased)
```

**Transaction Log:**
```sql
description: "Stripe payment - One-time purchase - 100 credits"
amount: 100
transaction_type: "purchase"
```

---

## 🎯 NEXT STEPS AFTER TESTING

Once webhook is verified working:

1. ✅ Test all credit pack sizes (Small, Medium, Large, Mega)
2. ✅ Test subscription purchases (Starter, Premium)
3. ✅ Test subscription renewals (wait for next billing cycle OR use Stripe CLI)
4. ✅ Verify Google OAuth
5. ✅ Final cross-browser testing
6. ✅ Deploy to production!

---

**Good luck! 🚀**

