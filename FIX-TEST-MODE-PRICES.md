# 🔧 FIX: Create Test Mode Prices in Stripe

## 🚨 **THE PROBLEM**

You're getting "edge function returned a non 2xx status code" because:

**Your price IDs are from LIVE mode, but you're using TEST mode keys!**

When you switch to test mode:
- ❌ Live mode price IDs don't exist in test mode
- ❌ Products need to be recreated in test mode
- ❌ Price IDs will be different

**Example:**
- Live: `price_1S6b9OK8ILu7UAIcX0c8eIpW`
- Test: `price_test_1234567890abcdef` (different!)

---

## ✅ **SOLUTION: Create Test Mode Prices**

### **Step 1: Check the Error (Optional)**

To confirm this is the issue:

1. Go to: https://supabase.com/dashboard/project/hlrvpuqwurtdbjkramcp/logs/edge-functions
2. Look for `create-checkout` errors
3. You'll see: `"No such price: price_1S6b9OK8ILu7UAIc..."` or `"Invalid price"`

### **Step 2: Create Products in Stripe Test Mode**

Go to Stripe Dashboard (**make sure Test mode is ON**):

**URL:** https://dashboard.stripe.com/test/products

Click **"Add product"** and create each one:

---

#### **Product 1: Small Pack**
- **Name:** `Small Pack`
- **Description:** `50 credits for Tale Forge`
- **Pricing model:** `One time`
- **Price:** `$5.00 USD`
- Click **"Save product"**
- **📋 Copy the Price ID** (starts with `price_test_...`)

---

#### **Product 2: Medium Pack**
- **Name:** `Medium Pack`
- **Description:** `100 credits for Tale Forge`
- **Pricing model:** `One time`
- **Price:** `$9.00 USD`
- Click **"Save product"**
- **📋 Copy the Price ID**

---

#### **Product 3: Large Pack**
- **Name:** `Large Pack`
- **Description:** `250 credits for Tale Forge`
- **Pricing model:** `One time`
- **Price:** `$20.00 USD`
- Click **"Save product"**
- **📋 Copy the Price ID**

---

#### **Product 4: Mega Pack**
- **Name:** `Mega Pack`
- **Description:** `500 credits for Tale Forge`
- **Pricing model:** `One time`
- **Price:** `$35.00 USD`
- Click **"Save product"**
- **📋 Copy the Price ID**

---

#### **Product 5: Starter Subscription**
- **Name:** `Starter Subscription`
- **Description:** `100 credits per month for Tale Forge`
- **Pricing model:** `Recurring`
- **Price:** `$9.99 USD`
- **Billing period:** `Monthly`
- Click **"Save product"**
- **📋 Copy the Price ID**

---

#### **Product 6: Premium Subscription**
- **Name:** `Premium Subscription`
- **Description:** `300 credits per month for Tale Forge`
- **Pricing model:** `Recurring`
- **Price:** `$19.99 USD`
- **Billing period:** `Monthly`
- Click **"Save product"**
- **📋 Copy the Price ID**

---

### **Step 3: Save Your Test Price IDs**

Create a temporary file to save your price IDs:

```
Small Pack ($5 = 50 credits):
price_test_________________

Medium Pack ($9 = 100 credits):
price_test_________________

Large Pack ($20 = 250 credits):
price_test_________________

Mega Pack ($35 = 500 credits):
price_test_________________

Starter Subscription ($9.99/month = 100 credits):
price_test_________________

Premium Subscription ($19.99/month = 300 credits):
price_test_________________
```

---

### **Step 4: Update Price IDs in Code**

Now I'll help you update the price IDs in your code.

**Tell me your test price IDs and I'll update the code for you!**

Or you can update them manually in these files:

1. **`src/pages/Pricing.tsx`** (lines 44, 64, 87, 96, 105, 114)
2. **`supabase/functions/stripe-webhook/index.ts`** (lines 14-20)
3. **`src/components/CreditDisplay.tsx`** (line 95)

---

## 🎯 **QUICK ALTERNATIVE: Use Stripe CLI**

If you want to speed this up, you can use Stripe CLI to copy products from live to test:

```bash
# Login to Stripe
stripe login

# List live mode products
stripe products list --limit 10

# For each product, create in test mode
stripe products create \
  --name "Medium Pack" \
  --description "100 credits for Tale Forge"

# Create price for the product
stripe prices create \
  --product prod_XXXXX \
  --unit-amount 900 \
  --currency usd
```

But creating them in the dashboard is easier!

---

## 📋 **CHECKLIST**

- [ ] Confirm Stripe Dashboard is in **Test mode**
- [ ] Create Small Pack product ($5)
- [ ] Create Medium Pack product ($9)
- [ ] Create Large Pack product ($20)
- [ ] Create Mega Pack product ($35)
- [ ] Create Starter Subscription ($9.99/month)
- [ ] Create Premium Subscription ($19.99/month)
- [ ] Copy all 6 price IDs
- [ ] Update `src/pages/Pricing.tsx`
- [ ] Update `supabase/functions/stripe-webhook/index.ts`
- [ ] Update `src/components/CreditDisplay.tsx`
- [ ] Redeploy webhook: `supabase functions deploy stripe-webhook`
- [ ] Test payment with test card

---

## 🚀 **AFTER YOU CREATE THE PRICES**

**Send me the 6 test price IDs and I'll update the code for you automatically!**

Just paste them like this:

```
Small: price_test_ABC123
Medium: price_test_DEF456
Large: price_test_GHI789
Mega: price_test_JKL012
Starter: price_test_MNO345
Premium: price_test_PQR678
```

And I'll update all the files for you! 🎉

---

## 💡 **WHY THIS HAPPENS**

Stripe keeps test and live mode **completely separate**:

- **Test mode:** For development and testing
  - Uses test keys (`sk_test_...`, `pk_test_...`)
  - Test price IDs (`price_test_...`)
  - Test cards work (4242 4242 4242 4242)
  - No real money

- **Live mode:** For production
  - Uses live keys (`sk_live_...`, `pk_live_...`)
  - Live price IDs (`price_1S6b9...`)
  - Real cards only
  - Real money charged

**You can't mix them!** That's why you need separate price IDs for each mode.

---

## 🎯 **NEXT STEPS**

1. **Create the 6 products in Stripe test mode** (10 minutes)
2. **Copy the price IDs**
3. **Send them to me** and I'll update the code
4. **Test payment** with test card `4242 4242 4242 4242`
5. **Verify credits added** to your account

**Let's do this!** 🚀


