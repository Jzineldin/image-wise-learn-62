# Freepik AI Integration - Quick Setup Guide

## Overview

This guide covers setup for both **Image Generation** (Gemini 2.5 Flash) and **Video Generation** (Hailuo 2 + Wan v2.2) using Freepik API.

## Prerequisites

✅ Freepik Premium+ subscription (€36/month)
✅ Freepik API key
✅ Supabase project with Edge Functions enabled

## Step-by-Step Setup

### 1. Get Your Freepik API Key

1. Go to https://www.freepik.com/developers/dashboard/api-key
2. Log in with your Premium+ account
3. Generate a new API key
4. Copy the key (you'll need it in step 3)

### 2. Run Database Migration (Video Only)

**Note**: Image generation uses existing database schema - no migration needed!

```bash
# Navigate to your project directory
cd /home/ubuntu/image-wise-learn-62

# Push the video migration to Supabase
supabase db push
```

This will add the following video fields to your database:
- `story_segments.video_url`
- `story_segments.video_provider`
- `story_segments.video_generation_status`
- `story_segments.video_task_id`
- `stories.full_story_video_url`
- `stories.full_story_video_status`

**Image generation uses existing fields**:
- `user_characters.image_url` (character reference images)
- `character_story_appearances` (character tracking)
- `stories.metadata.characters` (character IDs)

### 3. Set Environment Variable

**Option A: Via Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Settings** > **Edge Functions**
4. Click **Add secret**
5. Name: `FREEPIK_API_KEY`
6. Value: Your API key from step 1
7. Click **Save**

**Option B: Via CLI**
```bash
supabase secrets set FREEPIK_API_KEY=your_api_key_here
```

### 4. Deploy Edge Functions

```bash
# Deploy image generation function (includes Freepik support)
supabase functions deploy generate-story-image

# Deploy video generation function
supabase functions deploy generate-story-video

# Deploy status checking function
supabase functions deploy check-video-status

# Deploy story generation function (includes character appearance tracking)
supabase functions deploy generate-story
```

### 5. Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs generate-story-video
```

You should see:
- ✅ `generate-story-image` - deployed
- ✅ `generate-story-video` - deployed
- ✅ `check-video-status` - deployed
- ✅ `generate-story` - deployed

### 6. Test Image Generation (Freepik Gemini 2.5 Flash)

**Option A: Via Supabase Dashboard**
1. Go to **Edge Functions** > `generate-story-image`
2. Click **Invoke**
3. Use this test payload:
```json
{
  "story_id": "your-story-uuid",
  "segment_id": "your-segment-uuid",
  "storyContent": "A brave knight explores a magical forest",
  "style": "digital_storybook"
}
```

**Option B: Via Code**
```typescript
import { AIClient } from '@/lib/api/ai-client';

const result = await AIClient.generateStoryImage({
  storyId: story.id,
  segmentId: segment.id,
  storyContent: segment.content,
  style: 'digital_storybook'
});

console.log('Image generated:', result.imageUrl);
console.log('Provider used:', result.provider); // Should be "Freepik" if API key is set
```

### 7. Test Video Generation

**Option A: Via Supabase Dashboard**
1. Go to **Edge Functions** > `generate-story-video`
2. Click **Invoke**
3. Use this test payload:
```json
{
  "segment_id": "your-segment-uuid",
  "story_id": "your-story-uuid",
  "image_url": "https://your-image-url.com/image.png",
  "wait_for_completion": false
}
```

**Option B: Via Code**
```typescript
import { AIClient } from '@/lib/api/ai-client';

const result = await AIClient.generateStoryVideo({
  segmentId: segment.id,
  storyId: story.id,
  imageUrl: segment.image_url,
  waitForCompletion: false
});

console.log('Video generation started:', result.task_id);
```

### 8. Check Video Status

```typescript
const status = await AIClient.checkVideoStatus({
  taskId: result.task_id,
  provider: result.provider,
  segmentId: segment.id,
  updateDatabase: true
});

if (status.status === 'completed') {
  console.log('Video ready:', status.video_url);
}
```

## Verification Checklist

### Image Generation
- [ ] `FREEPIK_API_KEY` environment variable set
- [ ] `generate-story-image` function deployed
- [ ] `generate-story` function deployed (for character tracking)
- [ ] Test image generation works
- [ ] Freepik provider used (check logs)
- [ ] Character reference images working (if characters have images)

### Video Generation
- [ ] Database migration applied successfully
- [ ] `FREEPIK_API_KEY` environment variable set
- [ ] `generate-story-video` function deployed
- [ ] `check-video-status` function deployed
- [ ] Test video generation works
- [ ] Video URL saved to database

## Common Issues

### Image Generation Issues

#### Issue: "No character reference images used"
**Solution**:
- Characters need `image_url` set in `user_characters` table
- Upload character images via character creation UI
- Check: `SELECT id, name, image_url FROM user_characters WHERE user_id = 'your-user-id'`

#### Issue: "Freepik image generation fails, falls back to SDXL"
**Solution**:
- Verify `FREEPIK_API_KEY` is set correctly
- Check rate limit (10,000 RPD for Premium+)
- Review Edge Function logs for detailed error

#### Issue: "Character appearances not recorded"
**Solution**:
- Verify story metadata contains character IDs
- Check: `SELECT metadata FROM stories WHERE id = 'story-id'`
- Ensure `generate-story` function is deployed

### Video Generation Issues

#### Issue: "FREEPIK_API_KEY environment variable is required"
**Solution**: Make sure you set the environment variable in Supabase Dashboard or via CLI

#### Issue: "Freepik API error: 401"
**Solution**: Your API key is invalid or expired. Generate a new one from Freepik dashboard

#### Issue: "Freepik API error: 403"
**Solution**: Your subscription doesn't include video generation. Verify you have Premium+ plan

#### Issue: "Image URL not accessible"
**Solution**: Make sure the image URL is publicly accessible. Freepik needs to download the image.

#### Issue: "Video generation timeout"
**Solution**:
- Default timeout is 5 minutes
- Use `wait_for_completion: false` and poll separately
- Check Freepik API status: https://status.freepik.com

## Next Steps

Now that Freepik integration is set up, you can:

### Image Generation
1. **Upload Character Images** - Add reference images to characters
2. **Test Character Consistency** - Generate multiple segments with same characters
3. **Monitor Provider Usage** - Check which provider is used (Freepik vs SDXL)
4. **Optimize Prompts** - Fine-tune prompts for better results

### Video Generation
1. **Add UI Components** - Add video player to story viewer
2. **Automatic Generation** - Auto-generate videos after images
3. **Batch Processing** - Generate videos for all segments at once
4. **Full Story Video** - Combine segments into complete story video

See documentation for detailed implementation guides:
- `FREEPIK-IMAGE-INTEGRATION.md` - Image generation details
- `FREEPIK-VIDEO-INTEGRATION.md` - Video generation details

## Support

- **Freepik API Docs**: https://docs.freepik.com
- **Freepik Support**: https://www.freepik.com/support
- **Tale Forge Issues**: https://github.com/Jzineldin/image-wise-learn-62/issues

## Cost Summary

### Freepik API Costs (External)
- **Premium+ Subscription**: €36/month
- **Unlimited Image Generation**: Gemini 2.5 Flash (10,000 RPD)
- **Unlimited Video Generation**: Wan 2.2 (480p) + Hailuo 2 (768p)
- **Per-Image API Cost**: €0 (included in subscription)
- **Per-Video API Cost**: €0 (included in subscription)

### Tale Forge Credit Costs (Internal)
- **Image Generation**: 1 credit per image (all providers)
- **Video Generation**: TBD (to be determined)
- **Text Generation**: Free (0 credits)

### Estimated Usage
- **Images**: 1,000+ images/month at no extra API cost
- **Videos**: 1,000+ videos/month at no extra API cost
- **Total API Cost**: €36/month (fixed)

🎉 **You're all set!** Start generating images and videos for your story segments.

