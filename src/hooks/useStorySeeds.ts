import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StorySeed, UserCharacter } from '@/types/character';

export const useStorySeeds = () => {
  const [seeds, setSeeds] = useState<StorySeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSeeds = async (
    ageGroup: string,
    genres: string[],
    characters: UserCharacter[]
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-story-seeds', {
        body: {
          ageGroup,
          genres,
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

      if (data?.seeds && Array.isArray(data.seeds)) {
        setSeeds(data.seeds);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error generating story seeds:', err);
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

      setSeeds([
        {
          id: 'fallback-1',
          title: 'Magical Adventure',
          description: `${firstCharRef.charAt(0).toUpperCase() + firstCharRef.slice(1)} discovers a mysterious door that leads to a magical world where anything is possible.`
        },
        {
          id: 'fallback-2',
          title: 'Hidden Treasure',
          description: `When ${allCharRefs} find an ancient map, they must solve puzzles to find the legendary treasure.`
        },
        {
          id: 'fallback-3',
          title: 'Time Adventure',
          description: `${firstCharRef.charAt(0).toUpperCase() + firstCharRef.slice(1)} accidentally travels through time and must find a way back home while helping people along the way.`
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