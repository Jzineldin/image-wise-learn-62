# Google Gemini 2.5 Flash Image Setup Guide

## Overview

Tale Forge now uses **Google Gemini 2.5 Flash Image (Nano Banana)** for AI image generation with character consistency support.

### Key Benefits

✅ **FREE for 3 weeks** - Promotional period with $0.00 per image  
✅ **Character Consistency** - Supports up to 3 reference images  
✅ **High Quality** - State-of-the-art image generation  
✅ **After 3 weeks**: $0.039 per image (still cheaper than most alternatives)

---

## Setup Instructions

### 1. Set Environment Variable in Supabase

Your API key: `AIzaSyDlUHVpmcQwLvbQ-6i4EbvaLWFYpuVrfgg`

**Steps:**

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions**
3. Add a new environment variable:
   - **Name**: `GOOGLE_GEMINI_API_KEY`
   - **Value**: `AIzaSyDlUHVpmcQwLvbQ-6i4EbvaLWFYpuVrfgg`
4. Click **Save**

### 2. Deploy Updated Edge Functions

Deploy the modified Edge Functions to Supabase:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific functions
supabase functions deploy generate-story-image
supabase functions deploy generate-story
```

### 3. Test Image Generation

Test the integration by generating a story with images:

1. Create a new story in Tale Forge
2. Add characters with reference images
3. Generate story segments with images
4. Verify images are generated successfully

---

## What Changed

### Files Modified

1. **`supabase/functions/_shared/google-gemini-image-service.ts`** (NEW)
   - Google Gemini API integration
   - Character reference image support (up to 3)
   - Base64 image handling
   - Aspect ratio configuration

2. **`supabase/functions/_shared/image-service.ts`** (MODIFIED)
   - Replaced Freepik provider with Google Gemini
   - Updated provider priority (Google Gemini = priority 0)
   - Updated API key mapping
   - Updated service initialization

### Provider Priority Order

After this change, the image generation providers are:

1. **Google Gemini** (Priority 0) - FREE for 3 weeks, then $0.039/image
2. **OVH SDXL** (Priority 1) - 1 credit/image
3. **Replicate SDXL** (Priority 2) - 1 credit/image
4. **HuggingFace SDXL** (Priority 3) - 1 credit/image

---

## Character Consistency

Google Gemini supports **up to 3 character reference images** per story segment:

- Reference images are automatically fetched from `user_characters.image_url`
- Images are passed to Google Gemini API for character consistency
- Works seamlessly with existing character management system

---

## Pricing After Promotional Period

After the 3-week FREE period ends:

- **Cost**: $0.039 per image ($30 per 1M tokens)
- **Resolution**: 1024x1024 pixels (1:1 aspect ratio)
- **Tokens**: 1290 tokens per image (flat rate)

**Example costs:**
- 100 images = $3.90
- 500 images = $19.50
- 1,000 images = $39.00

Still cheaper than most alternatives!

---

## Troubleshooting

### Issue: "Google Gemini service not initialized"

**Solution**: Make sure `GOOGLE_GEMINI_API_KEY` is set in Supabase Edge Functions environment variables.

### Issue: "Failed to fetch reference image"

**Solution**: Ensure character reference images are publicly accessible URLs. Check `user_characters.image_url` values.

### Issue: "No image data in response"

**Solution**: Check the API key is valid and the promotional period is still active. Review Edge Function logs for detailed error messages.

---

## Monitoring Usage

To monitor your Google Gemini API usage:

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Navigate to **API Keys** section
3. View usage statistics and remaining free credits

---

## Next Steps

### For Images (DONE ✅)
- Google Gemini API integrated
- FREE for 3 weeks
- Character consistency supported

### For Videos (TODO)
You have two options:

**Option A: Use Freepik API Free Credits**
- Sign up at https://www.freepik.com/api
- Get 5 EUR free credits (~10-15 videos)
- Test video generation

**Option B: Use Replicate**
- Already have API key
- Kling v1.6: $0.28 per 5 seconds
- I can implement this if you want

**Option C: Skip Videos for MVP**
- Launch with just images
- Add videos later when you have revenue

---

## Summary

✅ **Google Gemini API integrated** - FREE for 3 weeks!  
✅ **Character consistency** - Up to 3 reference images  
✅ **No more wasted Premium+ subscription** - Using proper API access  
✅ **Ready to deploy** - Just set the environment variable and deploy  

**Your €45 Premium+ subscription is still wasted for API purposes**, but at least now you have a working solution that's FREE for 3 weeks and cheap after that.

Want me to help with video generation next, or should we test the image generation first?

