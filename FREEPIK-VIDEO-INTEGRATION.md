# Freepik Video Generation Integration

## Overview

This document describes the integration of Freepik API video generation into Tale Forge. The implementation adds unlimited video generation capabilities for story segments using Freepik's Premium+ subscription.

## Subscription Details

**Premium+ Plan (36 EUR/month)**
- ✅ Unlimited image generation with all models
- ✅ **Unlimited video generation with Wan 2.2 (480p) and Hailuo 2 (512p)**
- ✅ 45,000 AI credits/month for other generations

## Video Generation Strategy

### Primary Provider: Freepik Hailuo 2 (768p)
- **Resolution**: 768p (closest to 512p mentioned in subscription)
- **Quality**: Higher quality than Wan 2.2
- **Cost**: FREE (unlimited)
- **Use Case**: Main story segment animations

### Fallback Provider: Freepik Wan v2.2 (480p)
- **Resolution**: 480p
- **Quality**: Lower quality but still good
- **Cost**: FREE (unlimited)
- **Use Case**: Fallback if Hailuo 2 fails

## Architecture

### Database Schema

**New fields in `story_segments` table:**
```sql
- video_url: TEXT                    -- URL of generated video
- video_provider: TEXT                -- Provider used (freepik_hailuo, freepik_wan)
- video_generation_status: TEXT      -- Status: pending, processing, completed, failed
- video_task_id: TEXT                 -- Freepik API task ID for polling
```

**New fields in `stories` table:**
```sql
- full_story_video_url: TEXT         -- URL of complete story video (future feature)
- full_story_video_status: TEXT      -- Status of full story video generation
```

### Services

#### 1. FreepikVideoService (`supabase/functions/_shared/freepik-video-service.ts`)

Core service for video generation:

```typescript
interface VideoRequest {
  imageUrl: string;
  prompt?: string;
  duration?: number;
}

interface VideoResponse {
  videoUrl?: string;
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  provider: string;
  resolution: string;
  success: boolean;
  error?: string;
}
```

**Key Methods:**
- `generateVideo(request)` - Initiate video generation
- `pollVideoStatus(taskId, provider)` - Poll until completion
- `getVideoStatus(taskId, provider)` - Check status once

#### 2. Edge Functions

**`generate-story-video`** - Initiate video generation
- Input: `segment_id`, `story_id`, `image_url`, `prompt?`, `wait_for_completion?`
- Output: `task_id`, `provider`, `status`
- Behavior:
  - If `wait_for_completion=false`: Returns immediately with task_id (202 Accepted)
  - If `wait_for_completion=true`: Polls until complete (200 OK with video_url)

**`check-video-status`** - Check video generation status
- Input: `task_id`, `provider`, `segment_id?`, `update_database?`
- Output: `status`, `video_url?`, `error?`
- Behavior: Checks status and optionally updates database

### Frontend Integration

#### AI Client Methods

```typescript
// Generate video for a segment
AIClient.generateStoryVideo({
  segmentId: 'uuid',
  storyId: 'uuid',
  imageUrl: 'https://...',
  prompt: 'optional motion description',
  waitForCompletion: false // or true to wait
});

// Check video status
AIClient.checkVideoStatus({
  taskId: 'task-id-from-generation',
  provider: 'freepik_hailuo',
  segmentId: 'uuid',
  updateDatabase: true
});
```

## Implementation Phases

### ✅ Phase 2A: Database Schema (COMPLETED)
- Added video fields to `story_segments` table
- Added full story video fields to `stories` table
- Created migration: `20250115000000_add_video_support.sql`

### ✅ Phase 2B: Video Service (COMPLETED)
- Created `FreepikVideoService` class
- Implemented provider abstraction
- Added polling and status checking
- File: `supabase/functions/_shared/freepik-video-service.ts`

### ✅ Phase 2C: Edge Functions (COMPLETED)
- Created `generate-story-video` function
- Created `check-video-status` function
- Added authentication and authorization
- Added database updates

### ✅ Phase 2D: TypeScript Types (COMPLETED)
- Updated `StorySegment` interface with video fields
- Added AI Client methods for video generation

### 🔄 Phase 2E: UI Components (NEXT)
- Add video player component to `StorySegmentDisplay`
- Add "Generate Video" button
- Add video loading states
- Add video playback controls

### 🔄 Phase 2F: Automatic Video Generation (FUTURE)
- Option to auto-generate videos after image generation
- Background job to process pending videos
- Webhook support for async completion

## Usage Examples

### Example 1: Generate Video After Image

```typescript
// After image is generated for a segment
const imageResult = await AIClient.generateStoryImage({...});

// Generate video from the image
const videoResult = await AIClient.generateStoryVideo({
  segmentId: segment.id,
  storyId: story.id,
  imageUrl: imageResult.image_url,
  waitForCompletion: false
});

// Poll for completion
const checkStatus = async () => {
  const status = await AIClient.checkVideoStatus({
    taskId: videoResult.task_id,
    provider: videoResult.provider,
    segmentId: segment.id,
    updateDatabase: true
  });
  
  if (status.status === 'completed') {
    console.log('Video ready:', status.video_url);
  } else if (status.status === 'processing') {
    setTimeout(checkStatus, 5000); // Check again in 5 seconds
  }
};

checkStatus();
```

### Example 2: Generate and Wait

```typescript
// Generate video and wait for completion (blocks for up to 5 minutes)
const videoResult = await AIClient.generateStoryVideo({
  segmentId: segment.id,
  storyId: story.id,
  imageUrl: segment.image_url,
  waitForCompletion: true
});

if (videoResult.success) {
  console.log('Video ready:', videoResult.video_url);
}
```

## Environment Variables

Add to your `.env` file:

```bash
FREEPIK_API_KEY=your_freepik_api_key_here
```

Get your API key from: https://www.freepik.com/developers/dashboard/api-key

## API Rate Limits

According to Freepik documentation:

| Model | Free RPD | Premium RPD |
|-------|----------|-------------|
| MiniMax-Hailuo2-768p | 20 | 288 |
| MiniMax-Hailuo2-1080p | 11 | 288 |
| Wan v2.2 (all resolutions) | Not listed | **Unlimited** |

**Note**: Your Premium+ subscription includes **unlimited** Wan 2.2 (480p) and Hailuo 2 (512p). The 288 RPD limit may apply to higher resolutions (1080p).

## Cost Analysis

### Per-Segment Video Generation
- **Cost**: FREE (unlimited with Premium+ subscription)
- **Time**: ~30-60 seconds per video
- **Quality**: 480p-768p resolution

### Estimated Usage
- **10 segments per story** = 10 videos
- **100 stories per month** = 1,000 videos
- **Total cost**: €0 (included in €36/month subscription)

## Next Steps

1. **Run Database Migration**
   ```bash
   supabase db push
   ```

2. **Set Environment Variable**
   ```bash
   # In Supabase Dashboard > Settings > Edge Functions
   FREEPIK_API_KEY=your_key_here
   ```

3. **Deploy Edge Functions**
   ```bash
   supabase functions deploy generate-story-video
   supabase functions deploy check-video-status
   ```

4. **Update UI Components** (See Phase 2E)
   - Add video player to `StorySegmentDisplay.tsx`
   - Add "Generate Video" button
   - Add loading states

5. **Test Video Generation**
   - Generate a story with images
   - Click "Generate Video" on a segment
   - Verify video appears after generation

## Troubleshooting

### Video Generation Fails
- Check FREEPIK_API_KEY is set correctly
- Verify image URL is publicly accessible
- Check Freepik API status: https://status.freepik.com

### Video Takes Too Long
- Default timeout is 5 minutes for polling
- Freepik typically generates videos in 30-60 seconds
- If timeout occurs, use `check-video-status` to poll manually

### Database Not Updating
- Verify `update_database: true` in status check
- Check segment_id is correct
- Review Edge Function logs in Supabase Dashboard

## Future Enhancements

1. **Full Story Video** - Combine all segment videos into one complete story video
2. **Video Editing** - Add transitions, music, narration
3. **Custom Motion Prompts** - Allow users to specify motion/animation style
4. **Video Thumbnails** - Generate preview thumbnails for videos
5. **Download Videos** - Allow users to download videos locally
6. **Social Sharing** - Share videos directly to social media

## References

- [Freepik API Documentation](https://docs.freepik.com)
- [Freepik Video Generation](https://docs.freepik.com/api-reference/image-to-video)
- [Premium+ Subscription](https://www.freepik.com/developers/dashboard/billing)

