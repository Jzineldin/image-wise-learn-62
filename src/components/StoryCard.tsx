import { Link, useNavigate } from 'react-router-dom';
import { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Eye, Settings, Calendar, Globe, Lock, BookOpen, Volume2, CheckCircle2 } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { CardImage } from '@/components/ui/optimized-image';

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    description?: string;
    genre: string;
    age_group: string;
    status?: string;
    visibility?: string;
    created_at: string;
    cover_image?: string;
    cover_image_url?: string;
    author_id?: string;
    author_name?: string;
    // optional metadata used for UI badges/indicators
    segment_count?: number;
    audio_segments?: number;
    content_segments?: number;
  };
  variant?: 'default' | 'background' | 'discover';
  showActions?: boolean;
  showStatus?: boolean;
  onSettingsClick?: () => void;
  currentUserId?: string | null;
}

// Context7 Pattern: Memoized component to prevent unnecessary re-renders
const StoryCard = memo(({
  story,
  variant = 'default',
  showActions = false,
  showStatus = true,
  onSettingsClick,
  currentUserId
}: StoryCardProps) => {
  const navigate = useNavigate();



  // Context7 Pattern: useMemo for expensive completion percentage calculation
  const completionPercent = useMemo(() => {
    if (!story.segment_count || story.segment_count <= 0) return null;

    const ratios: number[] = [];
    if (typeof story.content_segments === 'number') {
      ratios.push(story.content_segments / story.segment_count);
    }
    if (typeof story.audio_segments === 'number') {
      ratios.push(story.audio_segments / story.segment_count);
    }
    if (ratios.length === 0) return null;

    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    return Math.min(100, Math.max(0, Math.round(avg * 100)));
  }, [story.segment_count, story.content_segments, story.audio_segments]);

  // Context7 Pattern: Memoize derived values
  const imageUrl = useMemo(() =>
    story.cover_image || story.cover_image_url,
    [story.cover_image, story.cover_image_url]
  );

  // Context7 Pattern: useCallback for functions to prevent child re-renders
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'in_progress':
        return 'bg-warning/20 text-warning';
      case 'draft':
        return 'bg-muted/20 text-muted-foreground';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'Complete';
      case 'in_progress':
        return 'In Progress';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  }, []);

  // Context7 Pattern: Memoize event handlers to prevent unnecessary re-renders
  const handleSettingsClick = useCallback(() => {
    if (onSettingsClick) {
      onSettingsClick();
    }
  }, [onSettingsClick]);

  if (variant === 'background' && imageUrl) {
    return (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Read story: ${story.title} - ${story.genre} for ${story.age_group}`}
          className="relative h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => navigate(`/story/${story.id}?mode=experience`)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/story/${story.id}?mode=experience`); } }}
        >
          {/* Background overlay - ignore pointer events so buttons remain clickable */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/90 group-hover:via-black/50 transition-all duration-300" />

          {/* Quick settings (preserve card click by stopping propagation) */}
          {showActions && onSettingsClick && (
            <div className="absolute top-3 right-3 z-20 pointer-events-auto">
              <Button
                variant="outline"
                size="icon"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSettingsClick(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSettingsClick(); } }}
                aria-label="Story settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Visibility chip */}
          {story.visibility && (
            <div className="absolute bottom-3 left-3 z-10">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {story.visibility}
              </Badge>
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 p-6 h-full flex flex-col justify-end text-white">
            <div className="space-y-2">
              <div className="flex gap-2 mb-2">
                {showStatus && story.status && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {getStatusLabel(story.status)}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {story.genre}
                </Badge>
                <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                  {story.age_group}
                </Badge>
              </div>

              <h3 className="text-lg font-semibold line-clamp-2 drop-shadow-lg">
                {story.title}
              </h3>

              {story.description && (
                <p className="text-white/90 text-sm line-clamp-2 drop-shadow-md">
                  {story.description}
                </p>
              )}

              {(story.author_name || story.author_id) && (
                <p className="text-white/80 text-xs">
                  by {story.author_name || (currentUserId && story.author_id === currentUserId ? 'You' : 'Anonymous')}
                </p>
              )}
            </div>
          </div>
        </div>

    );
  }

  if (variant === 'discover') {
    return (
      <Link
        to={`/story/${story.id}?mode=experience`}
        aria-label={`Read story: ${story.title} by ${story.author_name || 'Anonymous'} - ${story.genre} for ${story.age_group}`}
      >
        <div className="glass-card-interactive group cursor-pointer">
          {/* Cover Image */}
          <div className="relative overflow-hidden rounded-t-lg">
            {imageUrl ? (
              <CardImage
                src={imageUrl}
                alt={story.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
                <Book className="w-16 h-16 text-primary/50" />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground">
                {story.age_group}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-3">
              {story.title}
            </h3>

            <p className="text-text-secondary text-sm mb-2">
              by {story.author_name || (currentUserId && story.author_id === currentUserId ? 'You' : 'Anonymous')}
            </p>
            <p className="text-primary text-sm font-medium mb-3">
              {story.genre}
            </p>
            <p className="text-text-secondary text-sm mb-6 line-clamp-3">
              {story.description}
            </p>

            <Button variant="default" size="lg" className="w-full">
              Read Story
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  // Default card variant
  return (
    <Card className="glass-card-interactive group overflow-hidden">
      {imageUrl && (
        <div className="aspect-video bg-muted relative overflow-hidden">
          <CardImage
            src={imageUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {showStatus && story.status && (
            <div className="absolute top-2 right-2">
              <Badge className={getStatusColor(story.status)}>
                {getStatusLabel(story.status)}
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
              {story.title}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{story.genre}</Badge>
              <Badge variant="outline">{story.age_group}</Badge>
            </div>
          </div>
        </div>
        {!imageUrl && showStatus && story.status && (
          <div className="mt-2">
            <Badge className={getStatusColor(story.status)}>
              {getStatusLabel(story.status)}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {story.description && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-3">
            {story.description}

          </p>
        )}

        <div className="flex justify-between items-center text-xs text-text-secondary mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(story.created_at).toLocaleDateString()}
          </div>
          {story.visibility && (
            <div className="flex items-center gap-1">
              {story.visibility === 'public' ? (
                <Globe className="w-3 h-3 text-success" />
              ) : (
                <Lock className="w-3 h-3 text-warning" />
              )}
              <Badge variant="secondary" className="text-xs">
                {story.visibility}
              </Badge>
            </div>
          )}
        </div>

        {/* Metadata row: chapters, audio, completion */}
        <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
          <div className="flex items-center gap-4">
            {story.segment_count != null && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {story.segment_count} chapters
              </span>
            )}
            {story.audio_segments != null && story.segment_count != null && (
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                {story.audio_segments}/{story.segment_count} audio
              </span>
            )}
          </div>
          {story.status === 'completed' && (
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>
        {typeof completionPercent === 'number' && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <Progress value={completionPercent} className="h-2" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-help">{completionPercent}%</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    Combined completion based on text and audio.
                    <div className="mt-1 opacity-80">
                      {typeof story.content_segments === 'number' && typeof story.segment_count === 'number' && (
                        <div>Text: {story.content_segments}/{story.segment_count}</div>
                      )}
                      {typeof story.audio_segments === 'number' && typeof story.segment_count === 'number' && (
                        <div>Audio: {story.audio_segments}/{story.segment_count}</div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            <Link to={`/story/${story.id}?mode=experience`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </Link>
            {onSettingsClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSettingsClick}
                className="px-3"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Context7 Pattern: Named export for better debugging
StoryCard.displayName = 'StoryCard';

export default StoryCard;