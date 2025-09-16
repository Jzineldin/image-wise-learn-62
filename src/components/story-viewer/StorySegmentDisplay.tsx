import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, RotateCcw } from 'lucide-react';
import { AudioControls } from './AudioControls';

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
  const isCompleted = story.status === 'completed' || story.is_completed || story.is_complete;

  return (
    <div className="space-y-8">
      {/* Story Image */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
        {segment.image_url ? (
          <img
            src={segment.image_url}
            alt={`Story segment ${segment.segment_number}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              {generatingImage === segment.id ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Generating image...</p>
                </div>
              ) : (
                <>
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">No image yet</p>
                    {viewMode === 'creation' && isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGenerateImage(segment)}
                        className="text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate Image
                      </Button>
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

      {/* Audio Controls for Creation Mode */}
      {viewMode === 'creation' && onGenerateAudio && onToggleAudio && (
        <div className="flex justify-center">
          <AudioControls
            audioUrl={segment.audio_url}
            isPlaying={isPlaying}
            isGenerating={generatingAudio}
            onToggleAudio={onToggleAudio}
            onGenerateAudio={onGenerateAudio}
            variant="compact"
            size="md"
            className="bg-card border border-border/50 rounded-xl p-4 shadow-sm"
            selectedVoice={selectedVoice}
            onVoiceChange={onVoiceChange}
            showVoiceSelector={true}
          />
        </div>
      )}

      {/* Choices */}
      {segment.choices && segment.choices.length > 0 && viewMode === 'creation' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-xl text-center">What happens next?</h3>
          <div className="grid gap-4">
            {segment.choices.map((choice) => (
              <Button
                key={choice.id}
                variant="outline"
                className="p-6 h-auto text-left justify-start hover:bg-primary/5 rounded-xl border-2 hover:border-primary/20 transition-all duration-200"
                onClick={() => onChoice(choice.id, choice.text)}
                disabled={generatingSegment || isCompleted}
              >
                <div className="space-y-2">
                  <div className="font-medium text-base">{choice.text}</div>
                  {choice.impact && (
                    <div className="text-sm text-muted-foreground">
                      Impact: {choice.impact}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          {generatingSegment && (
            <div className="flex items-center justify-center space-x-3 p-6 bg-muted/50 rounded-xl">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
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