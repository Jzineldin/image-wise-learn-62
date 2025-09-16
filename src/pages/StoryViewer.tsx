import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { VoiceSelector } from '@/components/VoiceSelector';
import { ReadingModeControls } from '@/components/ReadingModeControls';
import { StoryModeToggle, StoryModeIndicator } from '@/components/story-viewer/StoryModeToggle';
import { AudioControls, FloatingAudioControls } from '@/components/story-viewer/AudioControls';
import { StorySegmentDisplay } from '@/components/story-viewer/StorySegmentDisplay';
import { StoryNavigation } from '@/components/story-viewer/StoryNavigation';
import { StoryMetadata } from '@/components/story-viewer/StoryMetadata';
import { StoryControls } from '@/components/story-viewer/StoryControls';
import { logger, generateRequestId } from '@/lib/utils/debug';
import { AIClient, InsufficientCreditsError, AIClientError } from '@/lib/api/ai-client';
import InsufficientCreditsDialog from '@/components/InsufficientCreditsDialog';
import { calculateTTSCredits } from '@/lib/api/credit-api';

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
  const [creditLock, setCreditLock] = useState(false); // Prevent concurrent credit operations
  
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
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(5);
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

      // Only auto-generate image for the latest segment if not credit locked
      if (transformedSegments.length > 0 && !creditLock) {
        const latestSegment = transformedSegments[transformedSegments.length - 1];
        if (!latestSegment.image_url && latestSegment.content) {
          generateSegmentImage(latestSegment);
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
    if (creditLock) {
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
    setCreditLock(true); // Lock credits during segment generation
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
        
        // Generate image for the new segment
        const newSegment = updatedSegments[updatedSegments.length - 1];
        if (newSegment && !newSegment.image_url) {
          logger.debug('Triggering image generation for new segment', {
            requestId,
            segmentId: newSegment.id
          });
          generateSegmentImage(newSegment);
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
      setCreditLock(false); // Release credit lock
      logger.groupEnd();
    }
  };

  const generateSegmentImage = async (segment: StorySegment) => {
    if (!story) return;
    
    // Check if credit operation is in progress
    if (creditLock) {
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
    setCreditLock(true); // Lock credits during image generation

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
      setCreditLock(false); // Release credit lock
    }
  };

  const generateAudio = async (segmentId: string, content: string) => {
    // Calculate credit cost for TTS
    const { credits: ttsCost, priceBreakdown } = calculateTTSCredits(content);

    // Check if credit operation is in progress
    if (creditLock) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress. Try again in a moment.",
        variant: "default",
      });
      return;
    }

    // Reload segments to check if audio already exists
    const updatedSegments = await reloadSegments();
    const targetSegment = updatedSegments.find(s => s.id === segmentId);
    if (targetSegment?.audio_url) {
      toast({
        title: "Audio already exists",
        description: "This segment already has audio.",
      });
      return;
    }

    const requestId = generateRequestId();
    const retryKey = `audio-${segmentId}`;
    const currentRetries = retryAttempts[retryKey] || 0;

    if (currentRetries >= 1) { // Limit to 1 retry instead of 3
      logger.warn('Max audio generation retries reached', {
        requestId,
        segmentId,
        attempts: currentRetries
      });
      toast({
        title: "Audio generation failed",
        description: `Max retry attempts reached. Please try again later. (ID: ${requestId})`,
        variant: "destructive",
      });
      return;
    }

    logger.audioGeneration(segmentId, requestId, selectedVoice, currentRetries + 1);
    setGeneratingAudio(true);
    setCreditLock(true); // Lock credits during audio generation
    
    try {
      const requestBody = {
        text: content,
        voiceId: selectedVoice,
        languageCode: selectedLanguage,
        storyId: story?.id,
        segmentId,
        modelId: 'eleven_multilingual_v2',
        requestId
      };

      logger.edgeFunction('generate-story-audio', requestId, requestBody);

      const { data, error } = await supabase.functions.invoke('generate-story-audio', {
        body: requestBody
      });

      if (error) {
        logger.edgeFunctionResponse('generate-story-audio', requestId, data, error);
        setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));

        // Retry with exponential backoff
        setTimeout(() => {
          generateAudio(segmentId, content);
        }, 2000 * (currentRetries + 1));
        return;
      }

      // Check if the function returned an error response
      if (data?.error) {
        logger.edgeFunctionResponse('generate-story-audio', requestId, data, new Error(data.error));

        // Handle credit errors specifically
        if (data.error.includes('Insufficient credits')) {
          const match = data.error.match(/Required: (\d+), Available: (\d+)/);
          if (match) {
            setCreditError({
              required: parseInt(match[1]),
              available: parseInt(match[2])
            });
            setShowInsufficientCredits(true);
            return;
          }
        }

        // Only retry for network/server errors, not for 4xx errors
        if (!data.error_code || data.error_code === 'INSUFFICIENT_CREDITS') {
          toast({
            title: "Audio generation failed",
            description: `${data.error} (ID: ${requestId})`,
            variant: "destructive",
          });
          return;
        }

        setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));

        // Retry with exponential backoff only for retryable errors
        setTimeout(() => {
          generateAudio(segmentId, content);
        }, 2000 * (currentRetries + 1));

        toast({
          title: "Audio generation failed",
          description: `${data.error} (Retrying... Attempt ${currentRetries + 1}/1) (ID: ${requestId})`,
          variant: "destructive",
        });
        return;
      }

      logger.edgeFunctionResponse('generate-story-audio', requestId, data);

      // Update segment with audio URL - handle both response formats
      const audioUrl = data.audioUrl || data.audio_url;
      setSegments(prev => prev.map(s =>
        s.id === segmentId
          ? { ...s, audio_url: audioUrl }
          : s
      ));

      // Clear retry counter on success
      setRetryAttempts(prev => {
        const newAttempts = { ...prev };
        delete newAttempts[retryKey];
        return newAttempts;
      });

      toast({
        title: "Audio generated!",
        description: "You can now listen to this segment.",
      });

    } catch (error: any) {
      logger.error('Audio generation failed', error, {
        requestId,
        segmentId,
        attempt: currentRetries + 1,
        voiceId: selectedVoice
      });
      setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));
      
      // Check if it's a credit error
      if (error.message?.includes('Insufficient credits')) {
        const match = error.message.match(/Required: (\d+), Available: (\d+)/);
        if (match) {
          setCreditError({
            required: parseInt(match[1]),
            available: parseInt(match[2])
          });
          setShowInsufficientCredits(true);
          return;
        }
      }
      
      // Only retry for network errors, not for 4xx client errors
      if (currentRetries === 0 && !error.status || (error.status && error.status >= 500)) {
        setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));
        
        setTimeout(() => {
          generateAudio(segmentId, content);
        }, 2000 * (currentRetries + 1));
        
        toast({
          title: "Audio generation failed",
          description: `Retrying... (Attempt ${currentRetries + 1}/1) (ID: ${requestId})`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Audio generation failed",
          description: `${error.message} (ID: ${requestId})`,
          variant: "destructive",
        });
      }
    } finally {
      setGeneratingAudio(false);
      setCreditLock(false); // Release credit lock
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

  const handleEndStory = async () => {
    if (!story || !user) return;

    // Show confirmation dialog before generating ending
    const confirmed = window.confirm(
      "This will generate an AI ending for your story and mark it as complete. This action cannot be undone. Continue?"
    );

    if (!confirmed) return;

    try {
      setGeneratingEnding(true);
      
      toast({
        title: "Generating story ending...",
        description: "Our AI is crafting the perfect conclusion to your adventure.",
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

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate ending');
      }

      toast({
        title: "Story ending generated!",
        description: "Your adventure now has a perfect conclusion.",
      });

      // Navigate to the story end page
      navigate(`/story/${id}/end`);

    } catch (error) {
      logger.error('Story ending generation failed', error, { storyId: id });
      toast({
        title: "Failed to generate ending",
        description: error.message || "Please try again later.",
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

  return (
    <div className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-40 overflow-auto' : ''}`}>
      <StoryControls
        viewMode={viewMode}
        isOwner={isOwner}
        isLiked={isLiked}
        isReadingMode={isReadingMode}
        isFullscreen={isFullscreen}
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
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Story Metadata */}
          <StoryMetadata story={story} viewMode={viewMode} />

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
            />
          )}

          {/* Story Navigation */}
          <StoryNavigation
            currentSegmentIndex={currentSegmentIndex}
            totalSegments={segments.length}
            onNavigate={navigateSegment}
            onJumpToSegment={jumpToSegment}
          />
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
          onGenerateAudio={() => currentSegment && generateAudio(currentSegment.id, currentSegment.content)}
          onSkipForward={() => navigateSegment('next')}
          onSkipBack={() => navigateSegment('prev')}
          canSkipForward={currentSegmentIndex < segments.length - 1}
          canSkipBack={currentSegmentIndex > 0}
          disabled={creditLock}
        />
      )}
    </div>
  );
};

export default StoryViewer;