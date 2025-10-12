import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VoiceSelector } from '@/components/VoiceSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Music,
  Image,
  BarChart3,
  Play,
  Pause,
  Sparkles,
  RotateCw,
  Download,
  Wand2,
  Coins
} from 'lucide-react';
import { logger } from '@/lib/logger';

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
  generatingSegment?: boolean;
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  onGenerateAudio: () => void;
  onToggleAudio: () => void;
  onGenerateImage: () => void;
  onEndStory: () => void;
  isOwner: boolean;
  isCompleted: boolean;
  creditLocked?: boolean;
  hasEnding?: boolean;
  onMakePictureAndVoice?: () => void;
  endActionLabel?: string;
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
  generatingSegment = false,
  selectedVoice,
  onVoiceChange,
  onGenerateAudio,
  onToggleAudio,
  onGenerateImage,
  onEndStory,
  isOwner,
  isCompleted,
  creditLocked = false,
  hasEnding = false,
  onMakePictureAndVoice,
  endActionLabel
}: StorySidebarProps) => {
  const hasAudio = !!currentSegment?.audio_url;
  const hasImage = !!currentSegment?.image_url;

  // Local progress bar state for generation
  const [genProgress, setGenProgress] = useState(0);
  const [etaSec, setEtaSec] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  // End story confirmation dialog state
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    // Determine ETA when generation starts
    if (generatingAudio || generatingImage || generatingEnding || generatingSegment) {
      let eta = 20; // default for ending
      if (generatingAudio) {
        const words = (currentSegment?.content?.split(/\s+/).length || 0);
        eta = Math.max(8, Math.ceil(words / 100) * 15);
      } else if (generatingImage) {
        eta = 30;
      } else if (generatingEnding) {
        eta = 20;
      } else if (generatingSegment) {
        eta = 15;
      }
      setEtaSec(eta);
      setGenProgress(0);
      startRef.current = Date.now();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startRef.current) / 1000;
        const pct = Math.min(99, Math.round((elapsed / eta) * 100));
        setGenProgress(pct);
      }, 200);
    } else {
      // When generation stops, complete bar then reset
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (genProgress > 0 && genProgress < 100) setGenProgress(100);
      const t = window.setTimeout(() => {
        setGenProgress(0);
        setEtaSec(null);
      }, 800);
      return () => window.clearTimeout(t);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [generatingAudio, generatingImage, generatingEnding, generatingSegment, currentSegment?.id]);
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
            <VoiceSelector selectedVoice={selectedVoice} onVoiceChange={onVoiceChange} />

            {!hasAudio && (
              <Button
                onClick={() => {
                  logger.userAction('Generate audio clicked', {
                    segmentId: currentSegment?.id,
                    component: 'StorySidebar'
                  });
                  onGenerateAudio();
                }}
                disabled={generatingAudio || creditLocked || isCompleted || !currentSegment?.content}
                variant="outline"
                className="w-full"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {!currentSegment?.content ? 'No Content Available' : 'Add Voice Narration'}
                {currentSegment?.content && !generatingAudio && (
                  <Badge variant="secondary" className="ml-2">2 credits</Badge>
                )}
              </Button>
            )}

            {hasAudio && (
              <div className="bg-muted rounded-lg p-3">
                <Button onClick={onToggleAudio} className="w-full bg-primary hover:bg-primary-hover text-white">
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
                logger.userAction('Generate image clicked', {
                  segmentId: currentSegment?.id,
                  hasExistingImage: hasImage,
                  component: 'StorySidebar'
                });
                onGenerateImage();
              }}
              disabled={generatingImage || creditLocked || isCompleted}
              variant="outline"
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {hasImage ? 'Regenerate Image' : 'Add Illustration'}
              {!hasImage && !generatingImage && (
                <Badge variant="secondary" className="ml-2">1 credit</Badge>
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
              <span className="font-medium">{(story as any)?.language_code === 'sv' || (story as any)?.metadata?.languageCode === 'sv' ? 'Swedish' : 'English'}</span>
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
        <Card className="bg-gradient-to-br from-primary to-secondary text-white border-0 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-5 text-center">
            <h3 className="text-base font-semibold mb-2">{hasEnding ? 'Finalize Story' : 'Ready to End?'}</h3>
            <p className="text-sm opacity-90 mb-3">{hasEnding ? 'Review your ending and complete the story' : 'Create a magical ending for your story'}</p>

            <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={generatingEnding || creditLocked}
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20 w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {endActionLabel || (hasEnding ? 'Finalize Story' : 'Create Ending')}
                  {!hasEnding && !generatingEnding && (
                    <Badge variant="secondary" className="ml-2 bg-white/20">1 credit</Badge>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Create Story Ending?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>This will generate a satisfying conclusion to your story.</p>
                    <p className="font-semibold text-foreground">After creating an ending, you won't be able to add more chapters.</p>
                    <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
                      <Coins className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">Cost: 1 credit</span>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Writing</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    setShowEndConfirm(false);
                    onEndStory();
                  }}>
                    Create Ending
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Generation Status */}
      {(generatingAudio || generatingImage || generatingEnding || generatingSegment) && (
        <Card className="bg-warning/10 border-warning/20 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-warning border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-warning">
                {generatingAudio ? `Generating audio narration... ~${Math.max(8, Math.ceil(((currentSegment?.content?.split(/\s+/).length || 0) / 100)) * 15)}s remaining` :
                 generatingImage ? 'Generating scene image... ~30s remaining' :
                 generatingEnding ? 'Generating story ending...' :
                 'Generating next chapter...' }
              </span>
            </div>
            <Progress value={genProgress} className="h-2 mt-3" />
            {!!etaSec && genProgress < 100 && (
              <div className="text-xs text-muted-foreground mt-1">~{Math.max(0, Math.round(etaSec - (Date.now() - startRef.current)/1000))}s left</div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );

};