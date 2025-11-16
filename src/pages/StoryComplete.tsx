import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import HeroBackground from '@/components/HeroBackground';
import { CheckCircle2, BookOpen, Share2, PlusCircle, Home, Calendar, Sparkles, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  title: string;
  genre: string | null;
  age_group: string | null;
  created_at: string;
  visibility: string | null;
  description: string | null;
}

export default function StoryComplete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [segmentCount, setSegmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStory();
  }, [id]);

  async function loadStory() {
    if (!id) {
      navigate('/');
      return;
    }

    try {
      setLoading(true);

      // Load story details
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('id, title, genre, age_group, created_at, visibility, description')
        .eq('id', id)
        .single();

      if (storyError) throw storyError;

      // Count segments
      const { count, error: countError } = await supabase
        .from('story_segments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', id);

      if (countError) throw countError;

      setStory(storyData);
      setSegmentCount(count || 0);
    } catch (error: any) {
      console.error('Error loading story:', error);
      toast({
        title: 'Error',
        description: 'Failed to load story details. Please try again.',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!story) return;

    // Check if story is public
    if (story.visibility !== 'public') {
      toast({
        title: 'Story is private',
        description: 'Make your story public to share it with others.',
        variant: 'default',
      });
      return;
    }

    const shareUrl = `${window.location.origin}/story/${story.id}`;
    const shareText = `Check out my story "${story.title}" on Tale Forge!`;

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
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied!',
          description: 'Story link copied to clipboard.',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to copy link to clipboard.',
          variant: 'destructive',
        });
      }
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <HeroBackground />
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400/20 to-blue-500/20 backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground">Loading your story...</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <HeroBackground />
        <div className="relative z-10 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Story not found</h1>
          <Button onClick={() => navigate('/')} variant="default">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <HeroBackground />

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
          {/* Celebration Header */}
          <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 shadow-2xl shadow-emerald-500/25 mb-4 animate-in zoom-in duration-500 delay-150">
              <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-lg" />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
              Story Complete! 🎉
            </h1>

            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-semibold text-foreground">
                {story.title}
              </p>
              {story.description && (
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  {story.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom-8 duration-700 delay-300">
            {/* Segment Count Card */}
            <Card className="border-2 border-primary/20 bg-card/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Chapters Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {segmentCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {segmentCount === 1 ? 'chapter' : 'chapters'} in your story
                </p>
              </CardContent>
            </Card>

            {/* Genre Card */}
            <Card className="border-2 border-primary/20 bg-card/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Story Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-foreground">
                  {story.genre || 'Creative'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {story.age_group ? `For ages ${story.age_group}` : 'All ages'}
                </p>
              </CardContent>
            </Card>

            {/* Date Card */}
            <Card className="border-2 border-primary/20 bg-card/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary/40 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-xl font-bold text-foreground">
                  {formatDate(story.created_at)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your creative journey
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Celebration Message */}
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-12 duration-700 delay-500">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-2">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                Congratulations on completing your story!
              </h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                You've created something amazing! Your story with {segmentCount} {segmentCount === 1 ? 'chapter' : 'chapters'} is ready to be experienced.
                Share it with friends, revisit it anytime, or create another masterpiece!
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid sm:grid-cols-2 gap-4 animate-in slide-in-from-bottom-16 duration-700 delay-700">
            <Button
              onClick={() => navigate(`/story/${story.id}`)}
              size="lg"
              className="h-14 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
              variant="default"
            >
              <BookOpen className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Experience Your Story
            </Button>

            <Button
              onClick={handleShare}
              size="lg"
              className="h-14 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
              variant="outline"
            >
              <Share2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Share Story
            </Button>

            <Button
              onClick={() => navigate('/create')}
              size="lg"
              className="h-14 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
              variant="secondary"
            >
              <PlusCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Create New Story
            </Button>

            <Button
              onClick={() => navigate('/my-stories')}
              size="lg"
              className="h-14 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
              variant="ghost"
            >
              <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              My Stories
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-8 pb-4 animate-in fade-in duration-700 delay-1000">
            <p className="text-sm text-muted-foreground">
              Every story is a journey. Thank you for creating with Tale Forge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
