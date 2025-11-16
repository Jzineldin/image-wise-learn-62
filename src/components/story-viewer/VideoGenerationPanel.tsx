import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Film, Loader2, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
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

  // Quota and entitlement hooks
  const { checkEntitlement } = useEntitlementCheck();
  const { creditBalance, isSubscriber, refreshQuotas } = useQuotas();
  const [showVideoGate, setShowVideoGate] = useState(false);

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const videoCost = calculateVideoCredits(); // 30 credits

  const generateVideo = async () => {
    try {
      // Pre-flight entitlement check
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
            prompt: segmentContent.slice(0, 200), // Use first 200 chars as motion prompt
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

        // Refresh quotas to update UI
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
      } else {
        throw new Error('Video generation did not complete');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate video';
      setError(errorMessage);
      setStatus('failed');

      logger.error('Video generation failed', err, {
        segmentId,
        operation: 'video-generation-error'
      });

      toast({
        title: 'Video Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setError(null);
    setProgress(0);
    setVideoUrl(null);
    setTaskId(null);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-primary" />
            <CardTitle>Generate Video</CardTitle>
          </div>
          {status === 'completed' && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          )}
          {status === 'failed' && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Failed
            </Badge>
          )}
        </div>
        <CardDescription>
          Create an animated video from this story scene
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(status === 'generating' || status === 'polling') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {status === 'generating' ? 'Generating video...' : 'Processing video...'}
              </span>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Video Preview */}
        {videoUrl && status === 'completed' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Your Video</p>
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg bg-black aspect-video object-contain"
            />
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Play className="w-4 h-4" />
              Open in new tab
            </a>
          </div>
        )}

        {/* Error Message */}
        {error && status === 'failed' && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Credit Info */}
        <div className="p-3 rounded-lg bg-background/50 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{videoCost} credits</span> will be deducted for video generation
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {status === 'idle' && (
            <Button
              onClick={generateVideo}
              className="w-full"
              variant="default"
            >
              <Film className="w-4 h-4 mr-2" />
              Generate Video
            </Button>
          )}

          {(status === 'generating' || status === 'polling') && (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </Button>
          )}

          {status === 'failed' && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          )}

          {status === 'completed' && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full"
            >
              Generate Another
            </Button>
          )}
        </div>

        {/* Info Message */}
        {status === 'idle' && (
          <p className="text-xs text-muted-foreground text-center">
            Generate an animated video from this story scene. This may take a minute.
          </p>
        )}

        {/* Video Gate Modal */}
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

