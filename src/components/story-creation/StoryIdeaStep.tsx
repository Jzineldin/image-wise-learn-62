import { StorySeedGenerator } from './StorySeedGenerator';
import { UserCharacter, StorySeed } from '@/types/character';

interface StoryIdeaStepProps {
  ageGroup: string;
  genres: string[];
  characters: UserCharacter[];
  selectedSeed?: StorySeed;
  customSeed: string;
  onSeedSelect: (seed: StorySeed) => void;
  onCustomSeedChange: (seed: string) => void;
}

export const StoryIdeaStep = ({
  ageGroup,
  genres,
  characters,
  selectedSeed,
  customSeed,
  onSeedSelect,
  onCustomSeedChange
}: StoryIdeaStepProps) => {
  return (
    <StorySeedGenerator
      ageGroup={ageGroup}
      genres={genres}
      characters={characters}
      selectedSeed={selectedSeed || null}
      customSeed={customSeed}
      onSeedSelect={onSeedSelect}
      onCustomSeedChange={onCustomSeedChange}
    />
  );
};