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
      
      // Fallback seeds
      setSeeds([
        {
          id: 'fallback-1',
          title: 'Magical Adventure',
          description: `${characters.length > 0 ? characters[0].name : 'Our hero'} discovers a mysterious door that leads to a magical world where anything is possible.`
        },
        {
          id: 'fallback-2',
          title: 'Hidden Treasure',
          description: `When ${characters.length > 0 ? characters.map(c => c.name).join(' and ') : 'brave explorers'} find an ancient map, they must solve puzzles to find the legendary treasure.`
        },
        {
          id: 'fallback-3',
          title: 'Time Adventure',
          description: `${characters.length > 0 ? characters[0].name : 'A curious adventurer'} accidentally travels through time and must find a way back home while helping people along the way.`
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