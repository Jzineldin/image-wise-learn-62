/**
 * Animation/Video Generation Drawer
 *
 * Per-chapter video/animation generation with settings:
 * - Prompt/description (optional, uses image if available)
 * - Duration control
 * - Seed for reproducibility
 * - Preview and generation
 */

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { CREDIT_COSTS } from '@/lib/constants/api-constants';
import { Video, Play, Loader2, Sparkles, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface Chapter {
  id: string;
  segment_number: number;
  content: string;
  chapter_title?: string;
  image_url?: string;
  video_url?: string;
  animation_status: string;
  animation_config?: {
    prompt?: string;
    durationSec?: number;
    seed?: number;
  };
  animation_error?: string;
}

interface AnimationGenerationDrawerProps {
  open: boolean;
  onClose: () => void;
  chapter: Chapter;
  storyId: string;
  onSuccess: () => void;
}

// Calculate video credits based on duration
const calculateVideoCredits = (durationSec: number): number => {
  if (durationSec <= 8) {
    return CREDIT_COSTS.videoShort; // 5 credits for short videos (≤8s)
  } else if (durationSec <= 15) {
    return CREDIT_COSTS.videoMedium; // 8 credits for medium videos (9-15s)
  } else {
    return CREDIT_COSTS.videoLong; // 12 credits for long videos (16-30s)
  }
};

export function AnimationGenerationDrawer({
  open,
  onClose,
  chapter,
  storyId,
  onSuccess,
}: AnimationGenerationDrawerProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(
    chapter.animation_config?.prompt || ''
  );
  const [duration, setDuration] = useState(
    chapter.animation_config?.durationSec || 5
  );
  const [seed, setSeed] = useState<string>(
    chapter.animation_config?.seed?.toString() || ''
  );
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Calculate credits required based on duration
  const creditsRequired = calculateVideoCredits(duration);

  // Subscribe to job status updates
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel('video_job_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_generation_jobs',
          filter: `id=eq.${jobId}`,
        },
        async (payload) => {
          const job = payload.new as any;
          logger.info('Video job status update', { jobId, status: job.status });

          if (job.status === 'completed' && job.video_url) {
            // Update segment with video
            await supabase
              .from('story_segments')
              .update({
                video_url: job.video_url,
                animation_status: 'ready',
                video_generation_status: 'completed',
              })
              .eq('id', chapter.id);

            // Track success
            if (window.gtag) {
              window.gtag('event', 'chapter_animation_status_ready', {
                story_id: storyId,
                chapter_id: chapter.id,
                chapter_number: chapter.segment_number,
              });
            }

            toast({
              title: 'Animation Ready!',
              description: `Chapter ${chapter.segment_number} animation is complete.`,
            });

            setGenerating(false);
            onSuccess();
            onClose();
          } else if (job.status === 'failed') {
            // Update segment status
            await supabase
              .from('story_segments')
              .update({
                animation_status: 'failed',
                animation_error: job.error_message || 'Generation failed',
              })
              .eq('id', chapter.id);

            // Track failure
            if (window.gtag) {
              window.gtag('event', 'chapter_animation_status_failed', {
                story_id: storyId,
                chapter_id: chapter.id,
                chapter_number: chapter.segment_number,
                error: job.error_message,
              });
            }

            toast({
              title: 'Animation Failed',
              description: job.error_message || 'Failed to generate animation.',
              variant: 'destructive',
            });

            setGenerating(false);
          } else if (job.status === 'processing') {
            // Show progress
            setProgress(50); // Approximate progress
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, chapter.id, storyId, onSuccess, onClose, toast]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setProgress(10);

      logger.info('Generating animation for chapter', {
        chapterId: chapter.id,
        storyId,
        prompt: prompt || 'Using image',
        duration,
        seed: seed || 'random',
      });

      // Track analytics
      if (window.gtag) {
        window.gtag('event', 'chapter_animation_generate_clicked', {
          story_id: storyId,
          chapter_id: chapter.id,
          chapter_number: chapter.segment_number,
          duration,
          has_prompt: !!prompt,
          has_seed: !!seed,
        });
      }

      if (!chapter.image_url && !prompt) {
        throw new Error('Chapter needs either an image or a prompt to generate video');
      }

      // Update animation_status to queued
      await supabase
        .from('story_segments')
        .update({
          animation_status: 'queued',
          animation_config: {
            prompt: prompt || undefined,
            durationSec: duration,
            seed: seed ? parseInt(seed) : undefined,
          },
        })
        .eq('id', chapter.id);

      // Create video generation job
      const { data: job, error: jobError } = await supabase
        .from('video_generation_jobs')
        .insert({
          segment_id: chapter.id,
          image_url: chapter.image_url || '',
          prompt: prompt || `Animate this story scene: ${chapter.content.substring(0, 200)}`,
          include_narration: false,
          status: 'pending',
        })
        .select()
        .single();

      if (jobError || !job) {
        throw jobError || new Error('Failed to create video job');
      }

      setJobId(job.id);
      setProgress(20);

      // Call async video generation function
      const { error: generateError } = await supabase.functions.invoke(
        'generate-video-async',
        {
          body: {
            job_id: job.id,
            segment_id: chapter.id,
            image_url: chapter.image_url,
            prompt: prompt || undefined,
            duration_sec: duration,
            seed: seed ? parseInt(seed) : undefined,
          },
        }
      );

      if (generateError) {
        throw generateError;
      }

      setProgress(30);

      toast({
        title: 'Animation Queued',
        description: 'Your animation is being generated. This may take a few minutes.',
      });

      // Don't close drawer yet - wait for job completion via subscription
    } catch (error: any) {
      logger.error('Failed to generate animation', error);

      // Update status to failed
      await supabase
        .from('story_segments')
        .update({
          animation_status: 'failed',
          animation_error: error.message || 'Unknown error',
        })
        .eq('id', chapter.id);

      // Track failure
      if (window.gtag) {
        window.gtag('event', 'chapter_animation_status_failed', {
          story_id: storyId,
          chapter_id: chapter.id,
          chapter_number: chapter.segment_number,
          error: error.message,
        });
      }

      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to start animation generation.',
        variant: 'destructive',
      });

      setGenerating(false);
      setProgress(0);
    }
  };

  const handleRetry = async () => {
    // Same as generate, but track as retry
    if (window.gtag) {
      window.gtag('event', 'chapter_animation_retry_clicked', {
        story_id: storyId,
        chapter_id: chapter.id,
        chapter_number: chapter.segment_number,
      });
    }
    await handleGenerate();
  };

  return (
    <Sheet open={open} onOpenChange={(open) => !open && !generating && onClose()}>
      <SheetContent className="sm:max-w-lg bg-[rgba(17,17,22,.95)] border-[rgba(242,181,68,.25)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-heading text-[#F4E3B2] flex items-center gap-2">
            <Video className="w-6 h-6" />
            Generate Animation
          </SheetTitle>
          <SheetDescription className="text-[#C9C5D5]">
            Chapter {chapter.segment_number}
            {chapter.chapter_title && `: ${chapter.chapter_title}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Image Preview */}
          {chapter.image_url && (
            <div>
              <Label className="text-[#F4E3B2]">Source Image</Label>
              <div className="mt-2 rounded-lg overflow-hidden border border-[rgba(242,181,68,.15)]">
                <img
                  src={chapter.image_url}
                  alt="Chapter"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          )}

          {/* Prompt (Optional) */}
          <div>
            <Label htmlFor="prompt" className="text-[#F4E3B2]">
              Prompt / Description (Optional)
            </Label>
            <Textarea
              id="prompt"
              placeholder="Describe the animation you want... (Leave empty to use the chapter image)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-2 bg-[rgba(17,17,22,.5)] border-[rgba(242,181,68,.25)] text-[#F4E3B2] resize-none"
              disabled={generating}
            />
            <p className="text-xs text-[#C9C5D5] mt-1">
              {chapter.image_url
                ? 'Leave empty to animate the existing chapter image'
                : 'Prompt is required since this chapter has no image'}
            </p>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[#F4E3B2]">Duration</Label>
              <span className="text-sm font-semibold text-primary">{duration}s • {creditsRequired} credits</span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={(values) => setDuration(values[0])}
              min={5}
              max={30}
              step={1}
              className="mt-2"
              disabled={generating}
            />
            <div className="flex justify-between text-xs text-[#C9C5D5] mt-1">
              <span>5s ({CREDIT_COSTS.videoShort} cr)</span>
              <span>15s ({CREDIT_COSTS.videoMedium} cr)</span>
              <span>30s ({CREDIT_COSTS.videoLong} cr)</span>
            </div>
          </div>

          {/* Seed (Advanced) */}
          <div>
            <Label htmlFor="seed" className="text-[#F4E3B2]">
              Seed (Optional, Advanced)
            </Label>
            <Input
              id="seed"
              type="number"
              placeholder="Random seed for reproducibility"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="mt-2 bg-[rgba(17,17,22,.5)] border-[rgba(242,181,68,.25)] text-[#F4E3B2]"
              disabled={generating}
            />
            <p className="text-xs text-[#C9C5D5] mt-1">
              Use the same seed to reproduce the same animation
            </p>
          </div>

          {/* Progress Bar */}
          {generating && progress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#F4E3B2]">Generating...</Label>
                <span className="text-sm text-[#C9C5D5]">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[rgba(17,17,22,.5)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Current Status */}
          {chapter.animation_status !== 'none' && chapter.animation_status !== 'failed' && !generating && (
            <div className="p-4 rounded-lg bg-[rgba(242,181,68,.08)] border border-[rgba(242,181,68,.2)]">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-[#F4E3B2] mb-1">Animation Status</h4>
                  <p className="text-sm text-[#C9C5D5]">
                    {chapter.animation_status === 'ready'
                      ? 'Animation is already generated. Generating again will replace the existing animation.'
                      : chapter.animation_status === 'queued'
                      ? 'Animation generation is queued...'
                      : chapter.animation_status === 'processing'
                      ? 'Animation is being generated...'
                      : 'Unknown status'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {chapter.animation_status === 'failed' && chapter.animation_error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-500 mb-1">Generation Failed</h4>
                  <p className="text-sm text-red-200/80">
                    {chapter.animation_error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {chapter.video_url && !generating && (
              <Button
                variant="outline"
                onClick={() => window.open(chapter.video_url, '_blank')}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Preview Video
              </Button>
            )}

            <Button
              onClick={chapter.animation_status === 'failed' ? handleRetry : handleGenerate}
              disabled={generating || (!chapter.image_url && !prompt)}
              className="flex-1 bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : chapter.animation_status === 'failed' ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Retry
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate ({creditsRequired} credits)
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-[#C9C5D5] text-center italic">
            Video generation costs <span className="font-semibold text-primary">{creditsRequired} credits</span> for {duration}s duration and may take 2-5 minutes to complete.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
