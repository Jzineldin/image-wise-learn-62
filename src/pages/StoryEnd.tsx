import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sparkles, Download, Share2, BookOpen, Volume2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

  const generateTitleSuggestions = async (storyData: Story, segmentsData: StorySegment[]) => {
    setGeneratingTitles(true);
    try {
      const fullStoryContent = segmentsData.map(s => s.content).join('\n\n');
      
      const { data, error } = await supabase.functions.invoke('generate-story-title', {
        body: {
          storyContent: fullStoryContent,
          ageGroup: storyData.age_group,
          genre: storyData.genre,
          characters: storyData.metadata?.characters || [],
          currentTitle: storyData.title
        }
      });

      if (error) throw error;

      setTitleSuggestions(data.titles);
      
    } catch (error) {
      console.error('Error generating titles:', error);
      setTitleSuggestions([
        storyData.title,
        `The ${storyData.genre.charAt(0).toUpperCase() + storyData.genre.slice(1)} Adventure`,
        `A Magical Tale`,
        `The Great Journey`,
        `An Unforgettable Story`
      ]);
    } finally {
      setGeneratingTitles(false);
    }
  };

  const generateMissingAudio = async () => {
    const segmentsWithoutAudio = segments.filter(s => !s.audio_url);
    
    if (segmentsWithoutAudio.length === 0) {
      toast({
        title: "All set!",
        description: "All segments already have audio.",
      });
      return;
    }

    setGeneratingAudio(true);
    try {
      for (const segment of segmentsWithoutAudio) {
        const { data, error } = await supabase.functions.invoke('generate-story-audio', {
          body: {
            text: segment.content,
            voiceId: '9BWtsMINqrJLrRacOk9x', // Default Aria voice
            storyId: story?.id,
            segmentId: segment.id,
            modelId: 'eleven_multilingual_v2'
          }
        });

        if (error) {
          console.error('Audio generation error for segment', segment.id, error);
          continue;
        }

        // Update local state
        setSegments(prev => prev.map(s => 
          s.id === segment.id 
            ? { ...s, audio_url: data.audioUrl }
            : s
        ));
      }

      toast({
        title: "Audio generation complete!",
        description: `Generated audio for ${segmentsWithoutAudio.length} segments.`,
      });

    } catch (error) {
      console.error('Error generating audio:', error);
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

    setFinalizing(true);
    try {
      const finalTitle = customTitle.trim() || selectedTitle;
      
      // Update story with final title and mark as completed
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          title: finalTitle,
          status: 'completed',
          is_completed: true,
          is_complete: true,
          visibility: 'private', // Can be changed later
          metadata: {
            ...story.metadata,
            completion_date: new Date().toISOString(),
            final_segment_count: segments.length,
            has_audio: segments.some(s => s.audio_url)
          }
        })
        .eq('id', story.id);

      if (updateError) throw updateError;

      toast({
        title: "Story completed!",
        description: "Your adventure has been saved successfully.",
      });

      // Navigate to dashboard or story viewer
      navigate('/dashboard');

    } catch (error) {
      console.error('Error finalizing story:', error);
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

  const segmentsWithoutAudio = segments.filter(s => !s.audio_url).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="content-overlay max-w-3xl mx-auto">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-6 glow-amber" />
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-4">
                Story Complete!
              </h1>
              <p className="text-xl text-text-secondary">
                Your magical adventure is finished. Let's give it the perfect title and add some final touches.
              </p>
            </div>
          </div>

          {/* Story Statistics */}
          <div className="glass-card p-6 mb-8">
            <h2 className="text-xl font-heading font-semibold mb-4">Your Adventure</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{segments.length}</div>
                <div className="text-sm text-text-secondary">Segments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{story.genre}</div>
                <div className="text-sm text-text-secondary">Genre</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{story.age_group}</div>
                <div className="text-sm text-text-secondary">Age Group</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {segments.length - segmentsWithoutAudio}/{segments.length}
                </div>
                <div className="text-sm text-text-secondary">With Audio</div>
              </div>
            </div>
          </div>

          {/* Title Selection */}
          <div className="glass-card-elevated p-8 mb-8">
            <h2 className="text-2xl font-heading font-semibold mb-6">Choose Your Perfect Title</h2>
            
            {/* Custom Title Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Custom Title
              </label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter your own title..."
                className="input-field"
              />
            </div>

            {/* AI Generated Suggestions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-text-secondary">
                  AI Suggestions
                </label>
                {generatingTitles && (
                  <div className="flex items-center text-sm text-text-secondary">
                    <div className="loading-spinner w-4 h-4 mr-2" />
                    Generating...
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {titleSuggestions.map((title, index) => (
                  <Card
                    key={index}
                    className={`glass-card-interactive p-4 cursor-pointer transition-all ${
                      selectedTitle === title ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTitle(title)}
                  >
                    <p className="text-text-primary font-medium">{title}</p>
                  </Card>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-text-secondary">
                Selected: <span className="font-medium text-primary">
                  {customTitle.trim() || selectedTitle}
                </span>
              </p>
            </div>
          </div>

          {/* Audio Completion */}
          {segmentsWithoutAudio > 0 && (
            <div className="glass-card p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Complete Audio Experience</h3>
                  <p className="text-text-secondary">
                    {segmentsWithoutAudio} segments don't have audio yet
                  </p>
                </div>
                <Button
                  onClick={generateMissingAudio}
                  disabled={generatingAudio}
                  className="btn-primary"
                >
                  {generatingAudio ? (
                    <>
                      <div className="loading-spinner w-5 h-5 mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 mr-2" />
                      Generate Audio
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="glass-card-elevated p-8">
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={() => navigate(`/story/${story.id}`)}
                variant="outline"
                className="btn-secondary flex-1"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Review Story
              </Button>
              
              <Button
                onClick={shareStory}
                variant="outline"
                className="btn-secondary flex-1"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Story
              </Button>
              
              <Button
                onClick={finalizeStory}
                disabled={finalizing}
                className="btn-primary flex-1 text-lg"
              >
                {finalizing ? (
                  <>
                    <div className="loading-spinner w-5 h-5 mr-2" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Complete Story
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryEnd;