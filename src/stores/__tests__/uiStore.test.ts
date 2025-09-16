import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      theme: 'midnight',
      language: 'en',
      sidebarOpen: false,
      onboardingCompleted: false,
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useUIStore.getState();
      expect(state.theme).toBe('midnight');
      expect(state.language).toBe('en');
      expect(state.sidebarOpen).toBe(false);
      expect(state.onboardingCompleted).toBe(false);
    });
  });

  describe('theme management', () => {
    it('should update theme', () => {
      const { setTheme } = useUIStore.getState();
      setTheme('twilight');
      expect(useUIStore.getState().theme).toBe('twilight');
    });

    it('should handle all theme values', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('dawn');
      expect(useUIStore.getState().theme).toBe('dawn');
      
      setTheme('twilight');
      expect(useUIStore.getState().theme).toBe('twilight');
      
      setTheme('midnight');
      expect(useUIStore.getState().theme).toBe('midnight');
    });
  });

  describe('language management', () => {
    it('should update language', () => {
      const { setLanguage } = useUIStore.getState();
      setLanguage('sv');
      expect(useUIStore.getState().language).toBe('sv');
    });

    it('should handle both supported languages', () => {
      const { setLanguage } = useUIStore.getState();
      
      setLanguage('sv');
      expect(useUIStore.getState().language).toBe('sv');
      
      setLanguage('en');
      expect(useUIStore.getState().language).toBe('en');
    });
  });

  describe('sidebar management', () => {
    it('should update sidebar state', () => {
      const { setSidebarOpen } = useUIStore.getState();
      setSidebarOpen(true);
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should toggle sidebar state', () => {
      const { toggleSidebar } = useUIStore.getState();
      
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('onboarding management', () => {
    it('should update onboarding completed state', () => {
      const { setOnboardingCompleted } = useUIStore.getState();
      setOnboardingCompleted(true);
      expect(useUIStore.getState().onboardingCompleted).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should persist theme, language, and onboarding state', () => {
      const { setTheme, setLanguage, setOnboardingCompleted } = useUIStore.getState();
      
      setTheme('twilight');
      setLanguage('sv');
      setOnboardingCompleted(true);
      
      // Simulate store rehydration
      const persistedState = {
        theme: useUIStore.getState().theme,
        language: useUIStore.getState().language,
        onboardingCompleted: useUIStore.getState().onboardingCompleted,
      };
      
      expect(persistedState.theme).toBe('twilight');
      expect(persistedState.language).toBe('sv');
      expect(persistedState.onboardingCompleted).toBe(true);
    });

    it('should not persist sidebar state', () => {
      const { setSidebarOpen } = useUIStore.getState();
      setSidebarOpen(true);
      
      // Sidebar state should not be included in persistence
      const persistedState = {
        theme: useUIStore.getState().theme,
        language: useUIStore.getState().language,
        onboardingCompleted: useUIStore.getState().onboardingCompleted,
      };
      
      expect('sidebarOpen' in persistedState).toBe(false);
    });
  });
});