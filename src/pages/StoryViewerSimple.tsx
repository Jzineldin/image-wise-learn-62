/**
 * Simplified Story Viewer
 *
 * Based on copy-of-tale-forge design:
 * - Clean 2-column layout (image | text)
 * - Simple navigation (prev/next)
 * - Choice selection
 * - Optional image generation
 * - Minimal clutter
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AIClient, InsufficientCreditsError } from '@/lib/api/ai-client';
import InsufficientCreditsDialog from '@/components/InsufficientCreditsDialog';
import { calculateAudioCredits, CREDIT_COSTS } from '../../shared/credit-costs';
import { Home, ChevronLeft, ChevronRight, Sparkles, Loader2, Volume2, Video, Play, Pause, FileDown, Share2 } from 'lucide-react';
import { logger, generateRequestId } from '@/lib/utils/debug';
import { normalizeAgeGroup } from '@/lib/utils/age-group';
import HeroBackground from '@/components/HeroBackground';
import Navigation from '@/components/Navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { playNarration, AudioController } from '@/lib/utils/audioUtils';
import { EndStoryDialog } from '@/components/story-viewer/EndStoryDialog';
import { CreditCostPreview } from '@/components/story-viewer/CreditCostPreview';
import { useChapterLimits } from '@/hooks/useChapterLimits';
import { ChapterLimitReachedModal } from '@/components/modals/ChapterLimitReachedModal';
import { exportStoryToPDF } from '@/lib/pdf-export-improved';
import { StoryMetaTags } from '@/components/StoryMetaTags';

interface StorySegment {
  id: string;
  segment_number: number;
  content: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  choices: Array<{
    id: number;
    text: string;
    impact?: string;
  }>;
  is_ending?: boolean;
}

interface Story {
  id: string;
  title: string;
  genre: string;
  age_group: string;
  status: string;
  user_id: string;
  visibility?: string;
  metadata?: {
    childName?: string;
    character?: string;
  };
}

export default function StoryViewerSimple() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Credit lock to prevent concurrent operations
  const creditLock = useRef(false);

  // Core state
  const [story, setStory] = useState<Story | null>(null);
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pollTries, setPollTries] = useState(0);

  // Generation state
  const [isGeneratingChoice, setIsGeneratingChoice] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoRetryCount, setVideoRetryCount] = useState(0);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditError, setCreditError] = useState<{ required: number; available: number } | null>(null);
  const [showEndStoryDialog, setShowEndStoryDialog] = useState(false);
  const [showChapterLimitReached, setShowChapterLimitReached] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Chapter limits hook
  const { refetchLimits, chapterStatus, hoursUntilReset } = useChapterLimits();

  // Async video generation state
  const [activeVideoJobs, setActiveVideoJobs] = useState<Set<string>>(new Set());

  // Load story and segments
  useEffect(() => {
    if (!id) return;
    loadStory();
  }, [id]);

  // Subscribe to video generation job updates via Realtime
  // Listen to ALL jobs - subscription never restarts during the story session
  useEffect(() => {
    if (!story?.id) return;

    logger.info('Setting up Realtime subscription for all video jobs', {
      storyId: story.id
    });

    // Subscribe to ALL video generation job updates (no segment filter)
    // This way, adding new segments won't restart the subscription
    const channel = supabase
      .channel(`video-gen-story-${story.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_generation_jobs'
          // No filter - we'll filter in the callback
        },
        (payload) => {
          const job = payload.new as any;
          const jobSegmentId = job.segment_id;

          logger.info('Video job status update received', {
            jobId: job.id,
            status: job.status,
            segmentId: jobSegmentId
          });

          if (job.status === 'completed' && job.video_url) {
            // Check if this segment belongs to our story
            setSegments(prev => {
              const isOurSegment = prev.some(s => s.id === jobSegmentId);

              if (isOurSegment) {
                // Remove from active jobs
                setActiveVideoJobs(prevJobs => {
                  const next = new Set(prevJobs);
                  next.delete(jobSegmentId);
                  return next;
                });

                // Reload story from database to get persisted video_url
                logger.info('Video generation completed - reloading story from database', {
                  segmentId: jobSegmentId,
                  videoUrl: job.video_url
                });

                loadStory().then(() => {
                  // Show success notification after reload
                  toast({
                    title: 'Video Ready!',
                    description: 'Your video has been generated successfully.',
                  });

                  logger.info('Story reloaded after video generation', {
                    segmentId: jobSegmentId,
                  });
                });
              }

              return prev; // Don't update local state, will reload from DB
            });
          } else if (job.status === 'failed') {
            // Check if this job belongs to our story
            setSegments(prev => {
              const isOurSegment = prev.some(s => s.id === jobSegmentId);

              if (isOurSegment) {
                // Remove from active jobs
                setActiveVideoJobs(prevJobs => {
                  const next = new Set(prevJobs);
                  next.delete(jobSegmentId);
                  return next;
                });

                // Show error notification
                toast({
                  title: 'Video Generation Failed',
                  description: job.error_message || 'Please try again.',
                  variant: 'destructive',
                });

                logger.error('Video generation failed', {
                  segmentId: jobSegmentId,
                  error: job.error_message
                });
              }

              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      logger.info('Cleaning up Realtime subscription', {
        storyId: story.id
      });
      supabase.removeChannel(channel);
    };
  }, [story?.id, toast]);

  // Video retry mechanism using useEffect
  useEffect(() => {
    if (videoRetryCount > 0 && videoError) {
      logger.info('Clearing video error for retry', { retryCount: videoRetryCount });
      setVideoError(null);
    }
  }, [videoRetryCount, videoError]);

  // Poll for first segment if story exists but no segments yet (handles async write latency)
  useEffect(() => {
    if (!story) return;
    if (segments.length === 0 && pollTries < 20) {
      const t = setTimeout(async () => {
        try {
          const { data } = await supabase
            .from('story_segments')
            .select('id')
            .eq('story_id', story.id)
            .limit(1);
          if (data && data.length > 0) {
            const { data: segs } = await supabase
              .from('story_segments')
              .select('*')
              .eq('story_id', story.id)
              .order('segment_number', { ascending: true });
            setSegments((segs || []) as unknown as StorySegment[]);
          } else {
            setPollTries((n) => n + 1);
          }
        } catch {
          // ignore
        }
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [story, segments.length, pollTries]);

  const loadStory = async () => {
    try {
      setIsLoading(true);

      // Load story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (storyError) throw storyError;
      if (!storyData) throw new Error('Story not found');

      setStory(storyData as Story);

      // Load segments
      const { data: segmentData, error: segmentError } = await supabase
        .from('story_segments')
        .select('*')
        .eq('story_id', id)
        .order('segment_number', { ascending: true });

      if (segmentError) throw segmentError;

      setSegments((segmentData || []) as unknown as StorySegment[]);
    } catch (error: any) {
      logger.error('Failed to load story', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load story',
        variant: 'destructive',
      });
      navigate('/my-stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (choiceText: string) => {
    if (!story || !user) return;

    // Check credit lock
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Try again in a moment.",
        variant: "default",
      });
      return;
    }

    creditLock.current = true;
    setIsGeneratingChoice(true);

    try {
      const requestId = generateRequestId();
      const currentSegment = segments[currentIndex];
      const nextSegmentNumber = segments.length + 1;

      logger.info('Generating next segment', {
        storyId: story.id,
        choiceText,
        segmentNumber: nextSegmentNumber,
      });

      // Generate next segment with correct parameters
      const result = await AIClient.generateStorySegment({
        storyId: story.id,
        choiceId: 0, // Default choice ID
        choiceText,
        previousSegmentContent: currentSegment.content,
        storyContext: {
          genre: story.genre,
          ageGroup: normalizeAgeGroup(story.age_group),
          languageCode: 'en',
          characters: story.metadata?.character ? [{
            name: story.metadata.character,
            description: story.metadata.character,
            personality: '',
          }] : [],
        },
        segmentNumber: nextSegmentNumber,
        requestId,
      });

      if (!result.success || !result.data?.segment) {
        throw new Error('Failed to generate segment');
      }

      const newSegment = result.data.segment;

      // Add to segments and navigate to it
      setSegments(prev => [...prev, newSegment]);
      setCurrentIndex(segments.length);

      // Refresh chapter limits to update the counter
      refetchLimits();

      // Warn user if they're close to the limit (at 3/4 chapters)
      // Note: chapterStatus will update asynchronously after refetch
      setTimeout(() => {
        if (chapterStatus?.used === 3 && chapterStatus?.limit === 4) {
          toast({
            title: '⚠️ Last Free Chapter!',
            description: 'You have 1 chapter remaining today. Consider ending your story or upgrade for unlimited chapters.',
            duration: 7000,
          });
        } else {
          toast({
            title: 'Story Continues!',
            description: 'Your adventure unfolds...',
          });
        }
      }, 100);

    } catch (error: any) {
      logger.error('Choice generation failed', error);

      // Check if this is a daily limit error
      if (error.message?.includes('Daily chapter limit') || error.message?.includes('daily_limit_reached')) {
        await refetchLimits(); // Refresh to show 4/4
        setShowChapterLimitReached(true);
      } else if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.creditsRequired,
          available: error.creditsAvailable,
        });
        setShowInsufficientCredits(true);
      } else {
        // Clean up error messages for better UX
        let errorTitle = 'Generation Failed';
        let errorDescription = 'Failed to continue story. Please try again.';

        if (error.message?.includes('rate limit') || error.message?.includes('429')) {
          errorTitle = 'Service Temporarily Busy';
          errorDescription = 'Our AI service is handling many requests. Please wait a moment and try again.';
        } else if (error.message?.includes('quota') || error.message?.includes('accumulate')) {
          errorTitle = 'Service Temporarily Unavailable';
          errorDescription = 'AI service quota reached. This usually resolves quickly. Please try again in a moment.';
        } else if (error.message) {
          errorDescription = error.message;
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: 'destructive',
          duration: 6000,
        });
      }
    } finally {
      creditLock.current = false;
      setIsGeneratingChoice(false);
    }
  };

  const handleGenerateImage = async () => {
    const currentSegment = segments[currentIndex];
    if (!story || !currentSegment) return;

    // Check credit lock
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Try again in a moment.",
        variant: "default",
      });
      return;
    }

    creditLock.current = true;
    setIsGeneratingImage(true);

    try {
      const requestId = generateRequestId();

      const result = await AIClient.generateStoryImage({
        storyContent: currentSegment.content,
        storyTitle: story.title,
        ageGroup: normalizeAgeGroup(story.age_group),
        genre: story.genre,
        segmentNumber: currentSegment.segment_number,
        storyId: story.id,
        segmentId: currentSegment.id,
        characters: story.metadata?.character ? [{
          name: story.metadata.character,
          description: story.metadata.character,
          personality: '',
        }] : [],
        requestId,
      });

      if (result.success && result.data) {
        // The API might return image_url directly or nested
        const imageUrl = result.data.image_url || result.data.imageUrl || result.data.url;

        logger.info('Image generation response', {
          hasImageUrl: !!imageUrl,
          responseKeys: Object.keys(result.data),
          imageUrl
        });

        if (imageUrl) {
          logger.info('Image generation successful - reloading story from database', {
            segmentId: currentSegment.id,
          });

          // Reload story from database to get persisted image_url
          await loadStory();

          toast({
            title: 'Image Generated!',
            description: 'Your scene has been illustrated',
          });

          logger.info('Story reloaded after image generation', {
            segmentId: currentSegment.id,
          });
        } else {
          logger.error('Image URL not found in response', result.data);
          toast({
            title: 'Image Generated',
            description: 'But URL was not returned. Check console logs.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      logger.error('Image generation failed', error);

      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.creditsRequired,
          available: error.creditsAvailable,
        });
        setShowInsufficientCredits(true);
      } else {
        toast({
          title: 'Generation Failed',
          description: error.message || 'Failed to generate image',
          variant: 'destructive',
        });
      }
    } finally {
      creditLock.current = false;
      setIsGeneratingImage(false);
    }
  };

  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');
const [audioController, setAudioController] = useState<AudioController | null>(null);
const [isPlaying, setIsPlaying] = useState(false);

useEffect(() => {
  // Stop audio when switching chapters
  if (audioController) {
    audioController.stop();
    setIsPlaying(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentIndex]);

const handleGenerateAudio = async () => {
    const currentSegment = segments[currentIndex];
    if (!story || !currentSegment) return;

    // Check credit lock
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Try again in a moment.",
        variant: "default",
      });
      return;
    }

    creditLock.current = true;
    setIsGeneratingAudio(true);

    try {
      const requestId = generateRequestId();

      logger.info('Generating audio narration (V2 - Gemini TTS)', {
        segmentId: currentSegment.id,
        contentLength: currentSegment.content.length,
        videoUrlBefore: currentSegment.video_url ? 'EXISTS' : 'MISSING',
      });

      // Use V2 Google Gemini TTS
      const result = await AIClient.generateAudioV2({
        text: currentSegment.content,
        voiceId: selectedVoice,
        segment_id: currentSegment.id, // Pass segment ID for persistence
        story_id: story.id, // Pass story ID for full story audio
      });

      if (result.success && result.data) {
        const audioUrl = result.data.audio_url || result.data.audioUrl || result.data.url;

        logger.info('Audio generation response received', {
          hasAudioUrl: !!audioUrl,
          audioUrlLength: audioUrl?.length,
          resultData: result.data
        });

        if (audioUrl) {
          logger.info('Audio generation successful - reloading story from database', {
            segmentId: currentSegment.id,
            audioUrlPreview: audioUrl.substring(0, 50),
          });

          // Reload story from database to get persisted audio_url
          await loadStory();

          toast({
            title: 'Audio Generated!',
            description: 'Narration is ready to play',
          });

          logger.info('Story reloaded after audio generation', {
            segmentId: currentSegment.id,
          });
        } else {
          logger.warn('No audio URL in response', { resultData: result.data });
        }
      }
    } catch (error: any) {
      logger.error('Audio generation failed', error);

      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.creditsRequired,
          available: error.creditsAvailable,
        });
        setShowInsufficientCredits(true);
      } else {
        toast({
          title: 'Audio Generation Failed',
          description: error.message || 'Failed to generate narration',
          variant: 'destructive',
        });
      }
    } finally {
      creditLock.current = false;
      setIsGeneratingAudio(false);
    }
  };

  const handleGenerateVideo = useCallback(async () => {
    const currentSegment = segments[currentIndex];

    // Guard condition: Prevent re-running if already loading or job active
    if (isGeneratingVideo || activeVideoJobs.has(currentSegment?.id || '')) {
      logger.warn('Video generation skipped - already in progress', {
        isGeneratingVideo,
        hasActiveJob: activeVideoJobs.has(currentSegment?.id || '')
      });
      return;
    }

    // Set timeout to reset generating state after 5 minutes (failsafe)
    const timeoutId = setTimeout(() => {
      logger.warn('Video generation timeout - resetting state', {
        segmentId: currentSegment?.id
      });
      setIsGeneratingVideo(false);
      setActiveVideoJobs(prev => {
        const next = new Set(prev);
        next.delete(currentSegment?.id || '');
        return next;
      });
      setVideoError('Generation timed out. Please try again.');
    }, 5 * 60 * 1000); // 5 minutes

    // Check credit lock
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Try again in a moment.",
        variant: "default",
      });
      return;
    }

    // Clear any existing error when retrying
    if (videoError) {
      logger.info('Clearing previous video error for retry');
      setVideoError(null);
    }

    // Get current segment from state
    const segment = segments[currentIndex];

    if (!story || !segment || !segment.image_url) {
      toast({
        title: 'Image Required',
        description: 'Please generate an image first before creating a video',
        variant: 'destructive',
      });
      return;
    }

    creditLock.current = true;
    setIsGeneratingVideo(true);

    try {
      const requestId = generateRequestId();

      logger.info('Starting async video generation (V2 - Veo 3.1)', {
        segmentId: segment.id,
        imageUrl: segment.image_url,
      });

      // Use V2 Async Google Veo 3.1 for video animation
      const result = await AIClient.generateVideoAsync({
        segmentId: segment.id,
        imageUrl: segment.image_url,
        prompt: segment.content,
        includeNarration: false, // We'll add narration separately
      });

      if (result.success && result.data) {
        // Async mode - job started
        if (result.data.job_id) {
          // Add to active jobs
          setActiveVideoJobs(prev => new Set(prev).add(segment.id));

          toast({
            title: 'Generating Video',
            description: 'Your video is being generated in the background. You can continue reading your story.',
          });

          logger.info('Video generation job started', {
            jobId: result.data.job_id,
            segmentId: segment.id
          });
        }
        // Sync mode fallback - video URL returned immediately
        else {
          const videoUrl = result.data.video_url || result.data.videoUrl || result.data.url;

          if (videoUrl) {
            setSegments(prev => prev.map(seg =>
              seg.id === segment.id
                ? { ...seg, video_url: videoUrl }
                : seg
            ));

            toast({
              title: 'Video Generated!',
              description: 'Animation is ready to watch',
            });
          } else if (result.data.task_id) {
            toast({
              title: 'Video Processing',
              description: 'Your video is being created. It will appear shortly.',
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Video generation failed', error);

      // Set the error state to prevent infinite loops
      const errorMessage = error.message || 'Failed to generate animation';
      setVideoError(errorMessage);

      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.creditsRequired,
          available: error.creditsAvailable,
        });
        setShowInsufficientCredits(true);
      } else {
        toast({
          title: 'Video Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      creditLock.current = false;
      setIsGeneratingVideo(false);
    }
  }, [isGeneratingVideo, videoError, story, segments, currentIndex, toast, activeVideoJobs]);

  /**
   * Handle End Story button click
   * Opens dialog to confirm story ending
   */
  const handleEndStory = () => {
    const endingSegment = segments.find(s => s.is_ending);

    // If ending exists and has all media, mark as complete
    if (endingSegment && endingSegment.image_url && endingSegment.audio_url) {
      setShowEndStoryDialog(true);
      return;
    }

    // If ending exists but missing media, prompt user
    if (endingSegment) {
      toast({
        title: "Complete your ending",
        description: "Generate image and audio for the final segment before finishing your story.",
      });
      const endingIndex = segments.findIndex(s => s.is_ending);
      if (endingIndex >= 0) setCurrentIndex(endingIndex);
      return;
    }

    // No ending exists - show dialog to generate it
    setShowEndStoryDialog(true);
  };

  /**
   * Export story to PDF
   */
  const handleExportPDF = async () => {
    if (!story || segments.length === 0) {
      toast({
        title: 'Cannot Export',
        description: 'Story must have at least one segment to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingPDF(true);

    try {
      logger.info('Exporting story to PDF', {
        storyId: story.id,
        title: story.title,
        segmentCount: segments.length,
      });

      // Map segments to the format expected by the PDF export
      const pdfSegments = segments.map(seg => ({
        segment_number: seg.segment_number,
        content: seg.content,
        segment_text: seg.content, // Fallback field
        image_url: seg.image_url,
        chapter_title: undefined, // Add chapter_title if it exists in your schema
      }));

      await exportStoryToPDF(story.title, pdfSegments);

      toast({
        title: 'PDF Exported!',
        description: 'Your story has been downloaded as a PDF',
      });

      logger.info('PDF export completed successfully', {
        storyId: story.id,
        title: story.title,
      });
    } catch (error: any) {
      logger.error('PDF export failed', error);

      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  /**
   * Share story via Web Share API or clipboard
   */
  const handleShare = async () => {
    if (!story) return;

    // Check if story is public
    if (story.visibility !== 'public') {
      toast({
        title: 'Story is Private',
        description: 'Make your story public to share it with others.',
        variant: 'default',
      });
      return;
    }

    const shareUrl = `${window.location.origin}/story/${story.id}`;
    const shareText = `Check out my story "${story.title}" on Tale Forge!`;

    logger.info('Sharing story', {
      storyId: story.id,
      title: story.title,
      shareUrl,
    });

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: shareText,
          url: shareUrl,
        });

        toast({
          title: 'Shared!',
          description: 'Story shared successfully.',
        });

        logger.info('Story shared via Web Share API', {
          storyId: story.id,
        });
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          logger.error('Web Share API failed', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);

        toast({
          title: 'Link Copied!',
          description: 'Story link copied to clipboard.',
        });

        logger.info('Story link copied to clipboard', {
          storyId: story.id,
        });
      } catch (error) {
        logger.error('Clipboard copy failed', error);

        toast({
          title: 'Copy Failed',
          description: 'Could not copy link. Please copy manually: ' + shareUrl,
          variant: 'destructive',
        });
      }
    }
  };

  /**
   * Confirm and execute story ending
   * Either generates ending or marks story as complete
   */
  const handleConfirmEndStory = async () => {
    setShowEndStoryDialog(false);

    const endingSegment = segments.find(s => s.is_ending);

    // If ending already exists, mark story as completed
    if (endingSegment) {
      try {
        const { error } = await supabase
          .from('stories')
          .update({ status: 'completed' })
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Story Complete!",
          description: "Your adventure has been marked as finished.",
        });

        // Navigate to completion page
        navigate(`/story/${id}/complete`);
      } catch (error: any) {
        logger.error('Failed to mark story as complete', error);
        toast({
          title: 'Error',
          description: 'Failed to complete story. Please try again.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Generate ending segment
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress.",
        variant: "default",
      });
      return;
    }

    creditLock.current = true;
    setIsGeneratingChoice(true);

    try {
      logger.info('Generating story ending', { storyId: id });

      // Calculate the next segment number (segments are 1-indexed)
      const nextSegmentNumber = segments.length + 1;

      const result = await AIClient.generateStorySegment({
        storyId: id!,
        choiceId: 0, // Default choice ID for ending
        choiceText: 'THE_END',
        previousSegmentContent: segments.map(s => s.content).join('\n\n'),
        storyContext: {
          genre: story?.genre || 'Adventure',
          ageGroup: normalizeAgeGroup(story?.age_group || '7-9'),
          languageCode: 'en',
          characters: story?.metadata?.character ? [{
            name: story.metadata.character,
            description: story.metadata.character,
            personality: '',
          }] : [],
        },
        segmentNumber: nextSegmentNumber,
        requestId: `ending_${Date.now()}`,
      });

      if (result.success && result.data) {
        // Reload segments to get the new ending
        await loadStory();

        // Refresh chapter limits
        await refetchLimits();

        // Mark story as "ready" (content complete, ready for asset management)
        try {
          const { data: readyData, error: readyError } = await supabase
            .rpc('mark_story_ready', { story_uuid: id });

          if (readyError) {
            logger.error('Failed to mark story as ready', readyError as any);
            // Don't throw - story ending was generated successfully
          } else {
            logger.info('Story marked as ready', readyData as any);
          }
        } catch (err) {
          logger.error('Error updating story status to ready', err);
        }

        toast({
          title: 'Story Ready!',
          description: 'Your story content is complete. Now manage per-chapter assets before finalizing.',
        });

        // Navigate to Ready page for asset management
        navigate(`/story/${id}/ready`);
      }
    } catch (error: any) {
      logger.error('Failed to generate ending', error);

      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.creditsRequired,
          available: error.creditsAvailable,
        });
        setShowInsufficientCredits(true);
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to generate ending',
          variant: 'destructive',
        });
      }
    } finally {
      creditLock.current = false;
      setIsGeneratingChoice(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </>
    );
  }

  if (!story) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p>Story not found</p>
          <Button onClick={() => navigate('/my-stories')}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </>
    );
  }

  if (segments.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Preparing your story5</p>
        <p className="text-sm text-muted-foreground">This can take up to ~30 seconds. We'll load it as soon as it's ready.</p>
        <Button variant="outline" onClick={() => setPollTries(0)}>Refresh</Button>
        </div>
      </>
    );
  }

  const currentSegment = segments[currentIndex];
  const isEnding = currentSegment?.is_ending || false;
  const hasNextSegment = currentIndex < segments.length - 1;
  const hasPrevSegment = currentIndex > 0;

  return (
    <>
      {/* Dynamic Meta Tags for Social Media Sharing */}
      {story && segments.length > 0 && (
        <StoryMetaTags
          title={story.title}
          description={segments[0]?.content.substring(0, 200) + '...'}
          imageUrl={segments[0]?.image_url}
          storyUrl={`${window.location.origin}/story/${story.id}`}
        />
      )}

      <Navigation />
      <div className="min-h-screen relative">
        <HeroBackground />
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/my-stories')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{story.title}</h1>
              <p className="text-sm text-muted-foreground">
                Chapter {currentIndex + 1} of {segments.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="hidden sm:flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>

            {/* Export PDF Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="hidden sm:flex items-center gap-2"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={!hasPrevSegment}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={!hasNextSegment}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Left: Media (Image/Video) */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
              {currentSegment.video_url ? (
                <video
                  src={currentSegment.video_url}
                  controls
                  className="w-full h-full object-contain bg-black"
                  poster={currentSegment.image_url}
                >
                  Your browser does not support video playback.
                </video>
              ) : currentSegment.image_url ? (
                <img
                  src={currentSegment.image_url}
                  alt={`Scene ${currentSegment.segment_number}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                  <p className="text-muted-foreground text-center">No image yet</p>
                  <Button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Voice selection (Gemini TTS) */}
            <div className="bg-card/70 border rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Narration voice</span>
                </div>
                <Select value={selectedVoice} onValueChange={(v) => setSelectedVoice(v as any)}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kore">Kore (Warm)</SelectItem>
                    <SelectItem value="Puck">Puck (Bright)</SelectItem>
                    <SelectItem value="Charon">Charon (Deep)</SelectItem>
                    <SelectItem value="Fenrir">Fenrir (Bold)</SelectItem>
                    <SelectItem value="Zephyr">Zephyr (Soft)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Audio Player */}
            {currentSegment.audio_url && (
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (isPlaying && audioController) {
                          audioController.stop();
                          setIsPlaying(false);
                          setAudioController(null);
                          return;
                        }

                        if (!currentSegment.audio_url) {
                          toast({
                            title: 'No Audio',
                            description: 'Generate audio first to play narration',
                            variant: 'default',
                          });
                          return;
                        }

                        setIsPlaying(true);
                        const controller = await playNarration(currentSegment.audio_url);

                        controller.onEnded(() => {
                          setIsPlaying(false);
                          setAudioController(null);
                        });

                        setAudioController(controller);
                      } catch (error: any) {
                        logger.error('Audio playback failed', error);
                        setIsPlaying(false);
                        setAudioController(null);
                        toast({
                          title: 'Playback Failed',
                          description: error.message || 'Could not play audio. The audio format may be incompatible.',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play Narration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Background Video Generation Status */}
            {activeVideoJobs.has(currentSegment.id) && !currentSegment.video_url && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Video Generating in Background...
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      This usually takes about 1 minute. Feel free to continue reading your story!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Media Generation Buttons */}
            <div className="flex gap-2">
              {currentSegment.image_url && !currentSegment.video_url && (
                <div className="flex-1 space-y-1">
                  <Button
                    variant={videoError ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => {
                      logger.info('Video generation button clicked', { hasError: !!videoError });
                      handleGenerateVideo();
                      setVideoRetryCount((c) => c + 1);
                    }}
                    disabled={isGeneratingVideo || activeVideoJobs.has(currentSegment.id)}
                    className="w-full"
                  >
                    {isGeneratingVideo || activeVideoJobs.has(currentSegment.id) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating 8s...
                      </>
                    ) : videoError ? (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Retry Video (8s)
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Animate Scene (8s)
                      </>
                    )}
                  </Button>
                  <div className="flex justify-center">
                    <CreditCostPreview type="video" />
                  </div>
                </div>
              )}

              {!currentSegment.audio_url && (
                <div className="flex-1 space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio}
                    className="w-full"
                  >
                    {isGeneratingAudio ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Add Narration
                      </>
                    )}
                  </Button>
                  <div className="flex justify-center">
                    <CreditCostPreview 
                      type="audio" 
                      wordCount={currentSegment.content.trim().split(/\s+/).filter(w => w.length > 0).length}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Text & Choices */}
          <div className="flex flex-col gap-6">
            {/* Story Text */}
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-lg leading-relaxed">{currentSegment.content}</p>
            </div>

            {/* Choices or Navigation */}
            <div className="space-y-3" style={{ minWidth: '300px' }}>
              {!isEnding && currentSegment.choices && currentSegment.choices.length > 0 ? (
                <>
                  <p className="text-sm font-bold text-foreground mb-3 tracking-wide">
                    What happens next?
                  </p>
                  {currentSegment.choices.map((choice, idx) => (
                    <button
                      key={choice.id || idx}
                      className="w-full text-left h-auto py-4 px-6 bg-card/90 hover:bg-card border-2 border-border hover:border-primary/50 backdrop-blur-sm transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleChoice(choice.text)}
                      disabled={isGeneratingChoice || hasNextSegment}
                      style={{ minWidth: '300px', display: 'block' }}
                    >
                      <p style={{
                        margin: 0,
                        fontSize: '16px',
                        lineHeight: '1.6',
                        fontWeight: 500,
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto'
                      }}>
                        {choice.text}
                      </p>
                      {choice.impact && (
                        <span className="text-xs text-muted-foreground block mt-2">
                          {choice.impact}
                        </span>
                      )}
                    </button>
                  ))}
                  {isGeneratingChoice && (
                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating next chapter...
                    </div>
                  )}

                  {/* End Story Button */}
                  {!hasNextSegment && !isGeneratingChoice && (
                    <Button
                      variant="ghost"
                      className="w-full mt-4 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
                      onClick={handleEndStory}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      End Story Here
                    </Button>
                  )}
                </>
              ) : isEnding ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-2xl font-bold">The End</p>
                  <Button onClick={() => navigate('/my-stories')}>
                    Return to Stories
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showInsufficientCredits}
        onOpenChange={(open) => setShowInsufficientCredits(open)}
        requiredCredits={creditError?.required || 0}
        availableCredits={creditError?.available || 0}
        operation="continue the story"
      />

      {/* End Story Dialog */}
      <EndStoryDialog
        open={showEndStoryDialog}
        onConfirm={handleConfirmEndStory}
        onCancel={() => setShowEndStoryDialog(false)}
        hasExistingEnding={!!segments.find(s => s.is_ending)}
      />

      {/* Chapter Limit Reached Dialog */}
      <ChapterLimitReachedModal
        open={showChapterLimitReached}
        onClose={() => setShowChapterLimitReached(false)}
        hoursUntilReset={hoursUntilReset}
        chaptersUsed={chapterStatus?.used || 4}
      />
      </div>
    </>
  );
}
