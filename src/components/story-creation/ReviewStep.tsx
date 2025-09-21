import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { UserCharacter, StorySeed } from '@/types/character';
import CreditCostDisplay from '@/components/CreditCostDisplay';

interface ReviewStepProps {
  ageGroup?: string;
  genres: string[];
  selectedCharacters: UserCharacter[];
  selectedSeed?: StorySeed;
  customSeed: string;
  generating: boolean;
  onCreateStory: () => void;
}

export const ReviewStep = ({
  ageGroup,
  genres,
  selectedCharacters,
  selectedSeed,
  customSeed,
  generating,
  onCreateStory
}: ReviewStepProps) => {
  const { translate } = useLanguage();

  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {translate('review.readyToCreate')}
        </h2>
        <p className="text-muted-foreground">
          {translate('review.title')}
        </p>
      </div>

      <CreditCostDisplay operation="story" className="mb-4" />

      {/* Opening choice impact indicator */}
      <div className="mx-auto max-w-xl text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
        Opening choices now include <span className="font-medium">Impact</span> previews so you can see likely consequences before deciding.
      </div>

      <div className="bg-muted/30 rounded-lg p-6 text-left space-y-4">
        <div>
          <span className="font-medium">{translate('review.ageGroup')}:</span> {ageGroup}
        </div>
        <div>
          <span className="font-medium">{translate('review.genres')}:</span> {genres.join(', ')}
        </div>
        {selectedCharacters.length > 0 ? (
          <div>
            <span className="font-medium">{translate('review.characters')}:</span>{' '}
            {selectedCharacters.map(c => c.name).join(', ')}
          </div>
        ) : (
          <div>
            <span className="font-medium">{translate('review.characters')}:</span>{' '}
            <span className="text-muted-foreground">{translate('review.noCharacters')}</span>
          </div>
        )}
        <div>
          <span className="font-medium">{translate('review.storyIdea')}:</span>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedSeed 
              ? `${translate('review.aiGenerated')}: ${selectedSeed.description}` 
              : `${translate('review.custom')}: ${customSeed}`
            }
          </p>
        </div>
      </div>

      <Button 
        size="lg" 
        className="px-8"
        onClick={onCreateStory}
        disabled={generating}
      >
        {generating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {translate('ui.generating')}
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            {translate('review.createStoryButton')}
          </>
        )}
      </Button>
    </div>
  );
};