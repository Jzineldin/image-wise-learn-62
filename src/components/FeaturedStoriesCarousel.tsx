import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedStory {
  story_id: string;
  title: string;
  description: string;
  author_name: string;
  genre: string;
  age_group: string;
  cover_image_url: string;
  story_position: number;
  created_at: string;
  preview_image_url: string;
}

const FeaturedStoriesCarousel = () => {
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadFeaturedStories();
  }, []);

  const loadFeaturedStories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_featured_stories', { limit_count: 10 });
      
      if (error) {
        console.error('Error loading featured stories:', error);
        return;
      }

      setFeaturedStories(data || []);
    } catch (error) {
      console.error('Error loading featured stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredStories.length) % featuredStories.length);
  };

  if (loading) {
    return (
      <div className="glass-card-dark p-8 max-w-md w-full rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-full"></div>
          <div className="h-6 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (featuredStories.length === 0) {
    return (
      <div className="glass-card-dark p-8 max-w-md w-full rounded-2xl">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-foreground" />
          </div>
          
          <h3 className="text-2xl font-heading font-bold text-foreground">
            DISCOVER AMAZING STORIES
          </h3>
          
          <p className="text-foreground/80 leading-relaxed">
            Start your magical journey by creating your own personalized story
          </p>
          
          <Link to="/create">
            <Button className="btn-accent w-full text-lg py-3">
              Create Your First Story
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStory = featuredStories[currentIndex];

  return (
    <div className="glass-card-dark p-8 max-w-md w-full rounded-2xl relative">
      <div className="text-center space-y-6">
        {/* Story Image */}
        <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden">
          {currentStory.preview_image_url ? (
            <img
              src={currentStory.preview_image_url}
              alt={currentStory.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-foreground" />
            </div>
          )}
        </div>

        {/* Story Info */}
        <div className="space-y-3">
          <h3 className="text-xl font-heading font-bold text-foreground line-clamp-2">
            {currentStory.title}
          </h3>
          
          <p className="text-foreground/80 text-sm">
            by {currentStory.author_name || 'Anonymous'}
          </p>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentStory.genre}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Ages {currentStory.age_group}
            </Badge>
          </div>

          {currentStory.description && (
            <p className="text-foreground/70 text-sm leading-relaxed line-clamp-3">
              {currentStory.description}
            </p>
          )}
        </div>

        {/* Read Story Button */}
        <Link to={`/story/${currentStory.story_id}`}>
          <Button className="btn-accent w-full text-lg py-3">
            Read This Story
          </Button>
        </Link>

        {/* Navigation Controls */}
        {featuredStories.length > 1 && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStory}
              className="text-foreground/60 hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-1">
              {featuredStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-foreground' : 'bg-foreground/30'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={nextStory}
              className="text-foreground/60 hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedStoriesCarousel;