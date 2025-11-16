# Integration Example: Adding Video Gating to VideoGenerationPanel

This guide shows you exactly how to integrate the new unified credits system into your existing video generation flow.

---

## Step 1: Add Imports

In `/src/components/story-viewer/VideoGenerationPanel.tsx`, add these imports at the top:

```typescript
// Add these imports
import { VideoGateModal } from '@/components/modals/VideoGateModal';
import { useEntitlementCheck } from '@/hooks/useEntitlementCheck';
import { useQuotas } from '@/hooks/useQuotas';
import { calculateVideoCredits } from '../../../shared/credit-costs';
```

## Step 2: Add Hooks and State

Inside the `VideoGenerationPanel` component, add these hooks:

```typescript
export const VideoGenerationPanel = ({
  segmentId,
  storyId,
  imageUrl,
  segmentContent,
  onVideoGenerated
}: VideoGenerationPanelProps) => {
  const { toast } = useToast();

  // NEW: Add these hooks
  const { checkEntitlement } = useEntitlementCheck();
  const { creditBalance, isSubscriber, refreshQuotas } = useQuotas();
  const [showVideoGate, setShowVideoGate] = useState(false);

  // Existing state
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  // ... rest of existing state
```

## Step 3: Modify the `generateVideo` Function

Replace the existing `generateVideo` function with this version that includes pre-flight checks:

```typescript
const generateVideo = async () => {
  try {
    // NEW: Pre-flight entitlement check
    const videoCost = calculateVideoCredits(); // 30 credits
    const entitlement = await checkEntitlement('video');

    if (!entitlement.allowed) {
      // Show gate modal instead of spinning
      setShowVideoGate(true);
      logger.info('Video generation gated', {
        segmentId,
        reason: entitlement.reason,
        creditsRequired: videoCost,
        creditsAvailable: creditBalance,
        operation: 'video-generation-gated'
      });
      return; // Don't proceed with generation
    }

    // Existing generation code
    setStatus('generating');
    setError(null);
    setProgress(0);

    logger.info('Starting video generation', {
      segmentId,
      storyId,
      creditsSpent: videoCost,
      operation: 'video-generation-start'
    });

    // Call the Edge Function to generate video (using v2 endpoint)
    const { data, error: functionError } = await supabase.functions.invoke(
      'generate-video-v2',
      {
        body: {
          segment_id: segmentId,
          imageUrl: imageUrl,
          prompt: segmentContent.slice(0, 200),
          includeNarration: false
        }
      }
    );

    if (functionError) {
      const errorMsg = functionError instanceof Error
        ? functionError.message
        : JSON.stringify(functionError);

      logger.error('Edge Function error', functionError, {
        segmentId,
        errorMessage: errorMsg,
        operation: 'video-generation-function-error'
      });

      throw new Error(`Video generation service error: ${errorMsg}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to generate video');
    }

    if (data.video_url) {
      setVideoUrl(data.video_url);
      setStatus('completed');
      setProgress(100);

      // NEW: Refresh quotas to update UI
      refreshQuotas();

      logger.info('Video generation completed', {
        segmentId,
        videoUrl: data.video_url,
        taskId: data.task_id,
        operation: 'video-generation-success'
      });

      toast({
        title: 'Video Generated!',
        description: 'Your video is ready to watch.',
        variant: 'default'
      });

      if (onVideoGenerated) {
        onVideoGenerated(data.video_url);
      }
    }
    // ... rest of existing code
  } catch (error) {
    // Existing error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    setError(errorMessage);
    setStatus('failed');

    logger.error('Video generation failed', error, {
      segmentId,
      errorMessage,
      operation: 'video-generation-error'
    });

    toast({
      title: 'Video Generation Failed',
      description: errorMessage,
      variant: 'destructive'
    });
  }
};
```

## Step 4: Add the Gate Modal to the Render

At the bottom of your component's return statement, add the VideoGateModal:

```typescript
return (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Film className="w-5 h-5" />
        Video Generation
      </CardTitle>
      <CardDescription>
        Turn your chapter into an animated video
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      {/* Existing content */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Generate Video</p>
          <p className="text-xs text-muted-foreground">
            Cost: {calculateVideoCredits()} credits
          </p>
        </div>
        <Button
          onClick={generateVideo}
          disabled={status === 'generating' || status === 'polling'}
          size="sm"
        >
          {status === 'generating' || status === 'polling' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Film className="w-4 h-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </div>

      {/* Show progress, video player, etc. - existing code */}

      {/* NEW: Add the VideoGateModal */}
      <VideoGateModal
        open={showVideoGate}
        onClose={() => setShowVideoGate(false)}
        currentBalance={creditBalance}
        isSubscriber={isSubscriber}
      />
    </CardContent>
  </Card>
);
```

---

## Complete File Example

Here's what the complete modified file should look like:

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Film, Loader2, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

// NEW IMPORTS
import { VideoGateModal } from '@/components/modals/VideoGateModal';
import { useEntitlementCheck } from '@/hooks/useEntitlementCheck';
import { useQuotas } from '@/hooks/useQuotas';
import { calculateVideoCredits } from '../../../shared/credit-costs';

interface VideoGenerationPanelProps {
  segmentId: string;
  storyId: string;
  imageUrl: string;
  segmentContent: string;
  onVideoGenerated?: (videoUrl: string) => void;
}

type GenerationStatus = 'idle' | 'generating' | 'polling' | 'completed' | 'failed';

export const VideoGenerationPanel = ({
  segmentId,
  storyId,
  imageUrl,
  segmentContent,
  onVideoGenerated
}: VideoGenerationPanelProps) => {
  const { toast } = useToast();

  // NEW: Quota and entitlement hooks
  const { checkEntitlement } = useEntitlementCheck();
  const { creditBalance, isSubscriber, refreshQuotas } = useQuotas();
  const [showVideoGate, setShowVideoGate] = useState(false);

  // Existing state
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateVideo = async () => {
    try {
      // NEW: Pre-flight check
      const videoCost = calculateVideoCredits();
      const entitlement = await checkEntitlement('video');

      if (!entitlement.allowed) {
        setShowVideoGate(true);
        return;
      }

      // Rest of existing generation code...
      setStatus('generating');
      setError(null);
      setProgress(0);

      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-video-v2',
        {
          body: {
            segment_id: segmentId,
            imageUrl: imageUrl,
            prompt: segmentContent.slice(0, 200),
            includeNarration: false
          }
        }
      );

      if (functionError) {
        throw new Error(`Video generation service error`);
      }

      if (data.video_url) {
        setVideoUrl(data.video_url);
        setStatus('completed');
        setProgress(100);
        refreshQuotas(); // NEW: Update credit balance

        toast({
          title: 'Video Generated!',
          description: 'Your video is ready to watch.',
        });

        if (onVideoGenerated) {
          onVideoGenerated(data.video_url);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setStatus('failed');

      toast({
        title: 'Video Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          Video Generation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Generate Video</p>
            <p className="text-xs text-muted-foreground">
              Cost: {calculateVideoCredits()} credits
            </p>
          </div>
          <Button
            onClick={generateVideo}
            disabled={status === 'generating'}
            size="sm"
          >
            {status === 'generating' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Film className="w-4 h-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>
        </div>

        {/* Existing video player, progress, etc. */}

        {/* NEW: Gate modal */}
        <VideoGateModal
          open={showVideoGate}
          onClose={() => setShowVideoGate(false)}
          currentBalance={creditBalance}
          isSubscriber={isSubscriber}
        />
      </CardContent>
    </Card>
  );
};
```

---

## What This Does

### Before (Old Behavior):
1. User clicks "Generate Video"
2. Spinner shows
3. If user has no credits → spinner runs forever or fails silently
4. User has no idea what went wrong

### After (New Behavior):
1. User clicks "Generate Video"
2. **Pre-flight check** runs before API call
3. If user has insufficient credits:
   - VideoGateModal appears immediately
   - Shows exact cost (30 credits)
   - Shows current balance
   - Shows clear upgrade path with pricing
   - User can click "Upgrade" or "Maybe Later"
4. If user has sufficient credits:
   - Generation proceeds normally
   - Credits deducted on backend
   - Balance refreshes after completion

---

## Testing

1. **Test with 0 credits:**
   - Should show gate modal immediately
   - No spinner, no API call wasted

2. **Test with 50 credits:**
   - Should generate successfully (30 credits used)
   - Balance should update to 20 after completion

3. **Test as subscriber:**
   - Should generate if credits available
   - If no credits, shows "Monthly credits used" variant

---

## Next Steps

Apply the same pattern to:
1. ✅ Video generation (done above)
2. ⏳ TTS generation (use `FeatureGateModal` with `feature="tts"`)
3. ⏳ Animate Scene (use `FeatureGateModal` with `feature="animate"`)
4. ⏳ Chapter creation (use `ChapterLimitReachedModal`)

See **QUICK_START.md** for more examples!
