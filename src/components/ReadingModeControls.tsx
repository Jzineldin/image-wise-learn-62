import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Settings,
  Maximize,
  Minimize,
  Type,
  Clock,
  BookOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface ReadingModeControlsProps {
  isAutoPlaying: boolean;
  onAutoPlayToggle: () => void;
  currentSegment: number;
  totalSegments: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onJumpToSegment: (segmentIndex: number) => void;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  autoPlaySpeed: number;
  onAutoPlaySpeedChange: (speed: number) => void;
  mode?: 'creation' | 'experience';
}

export const ReadingModeControls = ({
  isAutoPlaying,
  onAutoPlayToggle,
  currentSegment,
  totalSegments,
  onNavigate,
  onJumpToSegment,
  isFullscreen,
  onFullscreenToggle,
  fontSize,
  onFontSizeChange,
  autoPlaySpeed,
  onAutoPlaySpeedChange,
  mode = 'experience'
}: ReadingModeControlsProps) => {
  const progress = totalSegments > 0 ? ((currentSegment + 1) / totalSegments) * 100 : 0;

  return (
    <div className={`glass-card-elevated border-primary/20 ${isFullscreen ? 'fixed bottom-0 left-0 right-0 z-50' : ''}`}>
      <div className="container mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-text-secondary">
                Segment {currentSegment + 1} of {totalSegments}
              </span>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                mode === 'creation'
                  ? 'bg-amber-600/20 text-amber-300'
                  : 'bg-emerald-600/20 text-emerald-300'
              }`}>
                <BookOpen className="w-3 h-3" />
                <span>{mode === 'creation' ? 'Creation' : 'Experience'}</span>
              </div>
            </div>
            <span className="text-sm text-text-secondary">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-surface/50" />
        </div>

        <div className="flex items-center justify-between">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onNavigate('prev')}
              disabled={currentSegment === 0}
              aria-label="Previous segment"
            >
              <SkipBack className="w-4 h-4" aria-hidden="true" />
            </Button>

            <Button
              size="sm"
              variant="default"
              onClick={onAutoPlayToggle}
              className="px-4"
              aria-label={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4 mr-2" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4 mr-2" aria-hidden="true" />
              )}
              {isAutoPlaying ? 'Pause' : 'Auto-play'}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => onNavigate('next')}
              disabled={currentSegment === totalSegments - 1}
              aria-label="Next segment"
            >
              <SkipForward className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Quick Jump */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-text-secondary">Jump to:</span>
            <Select 
              value={currentSegment.toString()} 
              onValueChange={(value) => onJumpToSegment(parseInt(value))}
            >
              <SelectTrigger className="w-24 h-8 glass-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card-elevated border-primary/20">
                {Array.from({ length: totalSegments }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Settings and Controls */}
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Open reading settings"
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card-elevated border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-gradient font-heading">Reading Settings</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Font Size */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-text-primary flex items-center">
                        <Type className="w-4 h-4 mr-2" />
                        Font Size
                      </label>
                      <span className="text-sm text-text-secondary">{fontSize}px</span>
                    </div>
                    <Slider
                      value={[fontSize]}
                      onValueChange={(value) => onFontSizeChange(value[0])}
                      max={24}
                      min={14}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Auto-play Speed */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-text-primary flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Auto-play Speed
                      </label>
                      <span className="text-sm text-text-secondary">{autoPlaySpeed}s</span>
                    </div>
                    <Slider
                      value={[autoPlaySpeed]}
                      onValueChange={(value) => onAutoPlaySpeedChange(value[0])}
                      max={10}
                      min={2}
                      step={0.5}
                      className="w-full"
                    />
                    <p className="text-xs text-text-tertiary mt-1">
                      Time to wait between segments in auto-play mode
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="icon"
              variant="ghost"
              onClick={onFullscreenToggle}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Maximize className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};