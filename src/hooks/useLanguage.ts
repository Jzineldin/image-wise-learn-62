import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TRANSLATIONS, t } from '@/constants/translations';

interface Language {
  code: string;
  name: string;
  native_name: string;
  ai_model_config: any;
  is_active: boolean;
}

export const useLanguage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    initializeLanguage();
    fetchAvailableLanguages();
  }, [user]);

  const initializeLanguage = async () => {
    try {
      let preferredLanguage = 'en'; // default

      if (user) {
        // Get user's preferred language from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();

        if (profile?.preferred_language) {
          preferredLanguage = profile.preferred_language;
        }
      } else {
        // Get from localStorage for non-authenticated users
        const stored = localStorage.getItem('preferred_language');
        if (stored) {
          preferredLanguage = stored;
        }
      }

      setSelectedLanguage(preferredLanguage);
    } catch (error) {
      console.error('Error initializing language:', error);
    }
  };

  const fetchAvailableLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setAvailableLanguages(data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    setSelectedLanguage(languageCode);

    try {
      if (user) {
        // Update user profile
        await supabase
          .from('profiles')
          .update({ preferred_language: languageCode })
          .eq('id', user.id);
      } else {
        // Store in localStorage
        localStorage.setItem('preferred_language', languageCode);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const getCurrentLanguage = (): Language | undefined => {
    return availableLanguages.find(lang => lang.code === selectedLanguage);
  };

  const getLanguageConfig = (languageCode?: string): any => {
    const code = languageCode || selectedLanguage;
    const language = availableLanguages.find(lang => lang.code === code);
    return language?.ai_model_config || {};
  };

  const isLanguageSupported = (languageCode: string): boolean => {
    return availableLanguages.some(lang => lang.code === languageCode && lang.is_active);
  };

  // Translation helper function
  const translate = (key: string): string => {
    return t(key, selectedLanguage);
  };

  return {
    selectedLanguage,
    availableLanguages,
    loading,
    changeLanguage,
    getCurrentLanguage,
    getLanguageConfig,
    isLanguageSupported,
    refreshLanguages: fetchAvailableLanguages,
    translate,
    t: translate, // Alias for convenience
    isSwedish: selectedLanguage === 'sv',
    isEnglish: selectedLanguage === 'en'
  };
};