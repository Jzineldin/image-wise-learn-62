# Email Templates: Unified Credits Migration

**Purpose:** Customer communication for unified credits & chapters rollout
**Audience:** All users, subscribers, users hitting limits
**Timing:** See ROLLOUT_PLAN.md Week 5-6

---

## Table of Contents

1. [Email 1: All Users (Migration Announcement)](#email-1-all-users-migration-announcement)
2. [Email 2: Subscribers (Monthly Credits Bonus)](#email-2-subscribers-monthly-credits-bonus)
3. [Email 3: Limit-Hit Users (Triggered)](#email-3-limit-hit-users-triggered)
4. [In-App Announcements](#in-app-announcements)
5. [Support Templates](#support-templates)

---

## Email 1: All Users (Migration Announcement)

**Subject Line Options:**
- ✅ Your credits just got better ✨ (Primary)
- Your Tale-Forge credits have leveled up
- New: Chapters + Credits system is here

**From:** Tale-Forge Team <hello@tale-forge.com>
**Timing:** Week 5, Day 1
**Segment:** All users

---

**Email Body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Your Credits Just Got Better ✨</h1>
  </div>

  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; line-height: 1.6;">Hi {{first_name}},</p>

    <p style="font-size: 16px; line-height: 1.6;">
      We're making your credits more powerful and easier to understand:
    </p>

    <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">What's New</h3>
      <ul style="line-height: 1.8;">
        <li><strong>Your 100 signup credits</strong> now work for voice (TTS) AND video</li>
        <li><strong>NEW: Get 10 free credits every day</strong> to experiment</li>
        <li><strong>NEW: Create 4 free chapters daily</strong> (text + images)</li>
      </ul>
    </div>

    <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0;">How It Works</h4>
      <table style="width: 100%; border-spacing: 0;">
        <tr>
          <td style="padding: 10px; vertical-align: top;">
            <strong style="color: #667eea;">📝 Chapters (4/day free)</strong><br>
            <span style="color: #4a5568;">Create text + image stories</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; vertical-align: top;">
            <strong style="color: #667eea;">💎 Credits (10/day free)</strong><br>
            <span style="color: #4a5568;">Add voice, animations, and video</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">
      <strong>Subscribers:</strong> You now get <strong>500 credits/month</strong> (resets on billing date)—enough for 4+ minutes of AI voice or 16+ videos!
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      Nothing to do—just open the app and create!
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Open Tale-Forge
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <p style="font-size: 14px; color: #718096; line-height: 1.6;">
      Questions? Just reply to this email—we're here to help!
    </p>

    <p style="font-size: 14px; color: #718096;">
      Happy storytelling,<br>
      The Tale-Forge Team
    </p>
  </div>

  <div style="background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
    <p>Tale-Forge | Generative AI Storytelling Platform</p>
    <p><a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a></p>
  </div>
</body>
</html>
```

**Plain Text Version:**

```
Your Credits Just Got Better ✨

Hi {{first_name}},

We're making your credits more powerful and easier to understand:

WHAT'S NEW:
✅ Your 100 signup credits now work for voice (TTS) AND video
✅ NEW: Get 10 free credits every day to experiment
✅ NEW: Create 4 free chapters daily (text + images)

HOW IT WORKS:

📝 Chapters (4/day free)
Create text + image stories

💎 Credits (10/day free)
Add voice, animations, and video

Subscribers: You now get 500 credits/month (resets on billing date)—enough for 4+ minutes of AI voice or 16+ videos!

Nothing to do—just open the app and create!

👉 Open Tale-Forge: {{app_url}}

Questions? Just reply to this email—we're here to help!

Happy storytelling,
The Tale-Forge Team

---
Tale-Forge | Generative AI Storytelling Platform
Unsubscribe: {{unsubscribe_url}}
```

---

## Email 2: Subscribers (Monthly Credits Bonus)

**Subject Line Options:**
- ✅ Subscriber bonus: 500 credits every month 🎉 (Primary)
- You now get 500 credits/month as a subscriber
- Your premium benefits just got better

**From:** Tale-Forge Team <hello@tale-forge.com>
**Timing:** Week 6, Day 1
**Segment:** Active subscribers only

---

**Email Body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Subscriber Bonus: 500 Credits/Month 🎉</h1>
  </div>

  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; line-height: 1.6;">Hi {{first_name}},</p>

    <p style="font-size: 16px; line-height: 1.6;">
      Thank you for being a Tale-Forge subscriber! We're excited to share a new perk:
    </p>

    <div style="background: linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%); border: 2px solid #f5576c; padding: 30px; margin: 20px 0; border-radius: 12px; text-align: center;">
      <h2 style="margin: 0; color: #f5576c; font-size: 32px;">500 Credits/Month</h2>
      <p style="margin: 10px 0 0 0; color: #4a5568;">Renews on {{next_billing_date}}</p>
    </div>

    <h3 style="color: #2d3748;">What can you do with 500 credits?</h3>
    <ul style="line-height: 1.8; font-size: 16px;">
      <li>🎙️ <strong>4+ minutes of AI narration</strong> (at 2 credits/second)</li>
      <li>🎬 <strong>16+ animated videos</strong> (at 30 credits/video)</li>
      <li>✨ <strong>33+ animated scenes</strong> (at 15 credits/scene)</li>
      <li>🔀 <strong>Or mix and match!</strong> Voice a few chapters, animate the best scenes</li>
    </ul>

    <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0;">Your Full Premium Benefits</h4>
      <ul style="line-height: 1.8;">
        <li>✅ <strong>Unlimited story chapters</strong> per day</li>
        <li>✅ <strong>500 credits every month</strong> for voice, video, and animations</li>
        <li>✅ <strong>Priority generation queue</strong> (2x faster)</li>
        <li>✅ <strong>Unlimited active stories</strong></li>
      </ul>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">
      Your monthly credits reset on <strong>{{next_billing_date}}</strong>. Use them anytime!
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}" style="display: inline-block; background: #f5576c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Start Creating with Your Credits
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <p style="font-size: 14px; color: #718096; line-height: 1.6;">
      Questions about credits? Reply to this email anytime.
    </p>

    <p style="font-size: 14px; color: #718096;">
      Happy storytelling,<br>
      The Tale-Forge Team
    </p>
  </div>

  <div style="background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
    <p>Tale-Forge | Generative AI Storytelling Platform</p>
    <p><a href="{{manage_subscription_url}}" style="color: #f5576c;">Manage Subscription</a></p>
  </div>
</body>
</html>
```

**Plain Text Version:**

```
Subscriber Bonus: 500 Credits Every Month 🎉

Hi {{first_name}},

Thank you for being a Tale-Forge subscriber! We're excited to share a new perk:

🎉 500 CREDITS/MONTH 🎉
Renews on {{next_billing_date}}

WHAT CAN YOU DO WITH 500 CREDITS?

🎙️ 4+ minutes of AI narration (at 2 credits/second)
🎬 16+ animated videos (at 30 credits/video)
✨ 33+ animated scenes (at 15 credits/scene)
🔀 Or mix and match! Voice a few chapters, animate the best scenes

YOUR FULL PREMIUM BENEFITS:
✅ Unlimited story chapters per day
✅ 500 credits every month for voice, video, and animations
✅ Priority generation queue (2x faster)
✅ Unlimited active stories

Your monthly credits reset on {{next_billing_date}}. Use them anytime!

👉 Start Creating: {{app_url}}

Questions about credits? Reply to this email anytime.

Happy storytelling,
The Tale-Forge Team

---
Tale-Forge | Generative AI Storytelling Platform
Manage Subscription: {{manage_subscription_url}}
```

---

## Email 3: Limit-Hit Users (Triggered)

**Subject Line Options:**
- ✅ You're creating a lot! Here's how to keep going 🚀 (Primary)
- Daily chapter limit reached—want unlimited?
- Loving Tale-Forge? Unlock unlimited creation

**From:** Tale-Forge Team <hello@tale-forge.com>
**Timing:** Triggered when user hits 4/4 chapters
**Segment:** Free users, chapters_used_today = 4

---

**Email Body (HTML):**

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">You're on Fire! 🔥</h1>
  </div>

  <div style="padding: 30px 20px;">
    <p style="font-size: 16px; line-height: 1.6;">Hi {{first_name}},</p>

    <p style="font-size: 16px; line-height: 1.6;">
      We noticed you've used all <strong>4 free chapters today</strong>. Great job creating!
    </p>

    <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: #c53030;">
        <strong>Daily Limit Reached</strong><br>
        Your chapters reset in <strong>{{hours_until_reset}} hours</strong>.
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">
      Want to keep creating? Upgrade to Premium:
    </p>

    <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px solid #667eea; padding: 30px; margin: 20px 0; border-radius: 12px;">
      <h3 style="margin-top: 0; text-align: center; color: #667eea;">Premium Benefits</h3>
      <ul style="line-height: 1.8; font-size: 16px;">
        <li>✨ <strong>Unlimited story chapters</strong> per day</li>
        <li>🎙️ <strong>500 credits/month</strong> for voice, video, and animations</li>
        <li>⚡ <strong>Priority queue</strong> (generate 2x faster)</li>
        <li>📚 <strong>Unlimited active stories</strong></li>
      </ul>
      <div style="text-align: center; margin-top: 20px;">
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2d3748;">$9.99/month</p>
        <p style="margin: 5px 0 0 0; color: #718096;">Cancel anytime</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{pricing_url}}?source=limit_email" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Start Free Trial
      </a>
    </div>

    <p style="text-align: center; font-size: 14px; color: #718096;">
      Or wait {{hours_until_reset}} hours for your chapters to reset
    </p>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

    <p style="font-size: 14px; color: #718096;">
      Happy storytelling,<br>
      The Tale-Forge Team
    </p>
  </div>

  <div style="background: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
    <p>Tale-Forge | Generative AI Storytelling Platform</p>
    <p><a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a></p>
  </div>
</body>
</html>
```

---

## In-App Announcements

### Announcement 1: First Login After Migration (Modal)

```tsx
<Dialog open={!hasSeenMigrationAnnouncement}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <div className="mx-auto mb-4">
        <Sparkles className="w-12 h-12 text-primary" />
      </div>
      <DialogTitle className="text-center">
        Credits & Chapters—Now Clearer
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div>
        <h4 className="font-semibold flex items-center space-x-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Chapters (4/day free)</span>
        </h4>
        <p className="text-sm text-muted-foreground">
          Create text + image stories
        </p>
      </div>

      <div>
        <h4 className="font-semibold flex items-center space-x-2">
          <Gem className="w-4 h-4 text-primary" />
          <span>Credits (10/day free)</span>
        </h4>
        <p className="text-sm text-muted-foreground">
          Add voice, animations, video
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-sm">
          Your 100 signup credits? <strong>Still yours!</strong>
        </p>
      </div>
    </div>

    <DialogFooter>
      <Button onClick={() => setHasSeenMigrationAnnouncement(true)} className="w-full">
        Got It, Let's Create!
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Announcement 2: Persistent Banner (7 days)

```tsx
<Banner variant="info" dismissible onDismiss={() => setHasDismissedBanner(true)}>
  <Sparkles className="w-4 h-4" />
  <span>
    <strong>New:</strong> Chapters + Credits system! Create 4 free stories/day.
    Get 10 daily credits for voice & video.
  </span>
  <Button variant="ghost" size="sm" asChild>
    <Link to="/pricing">Learn More →</Link>
  </Button>
</Banner>
```

---

## Support Templates

### Template 1: "I lost my credits"

**Issue:** User believes their credits disappeared after migration

**Response:**
```
Hi {{first_name}},

Thanks for reaching out! Your credits are safe. Here's what's happening:

The unified credits system now separates two resources:

📝 **Chapters (4/day free)**: For creating text + image stories
💎 **Credits**: For voice, animations, and video

Your 100 signup credits are still in your account! You can see your balance in the top right corner of the app, or by clicking your profile → Settings.

If you're still seeing an incorrect balance, please reply with a screenshot and I'll investigate immediately.

Best,
{{support_agent_name}}
```

### Template 2: "Chapter limit is confusing"

**Issue:** User doesn't understand chapters vs. credits

**Response:**
```
Hi {{first_name}},

Great question! Here's how it works:

**Chapters (4/day free)**
Think of this as your daily story quota. Each time you create a new chapter (text + image), it uses 1 chapter. Free users get 4/day. Premium users get unlimited.

**Credits (separate from chapters)**
These are for premium features like:
- 🎙️ AI voice narration (2 credits/second)
- 🎬 Video generation (30 credits)
- ✨ Scene animations (15 credits)

Free users get:
- 100 credits as a signup bonus
- 10 credits every day

Premium users get:
- Unlimited chapters
- 500 credits/month

Does that help? Let me know if you have more questions!

Best,
{{support_agent_name}}
```

### Template 3: "Can't generate video"

**Issue:** User hitting video gate due to insufficient credits

**Response:**
```
Hi {{first_name}},

Video generation costs 30 credits. I checked your account and you currently have {{current_balance}} credits.

Here are your options:

**Option 1: Wait for daily credits**
You get 10 free credits every day at midnight. In {{days_to_afford}} days, you'll have enough for a video!

**Option 2: Upgrade to Premium ($9.99/mo)**
- 500 credits/month (enough for 16+ videos)
- Unlimited story chapters
- Priority generation queue

You can upgrade here: {{pricing_url}}

Let me know if you need help!

Best,
{{support_agent_name}}
```

---

## Email Metrics to Track

| Metric | Target | Week 5 Actual | Week 8 Actual |
|--------|--------|---------------|---------------|
| **Email 1 (All Users)** |  |  |  |
| Open Rate | >25% |  |  |
| Click Rate | >5% |  |  |
| Bounce Rate | <2% |  |  |
| **Email 2 (Subscribers)** |  |  |  |
| Open Rate | >40% |  |  |
| Click Rate | >15% |  |  |
| **Email 3 (Triggered)** |  |  |  |
| Open Rate | >30% |  |  |
| Conversion Rate | >15% |  |  |

---

## A/B Test Ideas (Future Iterations)

### Email 1 Subject Line Test
- Variant A: "Your credits just got better ✨"
- Variant B: "New: Chapters + Credits system is here"
- Variant C: "100 free credits + 10 more every day!"

### Email 3 CTA Test
- Variant A: "Start Free Trial"
- Variant B: "Upgrade to Unlimited"
- Variant C: "Get 500 Credits/Month"

---

**Template Owner:** Marketing Team
**Last Updated:** 2025-11-16
**Next Review:** After Week 8 metrics analysis
