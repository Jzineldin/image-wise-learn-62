import { useEffect, useCallback } from 'react';
import { useStoryStore } from '@/stores/storyStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/debug';

interface StoryDraft {
  flow_data: any;
  created_at: string;
  updated_at: string;
}

export const useStoryPersistence = () => {
  const { user } = useAuth();
  const {
    currentFlow,
    hasUnsavedChanges,
    lastSavedAt,
    markSaved,
    canResume
  } = useStoryStore();

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!hasUnsavedChanges || currentFlow.step <= 1) return;

    const autoSaveInterval = setInterval(() => {
      saveDraft();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, currentFlow.step]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && currentFlow.step > 1) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        saveDraft(); // Attempt to save
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, currentFlow.step]);

  const saveDraft = useCallback(async () => {
    if (!hasUnsavedChanges || currentFlow.step <= 1) return;

    try {
      const draftData = {
        flow_data: currentFlow,
        created_at: lastSavedAt ? new Date(lastSavedAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to localStorage with user-specific key
      const key = user ? `tale-forge-draft-${user.id}` : 'tale-forge-draft-anonymous';
      localStorage.setItem(key, JSON.stringify(draftData));

      markSaved();
      logger.debug('Story draft saved to localStorage', { step: currentFlow.step });
    } catch (error) {
      logger.error('Failed to save story draft', error);
    }
  }, [hasUnsavedChanges, currentFlow, markSaved, lastSavedAt, user]);

  const loadDraft = useCallback(async (): Promise<boolean> => {
    try {
      const key = user ? `tale-forge-draft-${user.id}` : 'tale-forge-draft-anonymous';
      const draftJson = localStorage.getItem(key);
      
      if (!draftJson) return false;

      const draft = JSON.parse(draftJson);

      // Check if draft is recent (within 24 hours)
      const draftAge = Date.now() - new Date(draft.updated_at).getTime();
      if (draftAge > 24 * 60 * 60 * 1000) {
        deleteDraft(); // Clean up old draft
        return false;
      }

      // Validate draft data
      if (!draft.flow_data || typeof draft.flow_data !== 'object') {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to load story draft', error);
      return false;
    }
  }, [user]);

  const getDraft = useCallback(async (): Promise<StoryDraft | null> => {
    try {
      const key = user ? `tale-forge-draft-${user.id}` : 'tale-forge-draft-anonymous';
      const draftJson = localStorage.getItem(key);
      
      if (!draftJson) return null;

      const draft = JSON.parse(draftJson);
      return draft;
    } catch (error) {
      logger.error('Failed to get story draft', error);
      return null;
    }
  }, [user]);

  const deleteDraft = useCallback(async () => {
    try {
      const key = user ? `tale-forge-draft-${user.id}` : 'tale-forge-draft-anonymous';
      localStorage.removeItem(key);
      logger.debug('Story draft deleted from localStorage');
    } catch (error) {
      logger.error('Failed to delete story draft', error);
    }
  }, [user]);

  const manualSave = useCallback(async () => {
    if (!hasUnsavedChanges) {
      toast.success('Already saved!');
      return;
    }

    try {
      await saveDraft();
      toast.success('Draft saved!');
    } catch (error) {
      toast.error('Failed to save draft');
    }
  }, [saveDraft, hasUnsavedChanges]);

  return {
    saveDraft,
    loadDraft,
    getDraft,
    deleteDraft,
    manualSave,
    hasUnsavedChanges,
    lastSavedAt,
    canResume: canResume()
  };
};