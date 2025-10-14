import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface StoryDraft {
  ageGroup?: string;
  genres: string[];
  selectedCharacters: any[];
  selectedSeed?: any;
  customSeed?: string;
  step: number;
  languageCode?: string;
}

interface UseAutoSaveOptions {
  debounceMs?: number;
  enableLocalStorage?: boolean;
  enableToasts?: boolean;
  maxRetries?: number;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

const DEFAULT_OPTIONS: Required<UseAutoSaveOptions> = {
  debounceMs: 2000,
  enableLocalStorage: true,
  enableToasts: false,
  maxRetries: 3,
};

/**
 * useAutoSave hook - Automatically saves story creation progress
 * 
 * Features:
 * - 2-second debounce to prevent excessive saves
 * - LocalStorage backup for offline resilience
 * - Supabase integration for cross-device sync
 * - Exponential backoff retry logic
 * - Error handling and recovery
 * 
 * @param data - Story draft data to save
 * @param options - Configuration options
 * @returns Auto-save state and control functions
 */
export const useAutoSave = (
  data: StoryDraft,
  options: UseAutoSaveOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { user } = useAuth();
  
  const [state, setState] = useAutoSaveReducer();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const lastDataRef = useRef<string>('');

  // LocalStorage key
  const STORAGE_KEY = `story_draft_${user?.id || 'guest'}`;

  /**
   * Save to localStorage as backup
   */
  const saveToLocalStorage = useCallback((draft: StoryDraft) => {
    if (!opts.enableLocalStorage) return;
    
    try {
      const serialized = JSON.stringify({
        ...draft,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, serialized);
      logger.debug('Draft saved to localStorage', { userId: user?.id });
    } catch (error) {
      logger.error('Failed to save to localStorage', error);
    }
  }, [STORAGE_KEY, opts.enableLocalStorage, user?.id]);

  /**
   * Load from localStorage
   */
  const loadFromLocalStorage = useCallback((): StoryDraft | null => {
    if (!opts.enableLocalStorage) return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      logger.debug('Draft loaded from localStorage', { userId: user?.id });
      return parsed;
    } catch (error) {
      logger.error('Failed to load from localStorage', error);
      return null;
    }
  }, [STORAGE_KEY, opts.enableLocalStorage, user?.id]);

  /**
   * Clear localStorage draft
   */
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      logger.debug('Draft cleared from localStorage', { userId: user?.id });
    } catch (error) {
      logger.error('Failed to clear localStorage', error);
    }
  }, [STORAGE_KEY, user?.id]);

  /**
   * Save to Supabase with retry logic
   */
  const saveToSupabase = useCallback(async (draft: StoryDraft, retryCount = 0): Promise<boolean> => {
    if (!user) {
      logger.warn('Cannot save to Supabase: no user');
      return false;
    }

    try {
      setState({ isSaving: true, error: null });

      // Extract character IDs robustly (supports objects, UUID strings, and JSON-stringified objects)
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const characterIds = (draft.selectedCharacters || [])
        .map((char: any) => {
          if (!char) return null;
          if (typeof char === 'string') {
            if (uuidRe.test(char)) return char; // already a UUID
            // try parse JSON string
            try {
              const obj = JSON.parse(char);
              if (obj && typeof obj.id === 'string' && uuidRe.test(obj.id)) return obj.id;
              return null;
            } catch {
              return null;
            }
          }
          if (typeof char === 'object' && typeof char.id === 'string' && uuidRe.test(char.id)) {
            return char.id;
          }
          return null;
        })
        .filter((v: string | null): v is string => Boolean(v));

      const { error } = await supabase
        .from('story_drafts' as any)
        .upsert({
          user_id: user.id,
          age_group: draft.ageGroup,
          genres: draft.genres,
          selected_characters: characterIds,
          selected_seed: draft.selectedSeed,
          custom_seed: draft.customSeed,
          current_step: draft.step,
          language_code: draft.languageCode || 'en',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setState({ 
        isSaving: false, 
        lastSaved: new Date(),
        error: null 
      });
      
      retryCountRef.current = 0;
      logger.info('Draft saved to Supabase', { userId: user.id });
      
      if (opts.enableToasts) {
        toast.success('Draft saved', { duration: 2000 });
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to save to Supabase', error);

      // Retry with exponential backoff
      if (retryCount < opts.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        logger.info(`Retrying save in ${delay}ms (attempt ${retryCount + 1}/${opts.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return saveToSupabase(draft, retryCount + 1);
      }

      setState({ 
        isSaving: false, 
        error: error as Error 
      });
      
      if (opts.enableToasts) {
        toast.error('Failed to save draft', { duration: 3000 });
      }
      
      return false;
    }
  }, [user, opts.maxRetries, opts.enableToasts]);

  /**
   * Main save function with debounce
   */
  const save = useCallback((draft: StoryDraft) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the save
    debounceTimerRef.current = setTimeout(async () => {
      // Check if data has actually changed
      const currentDataStr = JSON.stringify(draft);
      if (currentDataStr === lastDataRef.current) {
        return; // No changes, skip save
      }
      lastDataRef.current = currentDataStr;

      // Save to localStorage immediately (fast)
      saveToLocalStorage(draft);

      // Save to Supabase (slower, async)
      if (user) {
        await saveToSupabase(draft);
      }
    }, opts.debounceMs);
  }, [opts.debounceMs, saveToLocalStorage, saveToSupabase, user]);

  /**
   * Load existing draft from Supabase
   */
  const loadDraft = useCallback(async (): Promise<StoryDraft | null> => {
    if (!user) {
      // Try localStorage for guest users
      return loadFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from('story_drafts' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No draft found, try localStorage
          return loadFromLocalStorage();
        }
        throw error;
      }

      if (data) {
        const draft: StoryDraft = {
          ageGroup: (data as any).age_group,
          genres: (data as any).genres || [],
          selectedCharacters: (data as any).selected_characters || [],
          selectedSeed: (data as any).selected_seed,
          customSeed: (data as any).custom_seed,
          step: (data as any).current_step || 1,
          languageCode: (data as any).language_code || 'en',
        };

        logger.info('Draft loaded from Supabase', { userId: user.id });
        return draft;
      }

      return loadFromLocalStorage();
    } catch (error) {
      logger.error('Failed to load draft from Supabase', error);
      return loadFromLocalStorage();
    }
  }, [user, loadFromLocalStorage]);

  /**
   * Delete draft from both storage locations
   */
  const deleteDraft = useCallback(async (): Promise<boolean> => {
    clearLocalStorage();

    if (!user) return true;

    try {
      const { error } = await supabase
        .from('story_drafts' as any)
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      logger.info('Draft deleted', { userId: user.id });
      
      if (opts.enableToasts) {
        toast.success('Draft deleted');
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to delete draft', error);
      
      if (opts.enableToasts) {
        toast.error('Failed to delete draft');
      }
      
      return false;
    }
  }, [user, clearLocalStorage, opts.enableToasts]);

  /**
   * Auto-save effect - triggers on data changes
   */
  useEffect(() => {
    // Only save if we have meaningful data
    if (data.ageGroup || data.genres.length > 0 || data.customSeed) {
      save(data);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, save]);

  return {
    ...state,
    save,
    loadDraft,
    deleteDraft,
    loadFromLocalStorage,
    clearLocalStorage,
  };
};

// Re-export for convenience
import React, { useState } from 'react';

/**
 * Simple state reducer for auto-save state
 */
function useAutoSaveReducer() {
  const [state, setStateRaw] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  const setState = useCallback((updates: Partial<AutoSaveState>) => {
    setStateRaw(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, setState] as const;
}