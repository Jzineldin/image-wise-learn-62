import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/LazyImage';
import { useFeaturedStories } from '@/hooks/useDataFetching';
import { logger } from '@/lib/logger';
import { ANIMATION_DELAYS } from '@/lib/constants/query-constants';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { data: featuredStories = [], isLoading: loading } = useFeaturedStories();

  // Auto-play functionality with proper cleanup
  useEffect(() => {
    if (!isAutoPlaying || featuredStories.length <= 1) return;
    
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    intervalId = setInterval(() => {
      setIsTransitioning(true);
      timeoutId = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
        setIsTransitioning(false);
      }, ANIMATION_DELAYS.transition);
    }, ANIMATION_DELAYS.carouselInterval);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
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

  // Remove the old loadFeaturedStories function as it's handled by React Query

  const nextStory = useCallback(() => {
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    
    const transitionTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
      setIsTransitioning(false);
      
      const resumeTimeout = setTimeout(() => setIsAutoPlaying(true), 1000);
      
      return () => {
        clearTimeout(transitionTimeout);
        clearTimeout(resumeTimeout);
      };
    }, 150);
  }, [featuredStories.length]);

  const prevStory = useCallback(() => {
    setIsTransitioning(true);
    setIsAutoPlaying(false);
    
    const transitionTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + featuredStories.length) % featuredStories.length);
      setIsTransitioning(false);
      
      const resumeTimeout = setTimeout(() => setIsAutoPlaying(true), 1000);
      
      return () => {
        clearTimeout(transitionTimeout);
        clearTimeout(resumeTimeout);
      };
    }, 150);
  }, [featuredStories.length]);

  // Context7 Pattern: Memoize event handlers to prevent re-renders
  const handleMouseEnter = useCallback(() => {
    setIsAutoPlaying(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsAutoPlaying(true);
  }, []);

  // Context7 Pattern: Memoize current story to prevent unnecessary recalculations
  const currentStory = useMemo(() =>
    featuredStories[currentIndex],
    [featuredStories, currentIndex]
  );

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

  return (
    <div
      role="region"
      aria-label="Featured stories carousel"
      aria-live="polite"
      className="relative max-w-md w-full rounded-2xl overflow-hidden min-h-[400px] shadow-2xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all duration-500 hover:scale-[1.02] group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Image with Lazy Loading */}
      {currentStory.preview_image_url ? (
        <LazyImage
          src={currentStory.preview_image_url}
          alt={`${currentStory.title} preview`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 glass-card-dark" />
      )}
      
      {/* Background overlay for text readability */}
      <div className={`absolute inset-0 transition-all duration-500 ${currentStory.preview_image_url
        ? 'bg-gradient-to-t from-black/90 via-black/60 to-black/40 group-hover:from-black/95 group-hover:via-black/70'
        : ''
      }`} />
      
      {/* Fallback icon when no image */}
      {!currentStory.preview_image_url && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center z-10">
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
              aria-label="Previous featured story"
              aria-controls="featured-stories-carousel"
              className="text-foreground/70 hover:text-foreground hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-110 transition-all duration-300 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-2" role="group" aria-label="Story indicators">
              {featuredStories.map((story, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true);
                    setIsAutoPlaying(false);

                    const transitionTimeout = setTimeout(() => {
                      setCurrentIndex(index);
                      setIsTransitioning(false);

                      const resumeTimeout = setTimeout(() => setIsAutoPlaying(true), 1000);

                      return () => {
                        clearTimeout(transitionTimeout);
                        clearTimeout(resumeTimeout);
                      };
                    }, 150);
                  }}
                  aria-label={`Go to story ${index + 1}: ${story.title}`}
                  aria-current={index === currentIndex ? 'true' : 'false'}
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
              aria-label="Next featured story"
              aria-controls="featured-stories-carousel"
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