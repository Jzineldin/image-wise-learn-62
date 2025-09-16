import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share, ThumbsUp, BookOpen, Edit, Eye, Home, User, Settings, Coins, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StoryModeToggle, StoryModeIndicator } from './StoryModeToggle';
import CreditDisplay from '@/components/CreditDisplay';

interface StoryControlsProps {
  viewMode: 'creation' | 'experience';
  isOwner: boolean;
  isLiked: boolean;
  isReadingMode: boolean;
  isFullscreen: boolean;
  isCompleted?: boolean;
  generatingEnding?: boolean;
  onModeChange: (mode: 'creation' | 'experience') => void;
  onShare: () => void;
  onToggleLike: () => void;
  onToggleReadingMode: () => void;
  onToggleFullscreen: () => void;
  onEndStory?: () => void;
}

export const StoryControls = ({
  viewMode,
  isOwner,
  isLiked,
  isReadingMode,
  isFullscreen,
  isCompleted = false,
  generatingEnding = false,
  onModeChange,
  onShare,
  onToggleLike,
  onToggleReadingMode,
  onToggleFullscreen,
  onEndStory
}: StoryControlsProps) => {
  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <nav className="glass-card border-b border-primary/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <span className="text-xl font-heading font-bold text-gradient">Tale Forge</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/dashboard" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/discover" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                Discover
              </Link>
              <Link to="/my-stories" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                My Stories
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <CreditDisplay compact />
              <Link to="/settings">
                <Button variant="outline" size="sm" className="btn-secondary flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Story Controls */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border rounded-lg">
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <StoryModeToggle
              mode={viewMode}
              onModeChange={onModeChange}
              isOwner={isOwner}
            />
            
            {/* Mode Indicator */}
            <StoryModeIndicator mode={viewMode} isOwner={isOwner} />
          </div>

          <div className="flex items-center gap-2">
            {/* End Story Button - Only for owners in creation mode */}
            {isOwner && viewMode === 'creation' && !isCompleted && onEndStory && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onEndStory}
                disabled={generatingEnding}
                className="flex items-center gap-2"
              >
                {generatingEnding ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Ending...
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    End Story
                  </>
                )}
              </Button>
            )}

            {/* Reading Mode Toggle */}
            <Button
              variant={isReadingMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleReadingMode}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Reading Mode
            </Button>

            {/* Like Button */}
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={onToggleLike}
              className="flex items-center gap-2"
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>

            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};