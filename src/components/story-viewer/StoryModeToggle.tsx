import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Sparkles, BookOpenCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StoryModeToggleProps {
  mode: 'creation' | 'experience';
  onModeChange: (mode: 'creation' | 'experience') => void;
  isOwner: boolean;
  className?: string;
}

export const StoryModeToggle = ({
  mode,
  onModeChange,
  isOwner,
  className = ""
}: StoryModeToggleProps) => {
  // If not owner, show a badge instead of a toggle
  if (!isOwner) {
    return (
      <div className={`flex items-center ${className}`}>
        <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium">
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Reading Mode
        </Badge>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center space-x-1 bg-background/50 rounded-lg p-1 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeChange('creation')}
              variant={mode === 'creation' ? 'default' : 'ghost'}
              size="sm"
              className={`text-xs transition-all duration-200 ${
                mode === 'creation'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              <Edit className="w-4 h-4 mr-1" />
              Creation
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">Build your story with full controls: add chapters, generate images & audio, make choices</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeChange('experience')}
              variant={mode === 'experience' ? 'default' : 'ghost'}
              size="sm"
              className={`text-xs transition-all duration-200 ${
                mode === 'experience'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              <Eye className="w-4 h-4 mr-1" />
              Experience
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">Read and enjoy the story like a book with automatic narration and smooth transitions</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export const StoryModeIndicator = ({
  mode,
  isOwner
}: {
  mode: 'creation' | 'experience';
  isOwner: boolean;
}) => {
  if (!isOwner && mode === 'experience') {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-600/20 border border-emerald-600/30 rounded-full">
        <BookOpenCheck className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-emerald-200 font-medium">Reading Experience</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
      mode === 'creation'
        ? 'bg-amber-600/20 border border-amber-600/30'
        : 'bg-emerald-600/20 border border-emerald-600/30'
    }`}>
      {mode === 'creation' ? (
        <>
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-200 font-medium">Creation Mode</span>
        </>
      ) : (
        <>
          <BookOpenCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-200 font-medium">Experience Mode</span>
        </>
      )}
    </div>
  );
};