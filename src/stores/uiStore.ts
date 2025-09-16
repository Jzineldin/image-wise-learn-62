import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'midnight' | 'twilight' | 'dawn';
export type Language = 'en' | 'sv';

interface UIState {
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  onboardingCompleted: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setSidebarOpen: (open: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'midnight',
      language: 'en',
      sidebarOpen: false,
      onboardingCompleted: false,
      
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
    }),
    {
      name: 'ui-preferences',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);