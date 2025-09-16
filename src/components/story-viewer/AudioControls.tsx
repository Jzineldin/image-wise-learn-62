import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  RotateCcw,
  Loader2
} from 'lucide-react';
import CompactVoiceSelector from '@/components/CompactVoiceSelector';

interface AudioControlsProps {
  audioUrl?: string;
  isPlaying: boolean;
  isGenerating: boolean;
  onToggleAudio: () => void;
  onGenerateAudio: () => void;
  onSkipForward?: () => void;
  onSkipBack?: () => void;
  showSkipControls?: boolean;
  canSkipForward?: boolean;
  canSkipBack?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'full';
  disabled?: boolean;
  // Voice selector props
  selectedVoice?: string;
  onVoiceChange?: (voiceId: string) => void;
  showVoiceSelector?: boolean;
}

export const AudioControls = ({
  audioUrl,
  isPlaying,
  isGenerating,
  onToggleAudio,
  onGenerateAudio,
  onSkipForward,
  onSkipBack,
  showSkipControls = false,
  canSkipForward = false,
  canSkipBack = false,
  className = "",
  size = 'md',
  variant = 'full',
  disabled = false,
  selectedVoice,
  onVoiceChange,
  showVoiceSelector = false
}: AudioControlsProps) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Update audio element volume when volume changes
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, audioElement]);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume[0]);
    if (newVolume[0] === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const sizeClasses = {
    sm: {
      button: "h-8 w-8",
      icon: "w-4 h-4",
      spacing: "space-x-2",
      text: "text-xs"
    },
    md: {
      button: "h-10 w-10",
      icon: "w-5 h-5",
      spacing: "space-x-3",
      text: "text-sm"
    },
    lg: {
      button: "h-12 w-12",
      icon: "w-6 h-6",
      spacing: "space-x-4",
      text: "text-base"
    }
  };

  const currentSize = sizeClasses[size];

  if (variant === 'compact') {
    return (
      <div className={`flex items-center ${currentSize.spacing} ${className}`}>
        {audioUrl ? (
          <Button
            onClick={onToggleAudio}
            className={`btn-primary ${currentSize.button}`}
            disabled={isGenerating || disabled}
          >
            {isPlaying ? (
              <Pause className={currentSize.icon} />
            ) : (
              <Play className={currentSize.icon} />
            )}
          </Button>
        ) : (
          <Button
            onClick={onGenerateAudio}
            disabled={isGenerating || disabled}
            className={`btn-primary ${currentSize.button}`}
            title={disabled ? "Please wait, another operation is in progress" : "Generate audio for this segment"}
          >
            {isGenerating ? (
              <Loader2 className={`${currentSize.icon} animate-spin`} />
            ) : (
              <Volume2 className={currentSize.icon} />
            )}
          </Button>
        )}

        {/* Voice Selector for compact mode */}
        {showVoiceSelector && onVoiceChange && (
          <CompactVoiceSelector
            selectedVoice={selectedVoice}
            onVoiceSelect={onVoiceChange}
            size={size === 'lg' ? 'md' : 'sm'}
          />
        )}

        {audioUrl && (
          <span className={`text-text-secondary ${currentSize.text}`}>
            {isPlaying ? 'Playing' : 'Ready'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Main Audio Controls */}
        <div className={`flex items-center ${currentSize.spacing}`}>
          {showSkipControls && (
            <Button
              onClick={onSkipBack}
              variant="ghost"
              className={`btn-icon ${currentSize.button}`}
              disabled={!canSkipBack}
            >
              <SkipBack className={currentSize.icon} />
            </Button>
          )}

          {audioUrl ? (
            <Button
              onClick={onToggleAudio}
              className={`btn-primary ${currentSize.button}`}
              disabled={isGenerating || disabled}
            >
              {isPlaying ? (
                <Pause className={currentSize.icon} />
              ) : (
                <Play className={currentSize.icon} />
              )}
            </Button>
          ) : (
            <Button
              onClick={onGenerateAudio}
              disabled={isGenerating || disabled}
              className={`btn-primary ${currentSize.button}`}
              title={disabled ? "Please wait, another operation is in progress" : "Generate audio for this segment"}
            >
              {isGenerating ? (
                <Loader2 className={`${currentSize.icon} animate-spin`} />
              ) : (
                <Volume2 className={currentSize.icon} />
              )}
            </Button>
          )}

          {showSkipControls && (
            <Button
              onClick={onSkipForward}
              variant="ghost"
              className={`btn-icon ${currentSize.button}`}
              disabled={!canSkipForward}
            >
              <SkipForward className={currentSize.icon} />
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <span className={`text-text-secondary ${currentSize.text} min-w-[80px]`}>
              {isGenerating ? 'Generating...' : audioUrl ? (isPlaying ? 'Playing' : 'Ready') : 'Generate Audio'}
            </span>

            {/* Voice Selector for full mode */}
            {showVoiceSelector && onVoiceChange && (
              <CompactVoiceSelector
                selectedVoice={selectedVoice}
                onVoiceSelect={onVoiceChange}
                size={size === 'lg' ? 'md' : 'sm'}
              />
            )}
          </div>
        </div>

        {/* Volume Controls - Only show when audio is available */}
        {audioUrl && (
          <div className="flex items-center space-x-3">
            <Button
              onClick={toggleMute}
              variant="ghost"
              className={`btn-icon ${currentSize.button}`}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className={currentSize.icon} />
              ) : (
                <Volume2 className={currentSize.icon} />
              )}
            </Button>

            <div className="flex items-center space-x-2 min-w-[100px]">
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.1}
                className="w-20"
              />
              <span className={`${currentSize.text} text-text-tertiary min-w-[30px]`}>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Audio Status Indicator */}
      {audioUrl && (
        <div className="mt-3 pt-3 border-t border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className={`${currentSize.text} text-text-tertiary`}>
                Audio {isPlaying ? 'Playing' : 'Ready'}
              </span>
            </div>

            {audioUrl && (
              <Button
                onClick={onGenerateAudio}
                variant="ghost"
                size="sm"
                className="text-xs text-text-tertiary hover:text-text-secondary"
                disabled={isGenerating || disabled}
                title={disabled ? "Please wait, another operation is in progress" : "Regenerate audio"}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Persistent floating audio controls for experience mode
export const FloatingAudioControls = ({
  audioUrl,
  isPlaying,
  isGenerating,
  onToggleAudio,
  onGenerateAudio,
  onSkipForward,
  onSkipBack,
  canSkipForward = false,
  canSkipBack = false,
  disabled = false,
  className = "",
  selectedVoice,
  onVoiceChange,
  showVoiceSelector = false
}: Omit<AudioControlsProps, 'variant' | 'size'>) => {
  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <AudioControls
        audioUrl={audioUrl}
        isPlaying={isPlaying}
        isGenerating={isGenerating}
        onToggleAudio={onToggleAudio}
        onGenerateAudio={onGenerateAudio}
        onSkipForward={onSkipForward}
        onSkipBack={onSkipBack}
        showSkipControls={true}
        canSkipForward={canSkipForward}
        canSkipBack={canSkipBack}
        size="md"
        variant="full"
        disabled={disabled}
        className="shadow-2xl"
        selectedVoice={selectedVoice}
        onVoiceChange={onVoiceChange}
        showVoiceSelector={showVoiceSelector}
      />
    </div>
  );
};