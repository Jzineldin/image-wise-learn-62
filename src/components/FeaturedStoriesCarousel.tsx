import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/LazyImage';
import { useFeaturedStories } from '@/hooks/useDataFetching';
import { logger } from '@/lib/logger';
import { ANIMATION_DELAYS } from '@/lib/constants/query-constants';
import { StoryPlayerModal } from '@/components/StoryPlayerModal';

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
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const { data: featuredStories = [], isLoading: loading } = useFeaturedStories();

  // Auto-play functionality with proper cleanup
  useEffect(() => {
    // Pause auto-play when modal is open
    if (!isAutoPlaying || featuredStories.length <= 1 || selectedStoryId) return;
    
    let lastTimeoutId: NodeJS.Timeout;
    const intervalId = setInterval(() => {
       setIsTransitioning(true);
       const timeoutId = setTimeout(() => {
         setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
         setIsTransitioning(false);
       }, ANIMATION_DELAYS.transition);
       lastTimeoutId = timeoutId;
     }, ANIMATION_DELAYS.carouselInterval);

     return () => {
       clearInterval(intervalId);
       if (lastTimeoutId) clearTimeout(lastTimeoutId);
     };
  }, [featuredStories.length, isAutoPlaying, selectedStoryId]);

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

  // Context7 Pattern: Memoize event handlers to prevent re-renders
  const handleMouseEnter = useCallback(() => {
    if (selectedStoryId) return; // Don't change auto-play state when modal is open
    setIsAutoPlaying(false);
  }, [selectedStoryId]);

  const handleMouseLeave = useCallback(() => {
    if (selectedStoryId) return; // Don't change auto-play state when modal is open
    setIsAutoPlaying(true);
  }, [selectedStoryId]);

  // Context7 Pattern: Memoize current story to prevent unnecessary recalculations
  const currentStory = useMemo(() =>
    featuredStories[currentIndex],
    [featuredStories, currentIndex]
  );

  // Memoize modal close handler to prevent re-renders
  const handleCloseModal = useCallback(() => {
    setSelectedStoryId(null);
  }, []);

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
            <Button variant="default" size="lg" className="w-full bg-gradient-to-r from-accent to-secondary">
              Create Your First Story
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        role="region"
        aria-label="Featured stories carousel"
        aria-live="polite"
        className="relative w-full rounded-2xl overflow-hidden min-h-[500px] aspect-[4/5] shadow-2xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all duration-500 hover:scale-[1.02] group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      {/* Background Image with Lazy Loading */}
      {currentStory.preview_image_url ? (
        <LazyImage
          key={`${currentStory.story_id}-${currentStory.preview_image_url}`}
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
        ? 'bg-gradient-to-t from-black/95 via-black/70 to-black/30 group-hover:from-black/98 group-hover:via-black/80'
        : ''
      }`} />

      {/* Fallback icon when no image */}
      {!currentStory.preview_image_url && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center z-10">
          <BookOpen className="w-10 h-10 text-foreground" />
        </div>
      )}

      <div
        key={currentStory.story_id}
        className={`relative z-10 p-8 text-center space-y-6 min-h-full flex flex-col justify-end transition-all duration-300 ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Story Info */}
        <div className="space-y-4 bg-gradient-to-t from-black/40 to-transparent p-6 rounded-t-xl -mx-8 -mb-8 pb-8">
          <h3 className="text-2xl font-heading font-bold text-foreground line-clamp-2 drop-shadow-2xl">
            {currentStory.title}
          </h3>

          <p className="text-foreground/95 text-sm drop-shadow-lg font-medium">
            by {currentStory.author_name || 'Anonymous'}
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs backdrop-blur-md bg-white/25 border-white/40 shadow-lg font-semibold">
              {currentStory.genre}
            </Badge>
            <Badge variant="outline" className="text-xs backdrop-blur-md bg-white/15 border-white/40 shadow-lg font-semibold">
              Ages {currentStory.age_group}
            </Badge>
          </div>

          {currentStory.description && (
            <p className="text-foreground/90 text-base leading-relaxed line-clamp-3 drop-shadow-lg">
              {currentStory.description}
            </p>
          )}

          {/* Read Story Button */}
          <Button
            variant="default"
            size="lg"
            onClick={() => setSelectedStoryId(currentStory.story_id)}
            className="w-full bg-gradient-to-r from-accent to-secondary shadow-2xl hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300 text-base py-6 font-bold mt-6"
          >
            Read This Story
          </Button>

          {/* Navigation Controls */}
          {featuredStories.length > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStory}
                aria-label="Previous featured story"
                aria-controls="featured-stories-carousel"
                className="text-foreground/80 hover:text-foreground hover:bg-white/25 backdrop-blur-md border border-white/30 hover:border-white/50 hover:scale-110 transition-all duration-300 shadow-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex gap-2.5" role="group" aria-label="Story indicators">
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
                    className={`w-3 h-3 rounded-full transition-all duration-300 shadow-lg hover:scale-150 ${
                      index === currentIndex
                        ? 'bg-foreground shadow-2xl w-8'
                        : 'bg-foreground/40 hover:bg-foreground/70'
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
                className="text-foreground/80 hover:text-foreground hover:bg-white/25 backdrop-blur-md border border-white/30 hover:border-white/50 hover:scale-110 transition-all duration-300 shadow-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Story Player Modal - Rendered outside carousel to prevent hover conflicts */}
      {selectedStoryId && (
        <StoryPlayerModal
          storyId={selectedStoryId}
          isOpen={!!selectedStoryId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default memo(FeaturedStoriesCarousel);