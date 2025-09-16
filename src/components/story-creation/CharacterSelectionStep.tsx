import { CharacterSelector } from './CharacterSelector';
import { UserCharacter } from '@/types/character';

interface CharacterSelectionStepProps {
  selectedCharacters: UserCharacter[];
  onCharactersChange: (characters: UserCharacter[]) => void;
}

export const CharacterSelectionStep = ({
  selectedCharacters,
  onCharactersChange
}: CharacterSelectionStepProps) => {
  return (
    <CharacterSelector
      selectedCharacters={selectedCharacters}
      onCharactersChange={onCharactersChange}
    />
  );
};