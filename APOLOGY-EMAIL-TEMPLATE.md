# Tale Forge - User Notification Email Templates

---

## 📧 EMAIL TEMPLATE 1: For Email/Password Users

**Subject:** Tale Forge - Action Required: Reset Your Password

---

Hi there,

We're writing to let you know that **Tale Forge has been migrated to a new and improved system**.

### What This Means for You:

**You'll need to reset your password** to continue using Tale Forge.

**Here's what to do:**
1. Check your email for a password reset link (sent separately)
2. Click the link and set a new password
3. Log in to Tale Forge: https://tale-forge.app

**Your account and data are safe** - this is just a technical migration to improve our service.

### We Apologize for the Inconvenience

We know password resets are annoying, and we're sorry for the extra step. We're committed to making Tale Forge the best storytelling platform for you, and this migration was necessary to improve performance and reliability.

If you have any issues logging in, please reply to this email and we'll help you right away.

Thank you for your patience and for being part of Tale Forge!

Best regards,  
Kevin  
Tale Forge Team

---

## 📧 EMAIL TEMPLATE 2: For Google Auth Users

**Subject:** Tale Forge - System Migration Complete (No Action Needed)

---

Hi there,

We're writing to let you know that **Tale Forge has been migrated to a new and improved system**.

### What This Means for You:

**Good news: No action needed!** 

Since you log in with Google, you can continue using Tale Forge exactly as before:

1. Go to https://tale-forge.app
2. Click "Sign in with Google"
3. That's it!

**Your account and data are safe** - this is just a technical migration to improve our service.

### We Apologize for Any Inconvenience

We know system migrations can be disruptive, and we apologize for any confusion. We're committed to making Tale Forge the best storytelling platform for you, and this migration was necessary to improve performance and reliability.

If you have any issues logging in, please reply to this email and we'll help you right away.

Thank you for your patience and for being part of Tale Forge!

Best regards,  
Kevin  
Tale Forge Team

---

## 📧 EMAIL TEMPLATE 3: Combined (For All Users)

**Subject:** Tale Forge - System Migration Complete

---

Hi there,

We're writing to let you know that **Tale Forge has been migrated to a new and improved system**.

### What This Means for You:

**If you log in with Email/Password:**
- You'll need to reset your password
- Check your email for a password reset link (sent separately)
- Click the link, set a new password, and log in at https://tale-forge.app

**If you log in with Google:**
- No action needed!
- Just go to https://tale-forge.app and click "Sign in with Google"

**Your account and data are safe** - this is just a technical migration to improve our service.

### We Apologize for the Inconvenience

We know system migrations can be disruptive, and we're sorry for any extra steps required. We're committed to making Tale Forge the best storytelling platform for you, and this migration was necessary to improve performance and reliability.

If you have any issues logging in, please reply to this email and we'll help you right away.

Thank you for your patience and for being part of Tale Forge!

Best regards,  
Kevin  
Tale Forge Team

---

## 🎯 HOW TO SEND THESE EMAILS

### Option 1: Use the Script (Automatic)

The `notify-users.js` script will:
- ✅ Send password reset emails to Email/Password users automatically
- ✅ Show you the list of Google Auth users (you can email them manually)

**Run:**
```bash
node notify-users.js
```

### Option 2: Manual Email (More Personal)

**Step 1: Get User Lists**

Run the script in dry run mode to see the breakdown:
```bash
# Edit notify-users.js and set DRY_RUN = true
node notify-users.js
```

This will show you:
- How many Email/Password users
- How many Google Auth users
- List of all Google Auth users

**Step 2: Send Emails**

**For Email/Password Users:**
1. Run the script with `DRY_RUN = false` to send password resets
2. Then send the "Email Template 1" as a follow-up explanation

**For Google Auth Users:**
1. Copy the list from the script output
2. Send "Email Template 2" to all of them
3. Use BCC to protect privacy

### Option 3: Combined Approach (Recommended)

1. **Run the script** to send password resets to Email/Password users
2. **Send "Email Template 3"** to ALL users as a general announcement
3. This way everyone gets an explanation, and Email/Password users also get the reset link

---

## 📊 USER BREAKDOWN (Expected)

Based on your 147 users, you'll likely have:

**Email/Password Users:** ~60-80 users
- Will receive password reset email from Supabase
- Should also receive explanation email from you

**Google Auth Users:** ~60-80 users
- Don't need password reset
- Should receive explanation email from you
- Can log in immediately with Google

---

## ✅ RECOMMENDED APPROACH

### Step 1: Run the Notification Script

```bash
node notify-users.js
```

This will:
- ✅ Send password reset emails to Email/Password users
- ✅ Show you the list of Google Auth users

### Step 2: Send Manual Apology Email

Send **"Email Template 3" (Combined)** to ALL 147 users:
- Explains the migration
- Tells Email/Password users to check for reset email
- Tells Google Auth users they can just log in
- Apologizes for inconvenience

### Step 3: Monitor Support

- Watch for replies
- Help users who have trouble logging in
- Be responsive for the first 24-48 hours

---

## 💡 TIPS FOR SENDING

### Using Gmail/Outlook:

**For Email/Password Users:**
- Use BCC to send to all at once
- Or use a tool like Mailchimp (free for <500 contacts)

**For Google Auth Users:**
- Use BCC to send to all at once
- Make sure to use "Email Template 2" (no password reset needed)

### Timing:

**Best time to send:**
- Tuesday-Thursday
- 9am-11am in your users' timezone
- Avoid weekends and late nights

**Follow-up:**
- Send the email within 1 hour of running the script
- This way password reset links are fresh
- Users get context immediately

---

## 🆘 SUPPORT RESPONSES

### If users reply saying they can't log in:

**For Email/Password users:**
```
Hi [Name],

Sorry you're having trouble! Here's what to do:

1. Go to https://tale-forge.app
2. Click "Forgot Password"
3. Enter your email: [their email]
4. Check your email for the reset link
5. Click the link and set a new password

If you still have issues, let me know and I'll reset it manually for you.

Thanks,
Kevin
```

**For Google Auth users:**
```
Hi [Name],

Sorry you're having trouble! Here's what to do:

1. Go to https://tale-forge.app
2. Click "Sign in with Google"
3. Choose your Google account: [their email]
4. That's it!

You don't need a password - just use Google to log in.

If you still have issues, let me know!

Thanks,
Kevin
```

---

## ✅ CHECKLIST

- [ ] Run `notify-users.js` to send password resets
- [ ] Note the breakdown of Email/Password vs Google Auth users
- [ ] Send "Email Template 3" to ALL users
- [ ] Monitor email for replies
- [ ] Help users who have trouble logging in
- [ ] Consider posting on social media about the migration
- [ ] Update any documentation with new login instructions

---

**You've got this!** 💪

The script will handle the technical part (password resets), and the email templates will handle the communication part (apology and explanation).

**Let me know if you need help with anything!** 🚀

