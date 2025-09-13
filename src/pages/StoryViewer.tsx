import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, Share, ChevronLeft, ChevronRight, Volume2, Sparkles, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  genre: string;
  age_group: string;
  status: string;
  metadata: any;
  cover_image?: string;
}

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [story, setStory] = useState<Story | null>(null);
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingSegment, setGeneratingSegment] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [retryAttempts, setRetryAttempts] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (id) {
      loadStory();
    }
  }, [id]);

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

      // Load story segments
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
              id: choice.id || 0,
              text: choice.text || '',
              impact: choice.impact
            }))
          : [],
        is_ending: segment.is_ending || false
      }));
      
      setSegments(transformedSegments);

      // Auto-generate images for segments that don't have them
      transformedSegments.forEach(segment => {
        if (!segment.image_url && segment.content) {
          generateSegmentImage(segment);
        }
      });

    } catch (error) {
      console.error('Error loading story:', error);
      toast({
        title: "Error loading story",
        description: "Failed to load the story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceId: number, choiceText: string) => {
    if (!story || !user) return;
    
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment) return;

    setGeneratingSegment(true);
    try {
      // Generate next segment based on choice
      const { data, error } = await supabase.functions.invoke('generate-story-segment', {
        body: {
          storyId: story.id,
          choiceId,
          choiceText,
          previousSegmentContent: currentSegment.content,
          storyContext: {
            title: story.title,
            description: story.description,
            ageGroup: story.age_group,
            genre: story.genre,
            characters: story.metadata?.characters || []
          },
          segmentNumber: segments.length + 1
        }
      });

      if (error) throw error;

      const newSegment = data.segment;
      setSegments(prev => [...prev, newSegment]);
      setCurrentSegmentIndex(segments.length);

      // Generate image for new segment
      generateSegmentImage(newSegment);

      toast({
        title: "Story continues!",
        description: "Your choice has shaped the adventure.",
      });

    } catch (error) {
      console.error('Error generating segment:', error);
      toast({
        title: "Generation failed",
        description: "Failed to continue the story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSegment(false);
    }
  };

  const generateSegmentImage = async (segment: StorySegment) => {
    if (!story) return;

    const retryKey = `image-${segment.id}`;
    const currentRetries = retryAttempts[retryKey] || 0;
    
    if (currentRetries >= 3) {
      toast({
        title: "Image generation failed",
        description: "Max retry attempts reached. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Generating image for segment ${segment.id}, attempt ${currentRetries + 1}`);
    setGeneratingImage(segment.id);

    try {
      const { data, error } = await supabase.functions.invoke('generate-story-image', {
        body: {
          storyContent: segment.content,
          storyTitle: story.title,
          ageGroup: story.age_group,
          genre: story.genre,
          segmentNumber: segment.segment_number,
          storyId: story.id,
          segmentId: segment.id,
          characters: story.metadata?.characters || []
        }
      });

      if (error) {
        console.error('Image generation error:', error);
        setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));
        
        setTimeout(() => {
          generateSegmentImage(segment);
        }, 2000 * (currentRetries + 1)); // Exponential backoff
        return;
      }

      console.log('Image generation successful:', data);
      
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

    } catch (error) {
      console.error('Error generating image:', error);
      setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));
      
      setTimeout(() => {
        generateSegmentImage(segment);
      }, 2000 * (currentRetries + 1));
    } finally {
      setGeneratingImage(null);
    }
  };

  const generateAudio = async (segmentId: string, content: string) => {
    const retryKey = `audio-${segmentId}`;
    const currentRetries = retryAttempts[retryKey] || 0;
    
    if (currentRetries >= 3) {
      toast({
        title: "Audio generation failed",
        description: "Max retry attempts reached. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Generating audio for segment ${segmentId}, attempt ${currentRetries + 1}`);
    setGeneratingAudio(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-story-audio', {
        body: {
          text: content,
          voiceId: '9BWtsMINqrJLrRacOk9x', // Default Aria voice
          storyId: story?.id,
          segmentId,
          modelId: 'eleven_multilingual_v2'
        }
      });

      if (error) {
        console.error('Audio generation error:', error);
        setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));
        
        // Retry with exponential backoff
        setTimeout(() => {
          generateAudio(segmentId, content);
        }, 2000 * (currentRetries + 1));
        return;
      }

      console.log('Audio generation successful:', data);

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

    } catch (error) {
      console.error('Error generating audio:', error);
      setRetryAttempts(prev => ({ ...prev, [retryKey]: currentRetries + 1 }));
      
      // Retry with exponential backoff
      setTimeout(() => {
        generateAudio(segmentId, content);
      }, 2000 * (currentRetries + 1));
      
      toast({
        title: "Audio generation failed",
        description: `Retrying... (Attempt ${currentRetries + 1}/3)`,
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
      audio.onended = () => setIsPlaying(false);
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
  };

  const handleEndStory = () => {
    navigate(`/story/${id}/end`);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-card border-b border-primary/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-gradient">
                {story.title}
              </h1>
              <p className="text-text-secondary">
                {story.genre} • {story.age_group} • Segment {currentSegmentIndex + 1} of {segments.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsLiked(!isLiked)}
                variant="outline"
                className={`btn-icon ${isLiked ? 'text-red-400' : 'text-text-secondary'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" className="btn-icon">
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
                      console.error('Image failed to load:', currentSegment.image_url);
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

              {/* Audio Controls */}
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

              {/* Story Text */}
              <div className="prose prose-lg max-w-none">
                <div className="text-text-primary leading-relaxed text-lg">
                  {currentSegment.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-6">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Choices Section - Show when we're on the latest segment and it's not an ending */}
          {currentSegment && !currentSegment.is_ending && currentSegment.choices.length > 0 && currentSegmentIndex === segments.length - 1 && (
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
              )}
            </div>
          )}

          {/* End Story Button */}
          {currentSegment?.is_ending && (
            <div className="glass-card-elevated p-8 mb-8 text-center">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 glow-amber" />
              <h3 className="text-2xl font-heading font-semibold mb-4">
                The End
              </h3>
              <p className="text-text-secondary mb-6">
                What an amazing adventure! Your story is complete.
              </p>
              <Button onClick={handleEndStory} className="btn-primary text-lg px-8">
                <Sparkles className="w-5 h-5 mr-2" />
                Finish Story
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
              {!currentSegment?.is_ending && (
                <Button
                  onClick={handleEndStory}
                  variant="outline"
                  className="btn-secondary"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  End Story
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
    </div>
  );
};

export default StoryViewer;