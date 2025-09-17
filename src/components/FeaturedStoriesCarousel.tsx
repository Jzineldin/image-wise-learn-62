import { useState, useEffect, memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/debug';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    loadFeaturedStories();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || featuredStories.length <= 1) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
        setIsTransitioning(false);
      }, 150);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredStories.length, isAutoPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevStory();
      } else if (event.key === 'ArrowRight') {
        nextStory();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadFeaturedStories = useCallback(async () => {
    try {
      setLoading(true);
      logger.info('Loading featured stories', { limit: 30 });
      const { data, error } = await supabase.rpc('get_featured_stories', { limit_count: 30 });
      
      if (error) {
        logger.error('Failed to load featured stories', error);
        return;
      }

      logger.info('Featured stories loaded successfully', { count: data?.length || 0 });
      setFeaturedStories(data || []);
    } catch (error) {
      logger.error('Unexpected error loading featured stories', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const nextStory = useCallback(() => {
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
      setIsTransitioning(false);
      setTimeout(() => setIsAutoPlaying(true), 1000);
    }, 150);
  }, [featuredStories.length]);

  const prevStory = useCallback(() => {
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + featuredStories.length) % featuredStories.length);
      setIsTransitioning(false);
      setTimeout(() => setIsAutoPlaying(true), 1000);
    }, 150);
  }, [featuredStories.length]);

  if (loading) {
    return (
      <div className="relative max-w-md w-full rounded-2xl overflow-hidden min-h-[400px] glass-card-dark">
        <div className="animate-pulse p-8 text-center space-y-6 min-h-[400px] flex flex-col justify-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded animate-pulse"></div>
            <div className="h-4 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded w-3/4 mx-auto animate-pulse"></div>
            <div className="flex items-center justify-center gap-2">
              <div className="h-5 w-16 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded animate-pulse"></div>
              <div className="h-5 w-20 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded animate-pulse"></div>
            </div>
            <div className="h-16 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded animate-pulse"></div>
          </div>
          <div className="h-12 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded animate-pulse"></div>
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
    <div 
      className="relative max-w-md w-full rounded-2xl overflow-hidden min-h-[400px] shadow-2xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all duration-500 hover:scale-[1.02] group"
      style={currentStory.preview_image_url ? {
        backgroundImage: `url(${currentStory.preview_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background overlay for text readability */}
      <div className={`absolute inset-0 transition-all duration-500 ${currentStory.preview_image_url 
        ? 'bg-gradient-to-t from-black/90 via-black/60 to-black/40 group-hover:from-black/95 group-hover:via-black/70' 
        : 'glass-card-dark'
      }`} />
      
      {/* Fallback icon when no image */}
      {!currentStory.preview_image_url && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-foreground" />
        </div>
      )}

      <div className={`relative z-10 p-8 text-center space-y-6 min-h-[400px] flex flex-col justify-center transition-all duration-300 ${
        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        {/* Story Info */}
        <div className="space-y-3">
          <h3 className="text-xl font-heading font-bold text-foreground line-clamp-2 drop-shadow-lg">
            {currentStory.title}
          </h3>
          
          <p className="text-foreground/90 text-sm drop-shadow-md">
            by {currentStory.author_name || 'Anonymous'}
          </p>

          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-white/20 border-white/30 shadow-lg">
              {currentStory.genre}
            </Badge>
            <Badge variant="outline" className="text-xs backdrop-blur-sm bg-white/10 border-white/30 shadow-lg">
              Ages {currentStory.age_group}
            </Badge>
          </div>

          {currentStory.description && (
            <p className="text-foreground/80 text-sm leading-relaxed line-clamp-3 drop-shadow-md">
              {currentStory.description}
            </p>
          )}
        </div>

        {/* Read Story Button */}
        <Link to={`/story/${currentStory.story_id}?mode=experience`}>
          <Button className="btn-accent w-full text-lg py-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
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
              className="text-foreground/70 hover:text-foreground hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 transition-all duration-300 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-2">
              {featuredStories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true);
                    setIsAutoPlaying(false);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsTransitioning(false);
                      setTimeout(() => setIsAutoPlaying(true), 1000);
                    }, 150);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 shadow-md hover:scale-125 ${
                    index === currentIndex 
                      ? 'bg-foreground shadow-lg' 
                      : 'bg-foreground/30 hover:bg-foreground/60'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={nextStory}
              className="text-foreground/70 hover:text-foreground hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 transition-all duration-300 shadow-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(FeaturedStoriesCarousel);