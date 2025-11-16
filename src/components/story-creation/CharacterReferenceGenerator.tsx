import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UserCharacter } from '@/types/character';
import { useCharacterReferenceGeneration } from '@/hooks/useCharacterReferenceGeneration';

interface CharacterReferenceGeneratorProps {
  characters: UserCharacter[];
  ageGroup: string;
  genre: string;
  onGenerationComplete: (characters: UserCharacter[]) => void;
  autoGenerate?: boolean;
}

export const CharacterReferenceGenerator = ({
  characters,
  ageGroup,
  genre,
  onGenerationComplete,
  autoGenerate = true
}: CharacterReferenceGeneratorProps) => {
  const { isGenerating, progress, error, generateCharacterReferences } = useCharacterReferenceGeneration();
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (autoGenerate && characters.length > 0 && !hasGenerated && !isGenerating) {
      handleGenerate();
    }
  }, [characters, autoGenerate, hasGenerated, isGenerating]);

  const handleGenerate = async () => {
    setHasGenerated(true);
    const updatedCharacters = await generateCharacterReferences(characters, ageGroup, genre);
    onGenerationComplete(updatedCharacters);
  };

  if (characters.length === 0) {
    return null;
  }

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const failedCount = progress.filter(p => p.status === 'failed').length;
  const progressPercent = progress.length > 0 ? (completedCount / progress.length) * 100 : 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Character Reference Images</CardTitle>
          </div>
          {!isGenerating && hasGenerated && (
            <Badge variant={failedCount === 0 ? 'default' : 'secondary'}>
              {completedCount}/{progress.length} Generated
            </Badge>
          )}
        </div>
        <CardDescription>
          Generating visual reference images for your characters to ensure consistency across all story scenes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating references...</span>
              <span className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Character Progress Items */}
        <div className="space-y-2">
          {progress.map(item => (
            <div
              key={item.characterId}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {item.status === 'generating' && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
                {item.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {item.status === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                {item.status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>

              {/* Character Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.characterName}</p>
                {item.error && (
                  <p className="text-xs text-destructive truncate">{item.error}</p>
                )}
              </div>

              {/* Image Preview */}
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.characterName}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!isGenerating && (
          <div className="flex gap-2 pt-2">
            {!hasGenerated ? (
              <Button
                onClick={handleGenerate}
                className="w-full"
                variant="default"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Character References
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate References
              </Button>
            )}
          </div>
        )}

        {/* Info Message */}
        {hasGenerated && !isGenerating && (
          <p className="text-xs text-muted-foreground text-center">
            Character references are ready! They'll be used to maintain consistency across your story.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

