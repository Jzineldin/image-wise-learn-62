import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, BookOpen, Share2, Volume2, Play, CheckCircle, Clock, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { logger, generateRequestId } from '@/lib/debug';
import { AIClient, AIClientError, InsufficientCreditsError } from '@/lib/api/ai-client';

interface Story {
  id: string;
  title: string;
  description: string;
  status: string;
  genre: string;
  age_group: string;
  metadata: any;
}

interface StorySegment {
  id: string;
  segment_number: number;
  content: string;
  audio_url?: string;
}

const StoryEnd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedLanguage } = useLanguage();
  
  const [story, setStory] = useState<Story | null>(null);
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

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
        .single();

      if (storyError) throw storyError;
      setStory(storyData);
      setCustomTitle(storyData.title);
      setSelectedTitle(storyData.title);

      // Load story segments
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('story_segments')
        .select('id, segment_number, content, audio_url')
        .eq('story_id', id)
        .order('segment_number', { ascending: true });

      if (segmentsError) throw segmentsError;
      setSegments(segmentsData || []);

      // Generate title suggestions
      generateTitleSuggestions(storyData, segmentsData);

    } catch (error) {
      logger.error('Story loading failed', error, { storyId: id });
      toast({
        title: "Error loading story",
        description: "Failed to load the story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTitleSuggestions = async (storyData: Story, segmentsData: StorySegment[]) => {
    const requestId = generateRequestId();
    setGeneratingTitles(true);
    
    try {
      const fullStoryContent = segmentsData.map(s => s.content).join('\n\n');
      
      logger.info('🎭 Starting title generation', {
        requestId,
        storyId: storyData.id,
        contentLength: fullStoryContent.length,
        ageGroup: storyData.age_group,
        genre: storyData.genre
      });
      
      const { data, error } = await supabase.functions.invoke('generate-story-title', {
        body: {
          storyContent: fullStoryContent,
          ageGroup: storyData.age_group,
          genre: storyData.genre,
          characters: storyData.metadata?.characters || [],
          currentTitle: storyData.title,
          requestId
        }
      });

      if (error) {
        logger.error('❌ Title generation failed', error, { requestId, storyId: storyData.id });
        throw error;
      }

      logger.debug('🎭 Title generation response', { requestId, data });
      
      // Defensive parsing of response
      const titles = Array.isArray(data?.titles) ? data.titles : 
                    Array.isArray(data?.suggested_titles) ? data.suggested_titles :
                    Array.isArray(data) ? data : [];
      
      if (titles.length === 0) {
        logger.warn('⚠️ No titles returned from API, using fallbacks', { requestId, responseData: data });
      }
      
      const safeTitles = titles.length > 0 ? titles : [
        storyData.title,
        `The ${storyData.genre.charAt(0).toUpperCase() + storyData.genre.slice(1)} Adventure`,
        `A Magical Tale`,
        `The Great Journey`,
        `An Unforgettable Story`
      ];
      
      setTitleSuggestions(safeTitles);
      logger.info('✅ Title suggestions set', { requestId, count: safeTitles.length });
      
    } catch (error) {
      logger.error('❌ Error generating titles', error, { requestId, storyId: storyData.id });
      
      // Fallback titles
      const fallbackTitles = [
        storyData.title,
        `The ${storyData.genre.charAt(0).toUpperCase() + storyData.genre.slice(1)} Adventure`,
        `A Magical Tale`,
        `The Great Journey`,
        `An Unforgettable Story`
      ];
      
      setTitleSuggestions(fallbackTitles);
      
      toast({
        title: "Title generation partially failed",
        description: "Using suggested titles instead. Your story is still ready!",
        variant: "default",
      });
    } finally {
      setGeneratingTitles(false);
    }
  };

  const generateMissingAudio = async () => {
    // Reload segments to get fresh data
    await loadStory();
    
    const segmentsWithoutAudio = segments.filter(s => !s.audio_url);
    
    if (segmentsWithoutAudio.length === 0) {
      toast({
        title: "All set!",
        description: "All segments already have audio.",
      });
      return;
    }

    setGeneratingAudio(true);
    let successCount = 0;
    
    try {
      for (const segment of segmentsWithoutAudio) {
        // Double-check segment doesn't have audio
        const { data: freshSegment } = await supabase
          .from('story_segments')
          .select('audio_url')
          .eq('id', segment.id)
          .single();
          
        if (freshSegment?.audio_url) {
          logger.info('Segment already has audio, skipping', { segmentId: segment.id });
          continue;
        }

        // Select voice based on language
        const voiceId = selectedLanguage === 'sv'
          ? 'aSLKtNoVBZlxQEMsnGL2' // Sanna - Swedish female voice
          : '9BWtsMINqrJLrRacOk9x'; // Aria - English female voice

        try {
          const result = await AIClient.invoke('generate-story-audio', {
            text: segment.content,
            voiceId: voiceId,
            languageCode: selectedLanguage,
            storyId: story?.id,
            segmentId: segment.id,
            modelId: 'eleven_multilingual_v2'
          });

          if (!result.success) {
            logger.error('Audio generation failed for segment', result.error, { segmentId: segment.id });
            continue;
          }

          // Handle both response formats
          const audioUrl = result.data?.audioUrl || result.data?.audio_url;
          if (audioUrl) {
            // Update local state
            setSegments(prev => prev.map(s =>
              s.id === segment.id
                ? { ...s, audio_url: audioUrl }
                : s
            ));
            successCount++;
          }

        } catch (error) {
          if (error instanceof InsufficientCreditsError) {
            toast({
              title: "Insufficient Credits",
              description: `Need ${error.required} credits, have ${error.available}`,
              variant: "destructive",
            });
            break;
          } else if (error instanceof AIClientError) {
            logger.error('Audio generation AI client error', error, { segmentId: segment.id });
            toast({
              title: "Audio Generation Failed",
              description: error.message,
              variant: "destructive",
            });
            continue;
          } else {
            logger.error('Unexpected audio generation error', error, { segmentId: segment.id });
            continue;
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: "Audio generation complete!",
          description: `Generated audio for ${successCount} segments.`,
        });
      }

    } catch (error) {
      logger.error('Audio generation batch failed', error, { storyId: story?.id });
      toast({
        title: "Audio generation failed",
        description: "Some audio files may not have been generated.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAudio(false);
    }
  };

  const finalizeStory = async () => {
    if (!story || !user) return;

    const requestId = generateRequestId();
    setFinalizing(true);
    
    try {
      const finalTitle = customTitle.trim() || selectedTitle;
      
      logger.info('📚 Finalizing story', {
        requestId,
        storyId: story.id,
        finalTitle,
        segmentCount: segments.length,
        hasMetadata: !!story.metadata
      });
      
      // Safely handle metadata - ensure it's an object
      const safeMetadata = story.metadata && typeof story.metadata === 'object' ? story.metadata : {};
      
      // Update story with final title and mark as completed
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          title: finalTitle,
          status: 'completed',
          is_completed: true,
          is_complete: true,
          visibility: 'private', // Can be changed later in settings
          metadata: {
            ...safeMetadata,
            completion_date: new Date().toISOString(),
            final_segment_count: segments.length,
            has_audio: segments.some(s => s.audio_url),
            completed_via: 'story_end_page'
          }
        })
        .eq('id', story.id);

      if (updateError) {
        logger.error('❌ Story finalization failed', updateError, { requestId, storyId: story.id });
        throw updateError;
      }

      logger.info('✅ Story finalized successfully', { requestId, storyId: story.id });
      
      toast({
        title: "Story completed!",
        description: "Your adventure has been saved successfully.",
      });

      // Navigate to dashboard or story viewer
      navigate('/dashboard');

    } catch (error) {
      logger.error('❌ Error finalizing story', error, { requestId, storyId: story?.id });
      toast({
        title: "Finalization failed",
        description: "Failed to complete the story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFinalizing(false);
    }
  };

  const shareStory = async () => {
    if (!story) return;

    try {
      await navigator.share({
        title: selectedTitle || story.title,
        text: `Check out this amazing story: ${selectedTitle || story.title}`,
        url: window.location.origin + `/story/${story.id}`
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.origin + `/story/${story.id}`);
      toast({
        title: "Link copied!",
        description: "Story link has been copied to clipboard.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              Story not found
            </CardTitle>
            <CardDescription>
              The story you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const segmentsWithoutAudio = segments.filter(s => !s.audio_url).length;
  const totalWords = segments.reduce((acc, s) => acc + s.content.split(' ').length, 0);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold">
                🎉 Story Complete!
              </CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Your magical adventure is finished. Let's give it the perfect title and add some final touches.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Story Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Adventure Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">{segments.length}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Segments
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {story.genre}
                  </Badge>
                  <div className="text-sm text-muted-foreground">Genre</div>
                </div>
                <div className="text-center space-y-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {story.age_group}
                  </Badge>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    Age Group
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-green-500">
                    {segments.length - segmentsWithoutAudio}/{segments.length}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Volume2 className="h-3 w-3" />
                    With Audio
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Total word count</div>
                <div className="text-2xl font-semibold">{totalWords.toLocaleString()} words</div>
              </div>
            </CardContent>
          </Card>

          {/* Title Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Choose Your Perfect Title
              </CardTitle>
              <CardDescription>
                Select an AI-generated suggestion or create your own custom title.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Custom Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Title</label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter your own title..."
                  className="text-lg"
                />
              </div>

              {/* AI Generated Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">AI Suggestions</label>
                  {generatingTitles && (
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Generating...
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(titleSuggestions || []).map((title, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTitle === title 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTitle(title)}
                    >
                      <CardContent className="p-4">
                        <p className="font-medium text-center">{title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">
                    {customTitle.trim() || selectedTitle}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Audio Completion */}
          {segmentsWithoutAudio > 0 && (
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Volume2 className="h-5 w-5" />
                  Complete Audio Experience
                </CardTitle>
                <CardDescription>
                  {segmentsWithoutAudio} segments don't have audio yet. Generate audio to create a fully immersive experience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateMissingAudio}
                  disabled={generatingAudio}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {generatingAudio ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Generate Missing Audio
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Final Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  onClick={() => navigate(`/story/${story.id}?mode=experience`)}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Read Story
                </Button>
                
                <Button
                  onClick={shareStory}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Story
                </Button>
                
                <Button
                  onClick={finalizeStory}
                  disabled={finalizing}
                  size="lg"
                  className="flex-1"
                >
                  {finalizing ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Complete Story
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default StoryEnd;