import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Sparkles } from 'lucide-react';
import { UserCharacter } from '@/types/character';
import { useCharacters } from '@/hooks/useCharacters';
import { CreateCharacterDialog } from './CreateCharacterDialog';

interface CharacterSelectorProps {
  selectedCharacters: UserCharacter[];
  onCharactersChange: (characters: UserCharacter[]) => void;
  maxCharacters?: number;
}

export const CharacterSelector = ({ 
  selectedCharacters, 
  onCharactersChange, 
  maxCharacters = 3 
}: CharacterSelectorProps) => {
  const { characters, loading } = useCharacters();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCharacterToggle = (character: UserCharacter) => {
    const isSelected = selectedCharacters.some(c => c.id === character.id);
    
    if (isSelected) {
      onCharactersChange(selectedCharacters.filter(c => c.id !== character.id));
    } else if (selectedCharacters.length < maxCharacters) {
      onCharactersChange([...selectedCharacters, character]);
    }
  };

  const handleCharacterCreated = (character: UserCharacter) => {
    if (selectedCharacters.length < maxCharacters) {
      onCharactersChange([...selectedCharacters, character]);
    }
    setShowCreateDialog(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Choose Your Characters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded mb-3"></div>
                <div className="h-6 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Choose Your Characters</h3>
          <Badge variant="secondary">{selectedCharacters.length}/{maxCharacters}</Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Select up to {maxCharacters} characters for your story. These characters will be featured in your AI-generated story seeds.
      </p>

      {characters.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No Characters Yet</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first character to get started with personalized stories
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => {
            const isSelected = selectedCharacters.some(c => c.id === character.id);
            const canSelect = selectedCharacters.length < maxCharacters || isSelected;

            return (
              <Card 
                key={character.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : canSelect 
                      ? 'hover:shadow-md hover:border-primary/50' 
                      : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => canSelect && handleCharacterToggle(character)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {character.name}
                    {isSelected && <Badge variant="default" className="text-xs">Selected</Badge>}
                  </CardTitle>
                  <CardDescription className="capitalize text-xs">
                    {character.character_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {character.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {character.personality_traits.slice(0, 3).map((trait, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                    {character.personality_traits.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{character.personality_traits.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCharacterDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCharacterCreated={handleCharacterCreated}
      />
    </div>
  );
};