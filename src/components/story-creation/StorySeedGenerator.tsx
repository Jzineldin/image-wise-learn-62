import { useState, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw, Sparkles, Edit3 } from 'lucide-react';
import { StorySeed, UserCharacter } from '@/types/character';
import { useStorySeeds } from '@/hooks/useStorySeeds';
import { useLanguage } from '@/hooks/useLanguage';

interface StorySeedGeneratorProps {
  ageGroup: string;
  genres: string[];
  characters: UserCharacter[];
  selectedSeed: StorySeed | null;
  customSeed: string;
  onSeedSelect: (seed: StorySeed | null) => void;
  onCustomSeedChange: (seed: string) => void;
}

export const StorySeedGenerator = memo(({
  ageGroup,
  genres,
  characters,
  selectedSeed,
  customSeed,
  onSeedSelect,
  onCustomSeedChange
}: StorySeedGeneratorProps) => {
  const { seeds, loading, generateSeeds } = useStorySeeds();
  const { translate, selectedLanguage } = useLanguage();
  const [editingCustom, setEditingCustom] = useState(false);

  useEffect(() => {
    // Generate initial seeds when component mounts
    generateSeeds(ageGroup, genres, characters, selectedLanguage);
  }, [ageGroup, genres, characters, selectedLanguage]);

  const handleSeedSelect = useCallback((seed: StorySeed) => {
    onSeedSelect(seed);
    setEditingCustom(false);
  }, [onSeedSelect]);

  const handleCustomSeedToggle = useCallback(() => {
    if (!editingCustom) {
      onSeedSelect(null);
      setEditingCustom(true);
    } else {
      setEditingCustom(false);
    }
  }, [editingCustom, onSeedSelect]);

  const handleRefresh = useCallback(() => {
    generateSeeds(ageGroup, genres, characters, selectedLanguage);
  }, [ageGroup, genres, characters, selectedLanguage, generateSeeds]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{translate('storySeeds.title')}</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {translate('storySeeds.regenerate')}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        {translate('storySeeds.description')}
      </p>

      {/* AI Generated Seeds */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">
          {translate('storySeeds.aiGenerated')}
        </h4>
        {loading ? (
          <div className="grid gap-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
          {/* Impact preview note for clarity without clutter */}
          <div className="text-xs text-muted-foreground mb-2">
            Tip: In the next step, opening choices include <span className="font-medium">Impact</span> previews to help you pick a direction.
          </div>
          <div className="grid gap-3">
            {seeds.map((seed) => {
              const isSelected = selectedSeed?.id === seed.id;
              
              return (
                <Card
                  key={seed.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md hover:border-primary/50'
                  }`}
                  onClick={() => handleSeedSelect(seed)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {seed.title}
                      {isSelected && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          {translate('storySeeds.selected')}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {seed.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* Custom Seed Option */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{translate('storySeeds.customIdea')}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCustomSeedToggle}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {editingCustom ? translate('storySeeds.useAiIdeas') : translate('storySeeds.writeOwn')}
          </Button>
        </div>

        {editingCustom ? (
          <div className="space-y-2">
            <Label htmlFor="custom-seed">{translate('storySeeds.yourStoryIdea')}</Label>
            <Textarea
              id="custom-seed"
              value={customSeed}
              onChange={(e) => onCustomSeedChange(e.target.value)}
              placeholder={translate('storySeeds.customPlaceholder')
                .replace('{ageGroup}', ageGroup)
                .replace('{genres}', genres.join(', '))
                .replace('{characters}', characters.map(c => c.name).join(', '))}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {translate('storySeeds.customInstructions')}
            </p>
          </div>
        ) : (
          <Card 
            className={`cursor-pointer transition-all duration-200 border-dashed ${
              !selectedSeed && customSeed 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:border-primary/50'
            }`}
            onClick={handleCustomSeedToggle}
          >
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Edit3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">{translate('storySeeds.writeYourOwn')}</p>
                <p className="text-sm text-muted-foreground">
                  {translate('storySeeds.customPremise')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Character Summary */}
      {characters.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h5 className="font-medium text-sm mb-2">{translate('storySeeds.storyCharacters')}:</h5>
          <div className="flex flex-wrap gap-2">
            {characters.map(char => (
              <span key={char.id} className="text-sm bg-background px-2 py-1 rounded border">
                {char.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});