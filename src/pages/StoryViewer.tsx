import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, Share, ChevronLeft, ChevronRight, Volume2, Sparkles, RotateCcw, ThumbsUp, BookOpen, Edit, Eye, Headphones, Home, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { VoiceSelector } from '@/components/VoiceSelector';
import { ReadingModeControls } from '@/components/ReadingModeControls';
import { logger, generateRequestId } from '@/lib/debug';
import taleForgeLogoImage from '@/assets/tale-forge-logo.png';

type ViewMode = 'read' | 'watch';

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
  
  const [story, setStory] = useState<Story | null>(null);
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('read');
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
    // Auto-play audio in watch mode
    if (viewMode === 'watch' && currentSegment?.audio_url && !isPlaying) {
      setTimeout(() => toggleAudio(), 500); // Small delay to ensure smooth transition
    }
  }, [viewMode, currentSegmentIndex, segments]);

  useEffect(() => {
    // Determine view mode from URL params, default to 'read'
    const modeParam = searchParams.get('mode') as ViewMode;
    if (modeParam && ['read', 'watch'].includes(modeParam)) {
      setViewMode(modeParam);
    } else {
      setViewMode('read');
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
        choices: Array.isArray(segment.choices) 
          ? (segment.choices as any[]).map((choice: any) => ({
              id: choice?.id ?? 0,
              text: choice?.text ?? '',
              impact: choice?.impact
            }))
          : [],
        is_ending: !!segment.is_ending
      }));
      
      setSegments(transformedSegments);

      // Auto-generate images for segments that don't have them
      transformedSegments.forEach(segment => {
        if (!segment.image_url && segment.content) {
          generateSegmentImage(segment);
        }
      });

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
    
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment) return;

    const requestId = generateRequestId();
    
    logger.group('Story Segment Generation', { requestId, storyId: story.id });
    logger.storySegmentGeneration(story.id, segments.length + 1, requestId);

    setGeneratingSegment(true);
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

      // Generate next segment based on choice
      const { data, error } = await supabase.functions.invoke('generate-story-segment', {
        body: requestBody
      });

      logger.debug('Raw edge function response', {
        requestId,
        data,
        error,
        dataType: typeof data
      });

      if (error) {
        logger.edgeFunctionResponse('generate-story-segment', requestId, data, error);
        throw error;
      }

      logger.edgeFunctionResponse('generate-story-segment', requestId, data);

      // Check if the edge function call was successful
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Failed to generate segment';
        logger.error('Edge function returned failure', new Error(errorMsg), {
          requestId,
          response: data
        });
        throw new Error(`${errorMsg} (Request ID: ${requestId})`);
      }

      // Extract the segment data from the response
      if (!data.data || !data.data.segment) {
        const errorMsg = 'No segment data returned from generation';
        logger.error('Invalid response structure', new Error(errorMsg), {
          requestId,
          dataStructure: data
        });
        throw new Error(`${errorMsg} (Request ID: ${requestId})`);
      }

      logger.info('✅ Segment generated successfully', {
        requestId,
        segmentId: data.data.segment.id,
        contentLength: data.data.segment.content?.length
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
      
      // Check if it's a credit error
      if (error.message?.includes('Insufficient credits')) {
        const match = error.message.match(/Required: (\d+), Available: (\d+)/);
        if (match) {
          setCreditError({
            required: parseInt(match[1]),
            available: parseInt(match[2]),
            operation: 'generate the next story chapter'
          });
          setShowInsufficientCredits(true);
          return;
        }
      }
      
      toast({
        title: "Generation failed",
        description: `${error.message || "Failed to continue the story. Please try again."} (ID: ${requestId})`,
        variant: "destructive",
      });
    } finally {
      setGeneratingSegment(false);
      logger.groupEnd();
    }
  };

  const generateSegmentImage = async (segment: StorySegment) => {
    if (!story) return;

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

      const { data, error } = await supabase.functions.invoke('generate-story-image', {
        body: requestBody
      });

      if (error) {
        logger.edgeFunctionResponse('generate-story-image', requestId, data, error);
        setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));
        
        setTimeout(() => {
          generateSegmentImage(segment);
        }, 2000 * (currentRetries + 1)); // Exponential backoff
        return;
      }

      logger.edgeFunctionResponse('generate-story-image', requestId, data);
      
      // Update segment with image URL when ready
      setSegments(prev => prev.map(s => 
        s.id === segment.id 
          ? { ...s, image_url: data.imageUrl }
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
      
      // Check if it's a credit error
      if (error.message?.includes('Insufficient credits')) {
        const match = error.message.match(/Required: (\d+), Available: (\d+)/);
        if (match) {
          setCreditError({
            required: parseInt(match[1]),
            available: parseInt(match[2]),
            operation: 'generate an AI illustration'
          });
          setShowInsufficientCredits(true);
          return;
        }
      }
      
      setTimeout(() => {
        generateSegmentImage(segment);
      }, 2000 * (currentRetries + 1));
    } finally {
      setGeneratingImage(null);
    }
  };

  const generateAudio = async (segmentId: string, content: string) => {
    const requestId = generateRequestId();
    const retryKey = `audio-${segmentId}`;
    const currentRetries = retryAttempts[retryKey] || 0;
    
    if (currentRetries >= 3) {
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
    
    try {
      const requestBody = {
        text: content,
        voiceId: selectedVoice,
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

      logger.edgeFunctionResponse('generate-story-audio', requestId, data);

      // Update segment with audio URL
      setSegments(prev => prev.map(s => 
        s.id === segmentId 
          ? { ...s, audio_url: data.audioUrl }
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
            available: parseInt(match[2]),
            operation: 'generate voice narration'
          });
          setShowInsufficientCredits(true);
          return;
        }
      }
      
      // Retry with exponential backoff
      setTimeout(() => {
        generateAudio(segmentId, content);
      }, 2000 * (currentRetries + 1));
      
      toast({
        title: "Audio generation failed",
        description: `Retrying... (Attempt ${currentRetries + 1}/3) (ID: ${requestId})`,
        variant: "destructive",
      });
    } finally {
      setGeneratingAudio(false);
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
        // Auto-advance in watch mode
        if (viewMode === 'watch' && currentSegmentIndex < segments.length - 1) {
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
  const showChoices = viewMode === 'read' && isOwner && !isCompletedStory;

  return (
    <div className={`min-h-screen ${isFullscreen ? 'fixed inset-0 z-40 overflow-auto' : ''}`}>
      {/* Navigation Header */}
      <nav className="glass-card border-b border-primary/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src={taleForgeLogoImage} 
                alt="Tale Forge Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-heading font-bold text-gradient">Tale Forge</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/discover" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                Discover
              </Link>
              <Link to="/my-stories" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                My Stories
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/settings">
                <Button variant="outline" className="btn-secondary flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Story Header */}
      <div className="glass-card border-b border-primary/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-gradient">
                {story.title}
              </h1>
              <p className="text-text-secondary">
                {story.genre} • {story.age_group} • Segment {currentSegmentIndex + 1} of {segments.length}
                {isCompletedStory && <span className="ml-2 text-primary">• Complete</span>}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Selector */}
              <div className="flex items-center space-x-1 bg-background/50 rounded-lg p-1">
                <Button
                  onClick={() => {
                    setViewMode('read');
                    setSearchParams(prev => {
                      prev.set('mode', 'read');
                      return prev;
                    });
                  }}
                  variant={viewMode === 'read' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Read
                </Button>
                <Button
                  onClick={() => {
                    setViewMode('watch');
                    setSearchParams(prev => {
                      prev.set('mode', 'watch');
                      return prev;
                    });
                  }}
                  variant={viewMode === 'watch' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs"
                >
                  <Headphones className="w-4 h-4 mr-1" />
                  Watch
                </Button>
              </div>

              {viewMode === 'watch' && (
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                  className="hidden sm:block"
                />
              )}
              <Button
                onClick={toggleReadingMode}
                variant="outline"
                className={`btn-icon ${isReadingMode ? 'text-primary bg-primary/10' : 'text-text-secondary'}`}
              >
                <BookOpen className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setIsLiked(!isLiked)}
                variant="outline"
                className={`btn-icon ${isLiked ? 'text-primary' : 'text-text-secondary'}`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button 
                onClick={handleShare}
                variant="outline" 
                className="btn-icon"
                disabled={story?.visibility === 'private'}
                title={story?.visibility === 'private' ? 'Set story to public in settings to share' : 'Share this story'}
              >
                <Share className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Story Content */}
          {currentSegment && (
            <div className="glass-card-elevated p-8 mb-8">
              {/* Image - Shows immediately when available, placeholder while generating */}
              <div className="mb-8">
                {currentSegment.image_url ? (
                  <img 
                    src={currentSegment.image_url} 
                    alt={`Story segment ${currentSegment.segment_number}`}
                    className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
                    onError={(e) => {
                      logger.warn('Segment image failed to load', { 
                        segmentId: currentSegment.id, 
                        imageUrl: currentSegment.image_url 
                      });
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-64 md:h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/30">
                    <div className="text-center">
                      {generatingImage === currentSegment.id ? (
                        <>
                          <div className="loading-spinner w-8 h-8 mx-auto mb-3" />
                          <p className="text-text-tertiary font-medium">Creating artwork for this scene...</p>
                          <p className="text-text-tertiary/70 text-sm mt-1">This may take a few moments</p>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-12 h-12 text-primary/50 mx-auto mb-3" />
                          <p className="text-text-tertiary font-medium">No image available</p>
                          <Button
                            onClick={() => generateSegmentImage(currentSegment)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            disabled={generatingImage === currentSegment.id}
                          >
                            Generate Image
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Controls - Enhanced for Watch Mode */}
              {(viewMode === 'watch' || currentSegment.audio_url) && (
                <div className="flex items-center justify-center mb-8">
                  <div className="glass-card p-4 flex items-center space-x-4">
                    {currentSegment.audio_url ? (
                      <Button
                        onClick={toggleAudio}
                        className="btn-primary"
                        size="sm"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => generateAudio(currentSegment.id, currentSegment.content)}
                        disabled={generatingAudio}
                        className="btn-primary"
                        size="sm"
                      >
                        {generatingAudio ? (
                          <div className="loading-spinner w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </Button>
                    )}
                    <span className="text-text-secondary text-sm">
                      {currentSegment.audio_url ? 'Listen' : 'Generate Audio'}
                    </span>
                  </div>
                </div>
              )}

              {/* Story Text */}
              <div className="prose prose-lg max-w-none">
                <div 
                  className="text-text-primary leading-relaxed transition-all duration-300"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {(currentSegment?.content ?? '').split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-6">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

              {/* Choices Section - Only show in Read mode for owners */}
          {showChoices && currentSegment && !currentSegment.is_ending && currentSegment.choices.length > 0 && currentSegmentIndex === segments.length - 1 && (
            <div className="glass-card-elevated p-8 mb-8">
              <h3 className="text-xl font-heading font-semibold mb-6 text-center">
                What happens next?
              </h3>
              <p className="text-text-secondary text-center mb-6">
                Your choice will shape how the story continues...
              </p>
              {generatingSegment ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner w-8 h-8 mr-3" />
                  <span className="text-text-secondary">Generating next part of your story...</span>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <CreditCostDisplay operation="segment" />
                  </div>
                  <div className="space-y-4">
                    {currentSegment.choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => handleChoice(choice.id, choice.text)}
                        className="glass-card-interactive w-full p-6 text-left group hover:scale-[1.02] transition-all"
                      >
                        <p className="text-text-primary group-hover:text-primary transition-colors font-medium">
                          {choice.text}
                        </p>
                        {choice.impact && (
                          <p className="text-sm text-text-secondary mt-2 group-hover:text-text-primary transition-colors">
                            {choice.impact}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* End Story Button - Only show in Read mode for endings */}
          {viewMode === 'read' && isOwner && currentSegment?.is_ending && (
            <div className="glass-card-elevated p-8 mb-8 text-center">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 glow-amber" />
              <h3 className="text-2xl font-heading font-semibold mb-4">
                The End
              </h3>
              <p className="text-text-secondary mb-6">
                What an amazing adventure! Your story is complete.
              </p>
              <Button 
                onClick={handleEndStory} 
                disabled={generatingEnding}
                className="btn-primary text-lg px-8"
              >
                {generatingEnding ? (
                  <>
                    <div className="loading-spinner w-5 h-5 mr-2" />
                    Generating Ending...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Finish Story
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => navigateSegment('prev')}
              variant="outline"
              className="btn-secondary"
              disabled={currentSegmentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-4">
              <span className="text-text-secondary">
                Segment {currentSegmentIndex + 1} of {segments.length}
              </span>
              {viewMode === 'read' && isOwner && !currentSegment?.is_ending && (
                <Button
                  onClick={handleEndStory}
                  disabled={generatingEnding}
                  variant="outline"
                  className="btn-secondary"
                >
                  {generatingEnding ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      End Story
                    </>
                  )}
                </Button>
              )}
            </div>

            <Button
              onClick={() => navigateSegment('next')}
              variant="outline"
              className="btn-secondary"
              disabled={currentSegmentIndex === segments.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <InsufficientCreditsDialog
        open={showInsufficientCredits}
        onOpenChange={setShowInsufficientCredits}
        requiredCredits={creditError?.required || 0}
        availableCredits={creditError?.available || 0}
        operation={creditError?.operation || 'perform this action'}
      />

      {(isReadingMode || viewMode === 'watch') && (
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
        />
      )}
    </div>
  );
};

export default StoryViewer;