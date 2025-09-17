import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoiceSelector } from '@/components/VoiceSelector';
import {
  Music,
  Image,
  BarChart3,
  Play,
  Pause,
  Sparkles,
  RotateCw,
  Download,
  Wand2
} from 'lucide-react';

interface StorySidebarProps {
  story: {
    genre: string;
    age_group: string;
    metadata?: any;
    status?: string;
  };
  currentSegment?: {
    id: string;
    content: string | null;
    audio_url?: string;
    image_url?: string;
  };
  segmentNumber: number;
  totalSegments: number;
  creditsUsed: number;
  totalCredits: number;
  isPlaying: boolean;
  generatingAudio: boolean;
  generatingImage: boolean;
  generatingEnding: boolean;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  onGenerateAudio: () => void;
  onToggleAudio: () => void;
  onGenerateImage: () => void;
  onEndStory: () => void;
  isOwner: boolean;
  isCompleted: boolean;
  creditLocked?: boolean;
}

export const StorySidebar = ({
  story,
  currentSegment,
  segmentNumber,
  totalSegments,
  creditsUsed,
  totalCredits,
  isPlaying,
  generatingAudio,
  generatingImage,
  generatingEnding,
  selectedVoice,
  onVoiceChange,
  onGenerateAudio,
  onToggleAudio,
  onGenerateImage,
  onEndStory,
  isOwner,
  isCompleted,
  creditLocked = false
}: StorySidebarProps) => {
  const hasAudio = !!currentSegment?.audio_url;
  const hasImage = !!currentSegment?.image_url;

  return (
    <div className="space-y-4">
      {/* Audio Generation Card */}
      <Card className="bg-surface border border-border/50 shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
            <Music className="h-5 w-5 text-primary" />
            <span>Voice Narration</span>
          </h3>

          <div className="space-y-3">
            {/* Voice Selector */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Select Voice</label>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onVoiceChange={onVoiceChange}
              />
            </div>

            {/* Generate Audio Button */}
            {!hasAudio && (
              <Button
                onClick={() => {
                  console.log('Audio button clicked - calling onGenerateAudio');
                  onGenerateAudio();
                }}
                disabled={generatingAudio || creditLocked || isCompleted || !currentSegment?.content}
                variant="outline"
                className="w-full"
              >
                {generatingAudio ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : !currentSegment?.content ? (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    No Content Available
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Audio (2 credits)
                  </>
                )}
              </Button>
            )}

            {/* Audio Player */}
            {hasAudio && (
              <div className="bg-muted rounded-lg p-3">
                <Button
                  onClick={onToggleAudio}
                  className="w-full bg-primary hover:bg-primary-hover text-white"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Narration
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play Narration
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Generation Card */}
      <Card className="bg-surface border border-border/50 shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
            <Image className="h-5 w-5 text-primary" />
            <span>Scene Image</span>
          </h3>

          <div className="space-y-3">
            <Button
              onClick={() => {
                console.log('Image button clicked - calling onGenerateImage');
                onGenerateImage();
              }}
              disabled={generatingImage || creditLocked || isCompleted}
              variant="outline"
              className="w-full"
            >
              {generatingImage ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {hasImage ? 'Generate New Image' : 'Generate Image'} (3 credits)
                </>
              )}
            </Button>

            {hasImage && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={onGenerateImage}
                  disabled={generatingImage || creditLocked}
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Story Info Card */}
      <Card className="bg-surface border border-border/50 shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Story Details</span>
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Genre:</span>
              <span className="font-medium capitalize">{story.genre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Age Group:</span>
              <span className="font-medium">{story.age_group}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Language:</span>
              <span className="font-medium">English</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">Chapter {segmentNumber} of {totalSegments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credits Used:</span>
              <span className="font-medium">{creditsUsed} / {totalCredits}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* End Story Card */}
      {isOwner && !isCompleted && (
        <Card className="bg-gradient-to-br from-destructive to-destructive/80 text-white border-0 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-5 text-center">
            <h3 className="text-base font-semibold mb-2">Ready to End?</h3>
            <p className="text-sm opacity-90 mb-3">Create a magical ending for your story</p>
            <Button
              onClick={onEndStory}
              disabled={generatingEnding || creditLocked}
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              {generatingEnding ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Ending
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generation Status */}
      {(generatingAudio || generatingImage || generatingEnding) && (
        <Card className="bg-warning/10 border-warning/20 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-warning border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-warning">
                {generatingAudio ? 'Generating audio narration...' :
                 generatingImage ? 'Generating scene image...' :
                 'Generating story ending...'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};