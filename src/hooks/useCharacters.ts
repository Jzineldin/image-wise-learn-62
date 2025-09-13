import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserCharacter, DEFAULT_CHARACTERS } from '@/types/character';
import { useAuth } from './useAuth';

export const useCharacters = () => {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCharacters = async () => {
    if (!user) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Remove duplicates based on name (keep the most recent)
      const uniqueCharacters = data ? data.filter((character, index, arr) => 
        arr.findIndex(c => c.name === character.name) === index
      ) : [];

      // If user has no characters, create default ones
      if (!uniqueCharacters || uniqueCharacters.length === 0) {
        await createDefaultCharacters();
      } else {
        setCharacters(uniqueCharacters);
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultCharacters = async () => {
    if (!user) return;

    try {
      const defaultCharactersWithUserId = DEFAULT_CHARACTERS.map(char => ({
        ...char,
        user_id: user.id,
        is_public: false
      }));

      const { data, error } = await supabase
        .from('user_characters')
        .insert(defaultCharactersWithUserId)
        .select();

      if (error) throw error;
      setCharacters(data || []);
    } catch (err) {
      console.error('Error creating default characters:', err);
      setError(err instanceof Error ? err.message : 'Failed to create default characters');
    }
  };

  const createCharacter = async (character: Omit<UserCharacter, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_characters')
        .insert({
          ...character,
          user_id: user.id,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setCharacters(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating character:', err);
      setError(err instanceof Error ? err.message : 'Failed to create character');
      return null;
    }
  };

  const updateCharacter = async (id: string, updates: Partial<UserCharacter>) => {
    try {
      const { data, error } = await supabase
        .from('user_characters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCharacters(prev => prev.map(char => char.id === id ? data : char));
      return data;
    } catch (err) {
      console.error('Error updating character:', err);
      setError(err instanceof Error ? err.message : 'Failed to update character');
      return null;
    }
  };

  const deleteCharacter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_characters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCharacters(prev => prev.filter(char => char.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting character:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete character');
      return false;
    }
  };

  const incrementUsage = async (id: string) => {
    try {
      const character = characters.find(c => c.id === id);
      if (!character) return;

      await updateCharacter(id, { usage_count: character.usage_count + 1 });
    } catch (err) {
      console.error('Error incrementing character usage:', err);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [user]);

  return {
    characters,
    loading,
    error,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    incrementUsage,
    refetch: fetchCharacters
  };
};