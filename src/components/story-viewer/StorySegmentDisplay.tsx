import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, RotateCcw, Lock, ArrowRight } from 'lucide-react';
import { AudioControls } from './AudioControls';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { VideoGenerationPanel } from './VideoGenerationPanel';
import { isStoryCompleted } from '@/lib/helpers/story-helpers';
import { CreditCostPreview } from './CreditCostPreview';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StorySegment {
  id: string;
  segment_number: number;
  content: string;
  image_url?: string;
  audio_url?: string;
  choices: Array<{
    id: number;
    text: string;
    impact?: string;
  }>;
  is_ending?: boolean;
}

interface Story {
  id: string;
  title: string;
  description: string;
  author_id: string;
  user_id?: string;
  genre: string;
  age_group: string;
  status: string;
  is_completed?: boolean;
  is_complete?: boolean;
  visibility?: string;
  metadata: any;
  cover_image?: string;
}

interface StorySegmentDisplayProps {
  segment: StorySegment;
  story: Story;
  viewMode: 'creation' | 'experience';
  isOwner: boolean;
  generatingSegment: boolean;
  generatingImage: string | null;
  onChoice: (choiceId: number, choiceText: string) => void;
  onGenerateImage: (segment: StorySegment) => void;
  fontSize: number;
  // Audio props for creation mode
  isPlaying?: boolean;
  generatingAudio?: boolean;
  onToggleAudio?: () => void;
  onGenerateAudio?: () => void;
  // Voice selector props
  selectedVoice?: string;
  onVoiceChange?: (voiceId: string) => void;
}

export const StorySegmentDisplay = ({
  segment,
  story,
  viewMode,
  isOwner,
  generatingSegment,
  generatingImage,
  onChoice,
  onGenerateImage,
  fontSize,
  isPlaying = false,
  generatingAudio = false,
  onToggleAudio,
  onGenerateAudio,
  selectedVoice,
  onVoiceChange
}: StorySegmentDisplayProps) => {
  const isCompleted = isStoryCompleted(story);

  return (
    <div className="space-y-8">
      {/* Story Image */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
        {segment.image_url ? (
          <OptimizedImage
            src={segment.image_url}
            alt={`Story segment ${segment.segment_number}`}
            className="w-full h-full object-cover"
            priority={segment.segment_number <= 2} // Prioritize first 2 segments
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              {generatingImage === segment.id ? (
                <div className="flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Generating image...</p>
                </div>
              ) : (
                <>
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No image yet</p>
                    {viewMode === 'creation' && isOwner && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onGenerateImage(segment)}
                          className="text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate Image
                        </Button>
                        <CreditCostPreview type="image" />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Regenerate image button for owners */}
        {segment.image_url && viewMode === 'creation' && isOwner && (
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onGenerateImage(segment)}
              disabled={generatingImage === segment.id}
              className="bg-black/20 backdrop-blur hover:bg-black/30"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Story Content */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-8">
          <div className={`prose prose-lg max-w-none ${viewMode === 'experience' ? 'text-center' : ''}`}>
            <div
              className="leading-relaxed text-foreground"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
            >
              {segment.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Generation Panel - Only in creation mode for owners with image */}
      {viewMode === 'creation' && isOwner && segment.image_url && (
        <VideoGenerationPanel
          segmentId={segment.id}
          storyId={story.id}
          imageUrl={segment.image_url}
          segmentContent={segment.content}
        />
      )}

      {/* Interactive Choices */}
      {segment.choices && segment.choices.length > 0 && viewMode === 'creation' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-xl text-center">What happens next?</h3>
          {segment.segment_number === 1 && (
            <div className="text-center text-sm text-muted-foreground -mt-1">Each choice shows an Impact preview to help you decide.</div>
          )}
          <TooltipProvider>
            <div className="grid gap-4">
              {segment.choices.map((choice) => {
                const choiceButton = (
                  <Button
                    key={choice.id}
                    variant="secondary"
                    className={`group p-6 h-auto text-left justify-start rounded-xl border-2 transition-all duration-300 bg-card text-foreground ${
                      isCompleted
                        ? 'opacity-60 cursor-not-allowed border-muted'
                        : 'hover:bg-card hover:border-primary hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-primary'
                    }`}
                    onClick={() => !isCompleted && onChoice(choice.id, choice.text)}
                    disabled={generatingSegment || isCompleted}
                  >
                    <div className="flex items-start gap-4 w-full">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform ${
                        isCompleted
                          ? 'bg-muted'
                          : 'bg-gradient-to-r from-primary to-secondary group-hover:scale-110'
                      }`}>
                        {isCompleted ? <Lock className="h-5 w-5 text-muted-foreground" /> : choice.id}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className={`font-semibold text-lg transition-colors ${
                          isCompleted ? 'text-muted-foreground' : 'group-hover:text-primary'
                        }`}>
                          {choice.text}
                        </div>
                        {choice.impact && (
                          <div className="text-sm text-muted-foreground italic leading-relaxed">
                            💭 {choice.impact}
                          </div>
                        )}
                      </div>
                      {!isCompleted && (
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </Button>
                );

                // Wrap with tooltip if story is completed
                if (isCompleted) {
                  return (
                    <Tooltip key={choice.id}>
                      <TooltipTrigger asChild>
                        {choiceButton}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This story is completed. Choices are no longer available.</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return choiceButton;
              })}
            </div>
          </TooltipProvider>

          {generatingSegment && (
            <div className="flex items-center justify-center space-x-3 p-6 bg-muted/50 rounded-xl">
              <div className="loading-spinner h-5 w-5"></div>
              <span className="text-base font-medium">Continuing your story...</span>
            </div>
          )}
        </div>
      )}

      {/* Ending indicator */}
      {segment.is_ending && (
        <div className="text-center p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
          <h3 className="text-2xl font-bold mb-3 text-gradient">The End</h3>
          <p className="text-lg text-muted-foreground">This adventure has reached its conclusion.</p>
        </div>
      )}
    </div>
  );
};