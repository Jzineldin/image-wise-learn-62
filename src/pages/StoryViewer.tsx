import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { VOICE_LANGUAGE_MAP } from '@/constants/translations';
import { VoiceSelector } from '@/components/VoiceSelector';
import { ReadingModeControls } from '@/components/ReadingModeControls';
import { StoryModeToggle, StoryModeIndicator } from '@/components/story-viewer/StoryModeToggle';
import { AudioControls, FloatingAudioControls } from '@/components/story-viewer/AudioControls';
import { StorySegmentDisplay } from '@/components/story-viewer/StorySegmentDisplay';
import { StoryNavigation } from '@/components/story-viewer/StoryNavigation';
import { StoryMetadata } from '@/components/story-viewer/StoryMetadata';
import { StoryControls } from '@/components/story-viewer/StoryControls';
import { StoryProgressTracker } from '@/components/story-viewer/StoryProgressTracker';
import { StorySidebar } from '@/components/story-viewer/StorySidebar';
import { logger, generateRequestId } from '@/lib/utils/debug';
import { AIClient, InsufficientCreditsError, AIClientError } from '@/lib/api/ai-client';
import InsufficientCreditsDialog from '@/components/InsufficientCreditsDialog';
import { calculateTTSCredits } from '@/lib/api/credit-api';
import { generateAudio as generateAudioAPI } from '@/lib/api/story-api';

type ViewMode = 'creation' | 'experience';

// Helper function to parse function errors from supabase-js wrapper
const parseFunctionError = (error: any): string => {
  // Handle FunctionsHttpError from supabase-js
  if (error?.context?.message) {
    return error.context.message;
  }

  // Handle direct error messages
  if (error?.message) {
    return error.message;
  }

  // Fallback
  return 'Unknown error occurred';
};

interface StorySegment {
  id: string;
  segment_number: number;
  content: string;
  image_url?: string;
  audio_url?: string;
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
  description: string;
  author_id: string;
  user_id?: string;
  genre: string;
  age_group: string;
  status: string;
  is_completed?: boolean;
  is_complete?: boolean;
  visibility?: string;
  metadata: any;
  cover_image?: string;
}

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Credit system states
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditError, setCreditError] = useState<{ required: number; available: number } | null>(null);
  // Add credit lock reference
  const creditLock = useRef(false);

  const [story, setStory] = useState<Story | null>(null);
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('creation');
  const [isOwner, setIsOwner] = useState(false);
  const [generatingSegment, setGeneratingSegment] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingEnding, setGeneratingEnding] = useState(false);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [retryAttempts, setRetryAttempts] = useState<{[key: string]: number}>({});
  const [selectedVoice, setSelectedVoice] = useState('9BWtsMINqrJLrRacOk9x'); // Default Aria

  // Ensure we stop audio playback when this page unmounts or when the audio element changes
  useEffect(() => {
    return () => {
      try {
        if (audioElement) {
          audioElement.pause();
          // Clearing src helps some browsers stop buffering
          audioElement.src = '';
        }
      } catch (e) {
        // no-op
      }
    };
  }, [audioElement]);

  // Also stop audio on page visibility change (e.g., quick navs)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && audioElement && !audioElement.paused) {
        audioElement.pause();
        setIsPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [audioElement]);

  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(5);

  // Ensure voice selection matches current language
  useEffect(() => {
    const voices = VOICE_LANGUAGE_MAP[selectedLanguage as keyof typeof VOICE_LANGUAGE_MAP];
    const allVoices = [
      ...(voices?.female || []),
      ...(voices?.male || []),
      ...(voices?.neutral || [])
    ];
    if (!allVoices.includes(selectedVoice)) {
      const defaultVoice = voices?.female?.[0] || voices?.male?.[0] || voices?.neutral?.[0] || '9BWtsMINqrJLrRacOk9x';
      setSelectedVoice(defaultVoice);
    }
  }, [selectedLanguage]);

  const [autoPlayTimeout, setAutoPlayTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      loadStory();
    }
  }, [id]);

  useEffect(() => {
    // Auto-play audio in experience mode
    const currentSeg = segments[currentSegmentIndex];
    if (viewMode === 'experience' && currentSeg?.audio_url && !isPlaying) {
      setTimeout(() => toggleAudio(), 500); // Small delay to ensure smooth transition
    }
  }, [viewMode, currentSegmentIndex, segments]);

  useEffect(() => {
    // Determine view mode from URL params, default based on ownership
    const modeParam = searchParams.get('mode') as ViewMode;
    if (modeParam && ['creation', 'experience'].includes(modeParam)) {
      setViewMode(modeParam);
    } else {
      // Default to creation mode for owners, experience mode for viewers
      const defaultMode = story && user && (story.author_id === user.id || story.user_id === user.id) ? 'creation' : 'experience';
      setViewMode(defaultMode);
    }

    // Set ownership status
    if (story && user) {
      const isUserStory = story.author_id === user.id || story.user_id === user.id;
      setIsOwner(isUserStory);
      console.log('🔒 Ownership check:', {
        isOwner: isUserStory,
        userId: user.id,
        authorId: story.author_id,
        storyUserId: story.user_id,
        viewMode,
        isCompleted: story.status === 'completed' || story.is_completed || story.is_complete
      });
    }
  }, [searchParams, story, user]);

  const loadStory = async () => {
    try {
      setLoading(true);

      // Load story details
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (storyError) throw storyError;
      if (!storyData) {
        throw new Error('Story not found');
      }
      setStory(storyData);

      await reloadSegments();

    } catch (error) {
      logger.error('Story loading failed', error, { storyId: id, mode: searchParams.get('mode') });
      toast({
        title: "Error loading story",
        description: "Failed to load the story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reloadSegments = async () => {
    try {
      // Load story segments from database
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('story_segments')
        .select('*')
        .eq('story_id', id)
        .order('segment_number', { ascending: true });

      if (segmentsError) throw segmentsError;

      // Transform Supabase data to match our interface
      const transformedSegments: StorySegment[] = (segmentsData || []).map(segment => ({
        id: segment.id,
        segment_number: segment.segment_number,
        content: segment.content || '',
        image_url: segment.image_url,
        audio_url: segment.audio_url,
        choices: (() => {
          try {
            // Handle both string (legacy) and array formats
            const rawChoices = segment.choices;
            if (Array.isArray(rawChoices)) {
              return rawChoices.map((choice: any) => ({
                id: choice?.id ?? 0,
                text: choice?.text ?? '',
                impact: choice?.impact
              }));
            } else if (typeof rawChoices === 'string') {
              const parsed = JSON.parse(rawChoices);
              return Array.isArray(parsed) ? parsed.map((choice: any) => ({
                id: choice?.id ?? 0,
                text: choice?.text ?? '',
                impact: choice?.impact
              })) : [];
            }
            return [];
          } catch {
            return [];
          }
        })(),
        is_ending: !!segment.is_ending
      }));

      setSegments(transformedSegments);

      // Auto-generate images for segments that need them (prioritize segment 1, then latest/ending) if not credit locked
      if (transformedSegments.length > 0 && !creditLock.current) {
        // First, check if segment 1 needs an image (critical for first-time story viewing)
        const firstSegment = transformedSegments.find(s => s.segment_number === 1);
        if (firstSegment && !firstSegment.image_url && firstSegment.content) {
          console.log('🖼️ Auto-generating image for first segment on load:', firstSegment.id);
          generateSegmentImage(firstSegment);
        } else {
          // If segment 1 has an image, check the latest/ending segment
          const endingCandidate = [...transformedSegments].reverse().find(s => s.is_ending) || transformedSegments[transformedSegments.length - 1];
          if (endingCandidate && !endingCandidate.image_url && endingCandidate.content && endingCandidate.segment_number !== 1) {
            console.log('🖼️ Auto-generating image for latest/ending segment on load:', endingCandidate.id);
            generateSegmentImage(endingCandidate);
          }
        }
      }

      return transformedSegments;

    } catch (error) {
      logger.error('Story segments loading failed', error, { storyId: id });
      toast({
        title: "Error loading segments",
        description: "Failed to load story segments. Please refresh the page.",
        variant: "destructive",
      });
      return [];
    }
  };

  const handleChoice = async (choiceId: number, choiceText: string) => {
    if (!story || !user) return;

    // Block choices if story is completed
    if (story.status === 'completed' || story.is_completed || story.is_complete) {
      toast({
        title: "Story Completed",
        description: "This story has already been completed. You can only read it now.",
        variant: "destructive",
      });
      return;
    }

    // Block if credit operation is in progress
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Please wait and try again.",
        variant: "default",
      });
      return;
    }

    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment) return;

    const requestId = generateRequestId();

    logger.group('Story Segment Generation', { requestId, storyId: story.id });
    logger.storySegmentGeneration(story.id, segments.length + 1, requestId);

    setGeneratingSegment(true);
    creditLock.current = true; // Lock credits during segment generation
    try {
      const requestBody = {
        storyId: story.id,
        choiceId,
        choiceText,
        previousSegmentContent: currentSegment.content,
        storyContext: {
          title: story.title,
          description: story.description,
          ageGroup: story.age_group,
          genre: story.genre,
          languageCode: selectedLanguage,
          characters: story.metadata?.characters || []
        },
        segmentNumber: segments.length + 1,
        requestId
      };

      logger.edgeFunction('generate-story-segment', requestId, requestBody);

      // Generate next segment based on choice using unified AI client
      const generationResult = await AIClient.generateStorySegment({
        storyId: story.id,
        choiceId,
        choiceText,
        previousSegmentContent: currentSegment.content,
        storyContext: {
          title: story.title,
          description: story.description,
          ageGroup: story.age_group,
          genre: story.genre,
          languageCode: selectedLanguage,
          characters: story.metadata?.characters || []
        },
        segmentNumber: segments.length + 1,
        requestId
      });

      logger.debug('AI Client response', {
        requestId,
        success: generationResult.success,
        hasData: !!generationResult.data,
        dataType: typeof generationResult.data
      });

      // Extract the segment data from the response
      if (!generationResult.data?.segment) {
        const errorMsg = 'No segment data returned from generation';
        logger.error('Invalid response structure', new Error(errorMsg), {
          requestId,
          dataStructure: generationResult.data
        });
        throw new Error(`${errorMsg} (Request ID: ${requestId})`);
      }

      logger.info('✅ Segment generated successfully', {
        requestId,
        segmentId: generationResult.data.segment.id,
        contentLength: generationResult.data.segment.content?.length
      });

      // Reload segments from database to ensure state consistency
      logger.debug('Reloading segments from database', { requestId });
      const updatedSegments = await reloadSegments();

      // Navigate to the latest segment (last one in the array)
      if (updatedSegments.length > 0) {
        setCurrentSegmentIndex(updatedSegments.length - 1);

        // Automatically generate image for the new segment
        const newSegment = updatedSegments[updatedSegments.length - 1];
        if (newSegment && !newSegment.image_url) {
          logger.debug('Auto-generating image for new segment', {
            requestId,
            segmentId: newSegment.id
          });
          console.log('🖼️ Auto-generating image for new segment:', newSegment.id);

          // Wait for credit lock to be released then generate image
          const autoGenerateImage = async () => {
            // Wait a bit for credit system to update
            await new Promise(resolve => setTimeout(resolve, 500));

            // Ensure credit lock is released
            creditLock.current = false;

            // Now generate the image
            await generateSegmentImage(newSegment);
          };

          // Execute in background
          autoGenerateImage().catch(error => {
            logger.error('Auto-image generation failed', error, {
              requestId,
              segmentId: newSegment.id
            });
          });
        }
      }

      toast({
        title: "Story continues!",
        description: "Your choice has shaped the adventure.",
      });

    } catch (error: any) {
      logger.error('Story segment generation failed', error, {
        requestId,
        storyId: story.id,
        choiceId,
        segmentNumber: segments.length + 1
      });

      // Handle specific AI client errors
      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.required,
          available: error.available
        });
        setShowInsufficientCredits(true);
        return;
      }

      toast({
        title: "Generation failed",
        description: `${error.message || "Failed to continue the story. Please try again."} (ID: ${requestId})`,
        variant: "destructive",
      });
    } finally {
      setGeneratingSegment(false);
      creditLock.current = false; // Release credit lock
      logger.groupEnd();
    }
  };

  const generateSegmentImage = async (segment: StorySegment) => {
    console.log('generateSegmentImage function called for segment:', segment.id);
    if (!story) return;

    // Check if credit operation is in progress
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Try again in a moment.",
        variant: "default",
      });
      return;
    }

    const requestId = generateRequestId();
    const retryKey = `image-${segment.id}`;
    const currentRetries = retryAttempts[retryKey] || 0;

    if (currentRetries >= 3) {
      logger.warn('Max image generation retries reached', {
        requestId,
        segmentId: segment.id,
        attempts: currentRetries
      });
      toast({
        title: "Image generation failed",
        description: `Max retry attempts reached. Please try again later. (ID: ${requestId})`,
        variant: "destructive",
      });
      return;
    }

    logger.imageGeneration(segment.id, requestId, currentRetries + 1);
    setGeneratingImage(segment.id);
    creditLock.current = true; // Lock credits during image generation

    try {
      const requestBody = {
        storyContent: segment.content,
        storyTitle: story.title,
        ageGroup: story.age_group,
        genre: story.genre,
        segmentNumber: segment.segment_number,
        storyId: story.id,
        segmentId: segment.id,
        characters: story.metadata?.characters || [],
        requestId
      };

      logger.edgeFunction('generate-story-image', requestId, requestBody);

      const imageResult = await AIClient.generateStoryImage({
        storyContent: segment.content,
        storyTitle: story.title,
        ageGroup: story.age_group,
        genre: story.genre,
        segmentNumber: segment.segment_number,
        storyId: story.id,
        segmentId: segment.id,
        characters: story.metadata?.characters || [],
        requestId
      });

      logger.edgeFunctionResponse('generate-story-image', requestId, imageResult);

      // Update segment with image URL when ready
      setSegments(prev => prev.map(s =>
        s.id === segment.id
          ? { ...s, image_url: imageResult.data?.imageUrl }
          : s
      ));

      // Clear retry counter on success
      setRetryAttempts(prev => {
        const newAttempts = { ...prev };
        delete newAttempts[retryKey];
        return newAttempts;
      });

      toast({
        title: "Image generated!",
        description: "Story artwork is ready.",
      });

    } catch (error: any) {
      logger.error('Image generation failed', error, {
        requestId,
        segmentId: segment.id,
        attempt: currentRetries + 1
      });
      setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));

      // Show better error messages
      if (error.code === 'INSUFFICIENT_CREDITS') {
        toast({
          title: "Insufficient Credits",
          description: `Need ${error.required} credits, but only have ${error.available}. Please upgrade your plan.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Image generation failed",
          description: error.message || "Failed to generate story image. Retrying...",
          variant: "destructive",
        });
      }

      setTimeout(() => {
        generateSegmentImage(segment);
      }, 2000 * (currentRetries + 1));
    } finally {
      setGeneratingImage(null);
      creditLock.current = false; // Release credit lock
    }
  };

  const generateAudio = async (segmentId: string, content: string) => {
    console.log('generateAudio function called with segmentId:', segmentId);
    // Calculate credit cost for TTS
    const { credits: ttsCost, priceBreakdown } = calculateTTSCredits(content);

    // Check if credit operation is in progress
    if (creditLock.current) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Try again in a moment.",
        variant: "default",
      });
      return;
    }

    // Check if audio already exists without reloading all segments
    // This avoids triggering the auto-image generation side effect
    const targetSegment = segments.find(s => s.id === segmentId);
    if (targetSegment?.audio_url) {
      toast({
        title: "Audio already exists",
        description: "This segment already has audio.",
      });
      return;
    }

    const requestId = generateRequestId();

    // Determine voice ID to use (prefer current selection; otherwise pick a language-appropriate default)
    let voiceIdToUse = selectedVoice;
    const languageVoices = VOICE_LANGUAGE_MAP[selectedLanguage as keyof typeof VOICE_LANGUAGE_MAP];

    if (!voiceIdToUse) {
      const female = languageVoices?.female?.[0];
      const male = languageVoices?.male?.[0];
      const neutral = languageVoices?.neutral?.[0];
      voiceIdToUse = female || male || neutral || '9BWtsMINqrJLrRacOk9x';
    }

    logger.audioGeneration(segmentId, requestId, voiceIdToUse, 1);
    setGeneratingAudio(true);
    creditLock.current = true; // Lock credits during audio generation

      // Diagnostic: estimate required credits and log current balance before calling Edge Function
      try {
        const wordCount = content.trim().split(/\s+/).length;
        const estimatedRequired = Math.ceil(wordCount / 100);
        if (user?.id) {
          const { data: userCredits, error: userCreditsError } = await supabase
            .from('user_credits')
            .select('current_balance')
            .eq('user_id', user.id)
            .single();
          logger.info('Pre-audio credit check', {
            wordCount,
            estimatedRequired,
            currentBalance: userCredits?.current_balance,
            userCreditsError: userCreditsError?.message
          });
        } else {
          logger.info('Pre-audio credit check skipped: no user');
        }
      } catch (e) {
        logger.error('Pre-audio credit check failed', e);
      }

    try {
      // Use the generateAudio function from story-api which has the proper interface
      const audioResult = await generateAudioAPI({
        text: content,
        voice: voiceIdToUse,
        languageCode: selectedLanguage,
        storyId: story?.id,
        segmentId: segmentId,
        modelId: selectedLanguage === 'sv' ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1'
      });

      logger.info('Audio generation successful', { segmentId, requestId, audioUrl: audioResult.audioUrl });

      // Update segment with audio URL
      const audioUrl = audioResult.audioUrl;
      if (audioUrl) {
        setSegments(prev => prev.map(s =>
          s.id === segmentId
            ? { ...s, audio_url: audioUrl }
            : s
        ));
      }

      toast({
        title: "Audio generated!",
        description: "You can now listen to this segment.",
      });

    } catch (error: any) {
      logger.error('Audio generation failed', error, {
        requestId,
        segmentId,
        voiceId: voiceIdToUse
      });

      // Check if it's a credit error
      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.required,
          available: error.available
        });
        setShowInsufficientCredits(true);
        return;
      }

      toast({
        title: "Audio generation failed",
        description: `${error.message} (ID: ${requestId})`,
        variant: "destructive",
      });
    } finally {
      setGeneratingAudio(false);
      creditLock.current = false; // Release credit lock
    }
  };

  const toggleAudio = () => {
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment?.audio_url) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      if (audioElement) {
        audioElement.pause();
      }

      const audio = new Audio(currentSegment.audio_url);
      audio.onended = () => {
        setIsPlaying(false);
        // Auto-advance in experience mode
        if (viewMode === 'experience' && currentSegmentIndex < segments.length - 1) {
          setTimeout(() => navigateSegment('next'), 1000); // 1 second delay between segments
        }
      };
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);

      setAudioElement(audio);
      audio.play();
    }
  };

  const navigateSegment = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
    } else if (direction === 'next' && currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
    }

    // Stop current audio
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }

    // Handle auto-play in reading mode
    if (isAutoPlaying && isReadingMode) {
      startAutoPlayTimer();
    }
  };

  const jumpToSegment = (segmentIndex: number) => {
    if (segmentIndex >= 0 && segmentIndex < segments.length) {
      setCurrentSegmentIndex(segmentIndex);

      // Stop current audio
      if (audioElement) {
        audioElement.pause();
        setIsPlaying(false);
      }

      // Handle auto-play in reading mode
      if (isAutoPlaying && isReadingMode) {
        startAutoPlayTimer();
      }
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (!isAutoPlaying && isReadingMode) {
      startAutoPlayTimer();
    } else {
      clearAutoPlayTimer();
    }
  };

  const startAutoPlayTimer = () => {
    clearAutoPlayTimer();
    if (currentSegmentIndex < segments.length - 1) {
      const timeout = setTimeout(() => {
        navigateSegment('next');
      }, autoPlaySpeed * 1000);
      setAutoPlayTimeout(timeout);
    }
  };

  const clearAutoPlayTimer = () => {
    if (autoPlayTimeout) {
      clearTimeout(autoPlayTimeout);
      setAutoPlayTimeout(null);
    }
  };

  const handleShare = async () => {
    if (!story) return;

    if (story.visibility === 'private') {
      toast({
        title: "Story is private",
        description: "Go to My Stories → Settings to make this story public before sharing.",
        variant: "destructive",
      });
      return;
    }

    const shareData = {
      title: story.title,
      text: `Check out "${story.title}" - ${story.description}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Story shared!",
          description: "Thank you for sharing this adventure.",
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        toast({
          title: "Link copied!",
          description: "Story link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.error('Story sharing failed', error, { storyId: id });
        toast({
          title: "Sharing failed",
          description: "Please try again or copy the URL manually.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleReadingMode = () => {
    setIsReadingMode(!isReadingMode);
    if (!isReadingMode) {
      // Entering reading mode
      setIsAutoPlaying(false);
      clearAutoPlayTimer();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Clear auto-play timer on unmount
  useEffect(() => {
    return () => {
      clearAutoPlayTimer();
    };
  }, []);

  // Handle auto-play timer when dependencies change
  useEffect(() => {
    if (isAutoPlaying && isReadingMode) {
      startAutoPlayTimer();
    } else {
      clearAutoPlayTimer();
    }
  }, [currentSegmentIndex, isAutoPlaying, isReadingMode, autoPlaySpeed]);

  const makePictureAndVoice = async (segment: any) => {
    if (!segment?.content) {
      toast({ title: 'Cannot create', description: 'This part has no text yet.', variant: 'destructive' });
      return;
    }
    try {
      if (!segment.image_url) {
        await generateSegmentImage(segment);
      }
      if (!segment.audio_url) {
        await generateAudio(segment.id, segment.content);
      }
    } catch (err) {
      logger.error('makePictureAndVoice failed', err);
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleEndStory = async () => {
    if (!story || !user) return;

    // If an ending already exists, go to finalize
    const endingSegment = segments.find(s => s.is_ending);
    if (endingSegment) {
      navigate(`/story/${id}/end`);
      return;
    }

    // Confirm before generating the ending segment
    const confirmed = window.confirm(
      "This will generate a final segment to conclude your story. You'll be able to generate image and audio for it before finalizing. Continue?"
    );

    if (!confirmed) return;

    try {
      setGeneratingEnding(true);

      toast({
        title: "Generating final segment...",
        description: "Our AI is crafting the conclusion to your adventure.",
      });

      // Call the generate ending function
      const { data, error } = await supabase.functions.invoke('generate-story-ending', {
        body: {
          storyId: story.id,
          currentSegments: segments.map(s => ({
            segment_number: s.segment_number,
            content: s.content || ''
          })),
          genre: story.genre,
          ageGroup: story.age_group,
          characters: story.metadata?.characters || []
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error((data as any)?.error || 'Failed to generate ending');
      }

      // Reload segments so the new final segment is available
      const updated = await reloadSegments();
      if (updated.length > 0) {
        // Jump to the new last segment (the ending)
        setCurrentSegmentIndex(updated.length - 1);
      }

      // Inform user to generate image/audio now, and finalize afterwards
      toast({
        title: "Ending generated",
        description: "Review the final segment. You can generate image and audio now. Click End Story again to finalize.",
      });

      // Proactively trigger auto-image for the ending if possible (guarded by creditLock in generator)
      const endingSeg = updated.find(s => s.is_ending) || updated[updated.length - 1];
      if (endingSeg && !endingSeg.image_url && endingSeg.content && !creditLock.current) {
        generateSegmentImage(endingSeg);
      }

      // Do NOT navigate yet — allow normal image/TTS flow on the final segment

    } catch (error: any) {
      logger.error('Story ending generation failed', error, { storyId: id });
      toast({
        title: "Failed to generate ending",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setGeneratingEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-heading mb-4">Story not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentSegment = segments[currentSegmentIndex];
  const isCompletedStory = story?.status === 'completed' || story?.is_completed;
  const hasEnding = segments.some(s => s.is_ending);

  const endingSeg = segments.find(s => s.is_ending);
  const endingReady = !!(endingSeg && endingSeg.content && endingSeg.image_url && endingSeg.audio_url);
  const endActionLabel = endingSeg ? 'Finish Story' : 'Create Ending';

  return (
    <div className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-40 overflow-auto' : ''}`}>
      <StoryControls
        viewMode={viewMode}
        isOwner={isOwner}
        isLiked={isLiked}
        isReadingMode={isReadingMode}
        isFullscreen={isFullscreen}
        isCompleted={isCompletedStory}
        generatingEnding={generatingEnding}
        onModeChange={(mode) => {
          setViewMode(mode);
          setSearchParams(prev => {
            prev.set('mode', mode);
            return prev;
          });
        }}
        onShare={handleShare}
        onToggleLike={() => setIsLiked(!isLiked)}
        onToggleReadingMode={toggleReadingMode}
        onToggleFullscreen={toggleFullscreen}
        onEndStory={handleEndStory}
        hasEnding={hasEnding}
        endActionLabel={endActionLabel}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Story Progress Tracker */}
          {viewMode === 'creation' && segments.length > 0 && (
            <StoryProgressTracker
              currentSegmentIndex={currentSegmentIndex}
              totalSegments={segments.length}
              isCompleted={isCompletedStory}
            />
          )}

          {/* Main Content Area */}
          <div className={viewMode === 'creation' ? 'grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6' : 'max-w-4xl mx-auto'}>
            {/* Story Main Content */}
            <div className="space-y-6">
              {/* Story Metadata */}
              {viewMode === 'experience' && (
                <StoryMetadata story={story} viewMode={viewMode} />
              )}

              {/* Current Segment Display */}
              {currentSegment && (
                <StorySegmentDisplay
                  segment={currentSegment}
                  story={story}
                  viewMode={viewMode}
                  isOwner={isOwner}
                  generatingSegment={generatingSegment}
                  generatingImage={generatingImage}
                  onChoice={handleChoice}
                  onGenerateImage={generateSegmentImage}
                  fontSize={fontSize}
                  isPlaying={isPlaying}
                  generatingAudio={generatingAudio}
                  onToggleAudio={toggleAudio}
                  onGenerateAudio={() => {
                    if (!currentSegment.content) {
                      toast({
                        title: "Cannot generate audio",
                        description: "This segment has no content to convert to audio.",
                        variant: "destructive",
                      });
                      return;
                    }
                    generateAudio(currentSegment.id, currentSegment.content);
                  }}
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                />
              )}

              {/* Ending helper hint: guide user to generate missing content */}
              {viewMode === 'creation' && currentSegment?.is_ending && isOwner && !isCompletedStory && !!currentSegment.content && ((!currentSegment.image_url) || (!currentSegment.audio_url)) && (
                <div className="glass-card-info p-4 rounded-lg border border-primary/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">Finalize your ending</h4>
                      <p className="text-sm text-text-secondary">
                        {(!currentSegment.image_url && !currentSegment.audio_url) && 'Generate image and audio for the ending segment.'}
                        {(currentSegment.image_url && !currentSegment.audio_url) && 'Generate audio for the ending segment.'}
                        {(!currentSegment.image_url && currentSegment.audio_url) && 'Generate an image for the ending segment.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!currentSegment.image_url && (
                        <Button
                          variant="outline"
                          onClick={() => generateSegmentImage(currentSegment)}
                          disabled={creditLock.current || generatingImage === currentSegment.id}
                        >
                          {generatingImage === currentSegment.id ? 'Generating image…' : 'Generate Image'}
                        </Button>
                      )}
                      {!currentSegment.audio_url && (
                        <Button
                          className="btn-primary"
                          onClick={() => currentSegment.content && generateAudio(currentSegment.id, currentSegment.content)}
                          disabled={creditLock.current || generatingAudio}
                        >
                          {generatingAudio ? 'Generating audio…' : 'Generate Audio'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}


              {/* Story Navigation for Experience Mode */}
              {viewMode === 'experience' && (
                <StoryNavigation
                  currentSegmentIndex={currentSegmentIndex}
                  totalSegments={segments.length}
                  onNavigate={navigateSegment}
                  onJumpToSegment={jumpToSegment}
                  onEndStory={handleEndStory}
                  showEndStory={isOwner && !isCompletedStory}
                  viewMode={viewMode}
                  hasEnding={hasEnding}
                  endActionLabel={endActionLabel}
                />
              )}
            </div>

            {/* Sidebar for Creation Mode */}
            {viewMode === 'creation' && currentSegment && (
              <StorySidebar
                story={story}
                currentSegment={currentSegment}
                segmentNumber={currentSegmentIndex + 1}
                totalSegments={segments.length}
                creditsUsed={8} // TODO: Calculate from actual usage
                totalCredits={23} // TODO: Get from user credits
                isPlaying={isPlaying}
                generatingAudio={generatingAudio}
                generatingImage={generatingImage === currentSegment.id}
                generatingEnding={generatingEnding}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
                onGenerateAudio={() => {
                  if (!currentSegment.content) {
                    toast({
                      title: "Cannot generate audio",
                      description: "This segment has no content to convert to audio.",
                      variant: "destructive",


                    });
                    return;
                  }
                  generateAudio(currentSegment.id, currentSegment.content);
                }}
                onToggleAudio={toggleAudio}
                onGenerateImage={() => generateSegmentImage(currentSegment)}
                onEndStory={handleEndStory}
                isOwner={isOwner}
                isCompleted={isCompletedStory}
                creditLocked={creditLock.current}
                hasEnding={hasEnding}
                onMakePictureAndVoice={() => makePictureAndVoice(currentSegment)}
                endActionLabel={endActionLabel}
              />
            )}
          </div>
        </div>
      </div>

      <InsufficientCreditsDialog
        open={showInsufficientCredits}
        onOpenChange={setShowInsufficientCredits}
        requiredCredits={creditError?.required || 0}
        availableCredits={creditError?.available || 0}
        operation="perform this action"
      />

      {/* Enhanced Reading Controls */}
      {(isReadingMode || viewMode === 'experience') && (
        <ReadingModeControls
          isAutoPlaying={isAutoPlaying}
          onAutoPlayToggle={toggleAutoPlay}
          currentSegment={currentSegmentIndex}
          totalSegments={segments.length}
          onNavigate={navigateSegment}
          onJumpToSegment={jumpToSegment}
          isFullscreen={isFullscreen}
          onFullscreenToggle={toggleFullscreen}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          autoPlaySpeed={autoPlaySpeed}
          onAutoPlaySpeedChange={setAutoPlaySpeed}
          mode={viewMode}
        />
      )}

      {/* Floating Audio Controls for Experience Mode */}
      {viewMode === 'experience' && !isReadingMode && (
        <FloatingAudioControls
          audioUrl={currentSegment?.audio_url}
          isPlaying={isPlaying}
          isGenerating={generatingAudio}
          onToggleAudio={toggleAudio}
          onGenerateAudio={() => {
            if (!currentSegment || !currentSegment.content) {
              toast({
                title: "Cannot generate audio",
                description: "This segment has no content to convert to audio.",
                variant: "destructive",
              });
              return;
            }
            generateAudio(currentSegment.id, currentSegment.content);
          }}
          onSkipForward={() => navigateSegment('next')}
          onSkipBack={() => navigateSegment('prev')}
          canSkipForward={currentSegmentIndex < segments.length - 1}
          canSkipBack={currentSegmentIndex > 0}
          disabled={creditLock.current}
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          showVoiceSelector={true}
        />
      )}
    </div>
  );
};

export default StoryViewer;