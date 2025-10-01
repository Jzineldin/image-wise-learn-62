import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Language {
  code: string;
  name: string;
  native_name: string;
  ai_model_config: any;
  is_active: boolean;
}

interface LanguageState {
  selectedLanguage: string;
  availableLanguages: Language[];
  loading: boolean;
  setSelectedLanguage: (language: string) => void;
  setAvailableLanguages: (languages: Language[]) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Global language store using Zustand
 * 
 * This ensures language state is shared across all components
 * and persists across page reloads.
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      selectedLanguage: 'en',
      availableLanguages: [],
      loading: true,
      
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      setAvailableLanguages: (languages) => set({ availableLanguages: languages }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'language-preferences',
      partialize: (state) => ({
        selectedLanguage: state.selectedLanguage,
      }),
    }
  )
);

