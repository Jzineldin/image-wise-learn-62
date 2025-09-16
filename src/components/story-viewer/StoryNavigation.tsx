import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface StoryNavigationProps {
  currentSegmentIndex: number;
  totalSegments: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onJumpToSegment: (index: number) => void;
  onEndStory?: () => void;
  showEndStory?: boolean;
  viewMode?: 'creation' | 'experience';
}

export const StoryNavigation = ({
  currentSegmentIndex,
  totalSegments,
  onNavigate,
  onJumpToSegment,
  onEndStory,
  showEndStory = false,
  viewMode = 'creation'
}: StoryNavigationProps) => {
  const canGoPrevious = currentSegmentIndex > 0;
  const canGoNext = currentSegmentIndex < totalSegments - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-card border rounded-lg p-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('prev')}
        disabled={!canGoPrevious}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Segment indicator */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: Math.min(totalSegments, 5) }, (_, i) => {
          // Show first 2, current, and last 2 segments if there are many
          let segmentIndex;
          if (totalSegments <= 5) {
            segmentIndex = i;
          } else if (i < 2) {
            segmentIndex = i;
          } else if (i === 4) {
            segmentIndex = totalSegments - 1;
          } else if (i === 3) {
            segmentIndex = Math.max(2, Math.min(totalSegments - 2, currentSegmentIndex));
          } else {
            segmentIndex = currentSegmentIndex;
          }

          const isActive = segmentIndex === currentSegmentIndex;
          const isCurrent = segmentIndex === currentSegmentIndex;

          return (
            <button
              key={`${i}-${segmentIndex}`}
              onClick={() => onJumpToSegment(segmentIndex)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {segmentIndex + 1}
            </button>
          );
        })}

        {totalSegments > 5 && currentSegmentIndex < totalSegments - 3 && (
          <span className="text-muted-foreground">...</span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('next')}
        disabled={!canGoNext}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
      </div>

      {/* End Story Button - Only show in creation mode */}
      {showEndStory && viewMode === 'creation' && onEndStory && (
        <div className="flex justify-center">
          <Button
            onClick={onEndStory}
            variant="secondary"
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-200 hover:border-amber-300"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            End Story
          </Button>
        </div>
      )}
    </div>
  );
};