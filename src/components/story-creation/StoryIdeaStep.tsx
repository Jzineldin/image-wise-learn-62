import { useState, useEffect } from 'react';
import { StorySeedGenerator } from './StorySeedGenerator';
import { CharacterReferenceGenerator } from './CharacterReferenceGenerator';
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
  const [charactersWithReferences, setCharactersWithReferences] = useState<UserCharacter[]>(characters);
  const [hasGeneratedReferences, setHasGeneratedReferences] = useState(false);

  // Generate character references when entering this step (if not already done)
  useEffect(() => {
    if (characters.length > 0 && !hasGeneratedReferences) {
      setHasGeneratedReferences(true);
    }
  }, [characters, hasGeneratedReferences]);

  const handleGenerationComplete = (updatedCharacters: UserCharacter[]) => {
    setCharactersWithReferences(updatedCharacters);
  };

  return (
    <div className="space-y-6">
      {/* Character Reference Generator - Only show if characters exist and haven't been generated yet */}
      {characters.length > 0 && !characters.every(c => c.image_url) && (
        <CharacterReferenceGenerator
          characters={characters}
          ageGroup={ageGroup}
          genre={genres[0] || 'Adventure'}
          onGenerationComplete={handleGenerationComplete}
          autoGenerate={true}
        />
      )}

      {/* Story Seed Generator */}
      <StorySeedGenerator
        ageGroup={ageGroup}
        genres={genres}
        characters={charactersWithReferences}
        selectedSeed={selectedSeed || null}
        customSeed={customSeed}
        onSeedSelect={onSeedSelect}
        onCustomSeedChange={onCustomSeedChange}
      />
    </div>
  );
};