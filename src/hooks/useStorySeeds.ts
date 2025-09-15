import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StorySeed, UserCharacter } from '@/types/character';
import { logger, generateRequestId } from '@/lib/debug';

export const useStorySeeds = () => {
  const [seeds, setSeeds] = useState<StorySeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSeeds = async (
    ageGroup: string,
    genres: string[],
    characters: UserCharacter[],
    language: string = 'en'
  ) => {
    const requestId = generateRequestId();
    setLoading(true);
    setError(null);

    try {
      logger.edgeFunction('generate-story-seeds', requestId, { ageGroup, genres, charactersCount: characters.length });
      
      const { data, error } = await supabase.functions.invoke('generate-story-seeds', {
        body: {
          ageGroup,
          genres,
          language,
          characters: characters.map(char => ({
            id: char.id,
            name: char.name,
            description: char.description,
            character_type: char.character_type,
            personality_traits: char.personality_traits
          }))
        }
      });

      if (error) throw error;

      // Handle both raw and enveloped response formats
      const payload = data?.data ?? data;
      const seeds = payload?.seeds ?? payload;
      
      if (seeds && Array.isArray(seeds)) {
        logger.edgeFunctionResponse('generate-story-seeds', requestId, { seedsCount: seeds.length });
        setSeeds(seeds);
      } else {
        throw new Error('Invalid response format - seeds not found or not array');
      }
    } catch (err) {
      logger.error('Failed to generate story seeds', err, { requestId, ageGroup, genres, charactersCount: characters.length });
      setError(err instanceof Error ? err.message : 'Failed to generate story seeds');
      
      // Enhanced fallback seeds with proper character references
      const getCharacterReference = (character: UserCharacter): string => {
        if (!character?.name) return 'our hero';
        
        const name = character.name.trim();
        const descriptiveWords = [
          'dragon', 'cat', 'dog', 'rabbit', 'bear', 'lion', 'tiger', 'wolf', 'fox', 'bird', 'owl',
          'wizard', 'witch', 'fairy', 'princess', 'prince', 'knight', 'king', 'queen',
          'hero', 'warrior', 'guardian', 'explorer', 'adventurer',
          'girl', 'boy', 'child', 'kid', 'student', 'teacher', 'friend',
          'magic', 'magical', 'enchanted', 'mysterious', 'ancient', 'wise', 'brave', 'clever',
          'friendly', 'curious', 'happy', 'sad', 'angry', 'gentle', 'fierce', 'tiny', 'giant',
          'young', 'old', 'little', 'big', 'small', 'great'
        ];
        
        const hasDescriptiveWords = descriptiveWords.some(word => 
          name.toLowerCase().includes(word.toLowerCase())
        );
        
        const properNamePattern = /^[A-Z][a-z]+( [A-Z][a-z]+)*$/;
        const looksLikeProperName = properNamePattern.test(name) && !hasDescriptiveWords;
        
        if (looksLikeProperName) {
          return name;
        } else {
          const lowerName = name.toLowerCase();
          if (lowerName.startsWith('the ')) {
            return lowerName;
          }
          return `the ${lowerName}`;
        }
      };

      const firstCharRef = characters.length > 0 ? getCharacterReference(characters[0]) : 'our hero';
      const allCharRefs = characters.length > 1 
        ? characters.map(getCharacterReference).join(' and ')
        : firstCharRef;

      const isSv = language === 'sv';

      setSeeds([
        {
          id: 'fallback-1',
          title: isSv ? 'Magiskt Äventyr' : 'Magical Adventure',
          description: isSv
            ? `${firstCharRef.charAt(0).toUpperCase() + firstCharRef.slice(1)} hittar en mystisk dörr som leder till en magisk värld där allt är möjligt.`
            : `${firstCharRef.charAt(0).toUpperCase() + firstCharRef.slice(1)} discovers a mysterious door that leads to a magical world where anything is possible.`
        },
        {
          id: 'fallback-2',
          title: isSv ? 'Gömd Skatt' : 'Hidden Treasure',
          description: isSv
            ? `När ${allCharRefs} hittar en gammal karta måste de lösa kluriga gåtor för att finna den legendariska skatten.`
            : `When ${allCharRefs} find an ancient map, they must solve puzzles to find the legendary treasure.`
        },
        {
          id: 'fallback-3',
          title: isSv ? 'Tidsäventyr' : 'Time Adventure',
          description: isSv
            ? `${firstCharRef.charAt(0).toUpperCase() + firstCharRef.slice(1)} råkar resa i tiden och måste hitta hem igen samtidigt som de hjälper andra på vägen.`
            : `${firstCharRef.charAt(0).toUpperCase() + firstCharRef.slice(1)} accidentally travels through time and must find a way back home while helping people along the way.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    seeds,
    loading,
    error,
    generateSeeds
  };
};