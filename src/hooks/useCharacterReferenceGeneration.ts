import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserCharacter } from '@/types/character';
import { logger } from '@/lib/logger';

interface GenerationProgress {
  characterId: string;
  characterName: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
}

export const useCharacterReferenceGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateCharacterReferences = async (
    characters: UserCharacter[],
    ageGroup: string,
    genre: string
  ): Promise<UserCharacter[]> => {
    if (!characters || characters.length === 0) {
      return characters;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(
      characters.map(c => ({
        characterId: c.id,
        characterName: c.name,
        status: 'pending' as const
      }))
    );

    const updatedCharacters: UserCharacter[] = [];

    try {
      for (const character of characters) {
        try {
          // Update progress
          setProgress(prev =>
            prev.map(p =>
              p.characterId === character.id
                ? { ...p, status: 'generating' as const }
                : p
            )
          );

          logger.info('Generating character reference image', {
            characterId: character.id,
            characterName: character.name,
            operation: 'character-reference-generation'
          });

          // Call the Edge Function to generate character reference image
          const { data, error: functionError } = await supabase.functions.invoke(
            'generate-character-reference-image',
            {
              body: {
                character_name: character.name,
                character_description: character.description,
                character_type: character.character_type,
                backstory: character.backstory,
                personality_traits: character.personality_traits,
                age_group: ageGroup,
                genre: genre
              }
            }
          );

          if (functionError) {
            throw functionError;
          }

          if (!data?.success || !data?.image_url) {
            throw new Error(data?.error || 'Failed to generate character reference image');
          }

          // Update the character with the generated image URL
          const { data: updatedChar, error: updateError } = await supabase
            .from('user_characters')
            .update({ image_url: data.image_url })
            .eq('id', character.id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }

          updatedCharacters.push(updatedChar);

          // Update progress
          setProgress(prev =>
            prev.map(p =>
              p.characterId === character.id
                ? {
                    ...p,
                    status: 'completed' as const,
                    imageUrl: data.image_url
                  }
                : p
            )
          );

          logger.info('Character reference image generated successfully', {
            characterId: character.id,
            imageUrl: data.image_url,
            operation: 'character-reference-generation-success'
          });
        } catch (charError) {
          const errorMessage = charError instanceof Error ? charError.message : 'Unknown error';

          logger.error('Failed to generate character reference image', charError, {
            characterId: character.id,
            characterName: character.name,
            operation: 'character-reference-generation-error'
          });

          // Update progress with error
          setProgress(prev =>
            prev.map(p =>
              p.characterId === character.id
                ? {
                    ...p,
                    status: 'failed' as const,
                    error: errorMessage
                  }
                : p
            )
          );

          // Still add the character without image
          updatedCharacters.push(character);
        }
      }

      return updatedCharacters;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate character references';
      setError(errorMessage);
      logger.error('Character reference generation failed', err, {
        operation: 'character-reference-generation-batch-error'
      });
      return characters;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    progress,
    error,
    generateCharacterReferences
  };
};

