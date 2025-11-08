/**
 * Voice Generation Drawer
 *
 * Per-chapter voice/audio generation with settings:
 * - Voice/speaker selection
 * - Style options
 * - Speed control
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIClient } from '@/lib/api/ai-client';
import { logger } from '@/lib/logger';
import { Volume2, Play, Pause, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { CREDIT_COSTS } from '@/lib/constants/api-constants';

interface Chapter {
  id: string;
  segment_number: number;
  content: string;
  chapter_title?: string;
  audio_url?: string;
  voice_status: string;
  voice_config?: {
    speakerId?: string;
    style?: string;
    speed?: number;
  };
}

interface VoiceGenerationDrawerProps {
  open: boolean;
  onClose: () => void;
  chapter: Chapter;
  storyId: string;
  onSuccess: () => void;
}

// Available voices (ElevenLabs voices)
const AVAILABLE_VOICES = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria (Expressive)', language: 'en' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Narrator)', language: 'en' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Friendly)', language: 'en' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Strong)', language: 'en' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Enthusiastic)', language: 'en' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Rachel (Calm)', language: 'en' },
];

// Calculate word count for display purposes
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

// Flat rate audio credits per chapter
const calculateAudioCredits = (): number => {
  return CREDIT_COSTS.audioPerChapter;
};

export function VoiceGenerationDrawer({
  open,
  onClose,
  chapter,
  storyId,
  onSuccess,
}: VoiceGenerationDrawerProps) {
  const { toast } = useToast();
  const [voiceId, setVoiceId] = useState(
    chapter.voice_config?.speakerId || AVAILABLE_VOICES[0].id
  );
  const [speed, setSpeed] = useState(chapter.voice_config?.speed || 1.0);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const creditsRequired = calculateAudioCredits();
  const wordCount = countWords(chapter.content);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const handlePlayPreview = () => {
    if (!chapter.audio_url) {
      toast({
        title: 'No Voice Available',
        description: 'Generate a voice first to preview.',
        variant: 'default',
      });
      return;
    }

    if (audio && !audio.paused) {
      audio.pause();
      setPlaying(false);
    } else {
      const newAudio = new Audio(chapter.audio_url);
      newAudio.playbackRate = speed;

      newAudio.onended = () => setPlaying(false);
      newAudio.onerror = () => {
        setPlaying(false);
        toast({
          title: 'Playback Error',
          description: 'Failed to play audio.',
          variant: 'destructive',
        });
      };

      newAudio.play();
      setAudio(newAudio);
      setPlaying(true);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);

      logger.info('Generating voice for chapter', {
        chapterId: chapter.id,
        storyId,
        voiceId,
        speed,
        wordCount,
        creditsRequired,
      });

      // Track analytics
      if (window.gtag) {
        window.gtag('event', 'chapter_voice_generate_clicked', {
          story_id: storyId,
          chapter_id: chapter.id,
          chapter_number: chapter.segment_number,
          voice_id: voiceId,
          speed,
          credits_required: creditsRequired,
        });
      }

      // Update voice_status to queued
      await supabase
        .from('story_segments')
        .update({
          voice_status: 'queued',
          voice_config: {
            speakerId: voiceId,
            speed,
          },
        })
        .eq('id', chapter.id);

      // Call audio generation API
      const result = await AIClient.invoke('generate-story-audio', {
        text: chapter.content,
        segment_id: chapter.id,
        voice_id: voiceId,
        speed,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate voice');
      }

      // Update segment with audio URL and status
      await supabase
        .from('story_segments')
        .update({
          audio_url: result.data.audio_url,
          voice_status: 'ready',
          audio_generation_status: 'completed',
        })
        .eq('id', chapter.id);

      // Track success
      if (window.gtag) {
        window.gtag('event', 'chapter_voice_status_ready', {
          story_id: storyId,
          chapter_id: chapter.id,
          chapter_number: chapter.segment_number,
        });
      }

      toast({
        title: 'Voice Generated!',
        description: `Chapter ${chapter.segment_number} now has voice narration.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      logger.error('Failed to generate voice', error);

      // Update status to failed with error
      await supabase
        .from('story_segments')
        .update({
          voice_status: 'failed',
          voice_error: error.message || 'Unknown error',
        })
        .eq('id', chapter.id);

      // Track failure
      if (window.gtag) {
        window.gtag('event', 'chapter_voice_status_failed', {
          story_id: storyId,
          chapter_id: chapter.id,
          chapter_number: chapter.segment_number,
          error: error.message,
        });
      }

      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate voice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRetry = async () => {
    // Same as generate, but track as retry
    if (window.gtag) {
      window.gtag('event', 'chapter_voice_retry_clicked', {
        story_id: storyId,
        chapter_id: chapter.id,
        chapter_number: chapter.segment_number,
      });
    }
    await handleGenerate();
  };

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg bg-[rgba(17,17,22,.95)] border-[rgba(242,181,68,.25)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-heading text-[#F4E3B2] flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            Generate Voice
          </SheetTitle>
          <SheetDescription className="text-[#C9C5D5]">
            Chapter {chapter.segment_number}
            {chapter.chapter_title && `: ${chapter.chapter_title}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Content Preview */}
          <div>
            <Label className="text-[#F4E3B2]">Chapter Content</Label>
            <div className="mt-2 p-4 rounded-lg bg-[rgba(17,17,22,.5)] border border-[rgba(242,181,68,.15)] max-h-32 overflow-y-auto">
              <p className="text-sm text-[#C9C5D5] line-clamp-6">{chapter.content}</p>
            </div>
            <p className="text-xs text-[#C9C5D5] mt-1">
              {wordCount} words • <span className="font-semibold text-primary">{creditsRequired} credits</span> to generate voice
            </p>
          </div>

          {/* Voice Selection */}
          <div>
            <Label htmlFor="voice" className="text-[#F4E3B2]">
              Voice / Speaker
            </Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger
                id="voice"
                className="mt-2 bg-[rgba(17,17,22,.5)] border-[rgba(242,181,68,.25)] text-[#F4E3B2]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(17,17,22,.95)] border-[rgba(242,181,68,.25)]">
                {AVAILABLE_VOICES.map((voice) => (
                  <SelectItem
                    key={voice.id}
                    value={voice.id}
                    className="text-[#F4E3B2] focus:bg-[rgba(242,181,68,.15)]"
                  >
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speed Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[#F4E3B2]">Speed</Label>
              <span className="text-sm text-[#C9C5D5]">{speed}x</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={(values) => setSpeed(values[0])}
              min={0.5}
              max={2.0}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-[#C9C5D5] mt-1">
              <span>0.5x (Slow)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Fast)</span>
            </div>
          </div>

          {/* Current Status */}
          {chapter.voice_status !== 'none' && chapter.voice_status !== 'failed' && (
            <div className="p-4 rounded-lg bg-[rgba(242,181,68,.08)] border border-[rgba(242,181,68,.2)]">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-[#F4E3B2] mb-1">Voice Status</h4>
                  <p className="text-sm text-[#C9C5D5]">
                    {chapter.voice_status === 'ready'
                      ? 'Voice is already generated. Generating again will replace the existing voice.'
                      : chapter.voice_status === 'queued'
                      ? 'Voice generation is queued...'
                      : chapter.voice_status === 'processing'
                      ? 'Voice is being generated...'
                      : 'Unknown status'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {chapter.voice_status === 'failed' && chapter.voice_config && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-500 mb-1">Generation Failed</h4>
                  <p className="text-sm text-red-200/80">
                    {chapter.voice_config as any as string || 'An error occurred during voice generation.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {chapter.audio_url && (
              <Button
                variant="outline"
                onClick={handlePlayPreview}
                disabled={generating}
                className="flex-1"
              >
                {playing ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={chapter.voice_status === 'failed' ? handleRetry : handleGenerate}
              disabled={generating}
              className="flex-1 bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : chapter.voice_status === 'failed' ? (
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
            Voice generation uses your credit balance. Each chapter costs {CREDIT_COSTS.audioPerChapter} credits.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
