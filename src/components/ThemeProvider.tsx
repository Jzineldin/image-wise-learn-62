/**
 * ThemeProvider Component for Tale Forge
 * Provides theme context and management across the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  ThemeVariant,
  getCurrentTheme,
  saveTheme,
  applyTheme,
  enableThemeTransitions,
  disableThemeTransitions,
  getRecommendedTheme,
  THEME_CONFIGS,
  DEFAULT_THEME,
} from '@/lib/theme-utils';

interface ThemeContextType {
  currentTheme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
  toggleTheme: () => void;
  getThemeDisplayName: (theme: ThemeVariant) => string;
  getThemeDescription: (theme: ThemeVariant) => string;
  getAllThemes: () => { value: ThemeVariant; label: string; description: string }[];
  isThemeTransitioning: boolean;
  useRecommendedTheme: () => void;
  enableAutoTheme: boolean;
  setEnableAutoTheme: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeVariant;
  enableAutoTheme?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  enableAutoTheme = false
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>(defaultTheme);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [autoThemeEnabled, setAutoThemeEnabled] = useState(enableAutoTheme);

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = getCurrentTheme();
    setCurrentTheme(storedTheme);
    applyTheme(storedTheme);
    enableThemeTransitions();
  }, []);

  // Auto-theme based on time of day
  useEffect(() => {
    if (!autoThemeEnabled) return;

    const checkTimeBasedTheme = () => {
      const recommendedTheme = getRecommendedTheme();
      if (recommendedTheme !== currentTheme) {
        setTheme(recommendedTheme);
      }
    };

    // Check immediately
    checkTimeBasedTheme();

    // Check every hour
    const interval = setInterval(checkTimeBasedTheme, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoThemeEnabled, currentTheme]);

  const setTheme = useCallback(async (newTheme: ThemeVariant) => {
    if (newTheme === currentTheme) return;

    setIsThemeTransitioning(true);

    // Add transitioning class to prevent flicker
    document.body.classList.add('theme-transitioning');

    // Briefly disable transitions for the actual theme change
    disableThemeTransitions();

    // Apply the new theme
    applyTheme(newTheme);
    saveTheme(newTheme);
    setCurrentTheme(newTheme);

    // Re-enable transitions after a short delay
    setTimeout(() => {
      enableThemeTransitions();
      document.body.classList.remove('theme-transitioning');
      setIsThemeTransitioning(false);
    }, 50);
  }, [currentTheme]);

  const toggleTheme = useCallback(() => {
    const themes: ThemeVariant[] = ['midnight', 'twilight', 'dawn'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [currentTheme, setTheme]);

  const getThemeDisplayName = useCallback((theme: ThemeVariant): string => {
    return THEME_CONFIGS[theme].displayName;
  }, []);

  const getThemeDescription = useCallback((theme: ThemeVariant): string => {
    return THEME_CONFIGS[theme].description;
  }, []);

  const getAllThemes = useCallback(() => {
    return Object.entries(THEME_CONFIGS).map(([value, config]) => ({
      value: value as ThemeVariant,
      label: config.displayName,
      description: config.description,
    }));
  }, []);

  const useRecommendedTheme = useCallback(() => {
    const recommendedTheme = getRecommendedTheme();
    setTheme(recommendedTheme);
  }, [setTheme]);

  const setEnableAutoTheme = useCallback((enabled: boolean) => {
    setAutoThemeEnabled(enabled);

    // Save auto-theme preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('tale-forge-auto-theme', enabled.toString());
    }
  }, []);

  // Load auto-theme preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tale-forge-auto-theme');
      if (stored !== null) {
        setAutoThemeEnabled(stored === 'true');
      }
    }
  }, []);

  const contextValue: ThemeContextType = {
    currentTheme,
    setTheme,
    toggleTheme,
    getThemeDisplayName,
    getThemeDescription,
    getAllThemes,
    isThemeTransitioning,
    useRecommendedTheme,
    enableAutoTheme: autoThemeEnabled,
    setEnableAutoTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * HOC to wrap components with theme context
 */
export function withTheme<P extends object>(Component: React.ComponentType<P>) {
  return function ThemedComponent(props: P) {
    return (
      <ThemeProvider>
        <Component {...props} />
      </ThemeProvider>
    );
  };
}

/**
 * Hook for conditional theme-based styling
 */
export function useThemeClasses() {
  const { currentTheme } = useTheme();

  return {
    themeClass: `theme-${currentTheme}`,
    isTheme: (theme: ThemeVariant) => currentTheme === theme,
    isDarkTheme: currentTheme === 'midnight',
    isLightTheme: currentTheme === 'dawn',
    isTwilightTheme: currentTheme === 'twilight',

    // Conditional class builders
    glassCard: (variant?: 'elevated' | 'dark' | 'light' | 'form' | 'auth') => {
      const base = 'glass-card';
      if (!variant) return base;

      // For Dawn theme, prefer light variants
      if (currentTheme === 'dawn' && (variant === 'elevated' || variant === 'dark')) {
        return `${base}-light`;
      }

      return `${base}-${variant}`;
    },

    textShadow: currentTheme === 'dawn' ? 'text-with-shadow' : 'text-with-shadow',
    contentOverlay: 'content-overlay',
  };
}

/**
 * Hook for theme-aware page classes
 */
export function usePageThemeClasses(pageType?: 'auth' | 'settings' | 'dashboard' | 'story-creation') {
  const { themeClass } = useThemeClasses();

  const pageClass = pageType ? `${pageType}-page` : '';

  return {
    pageClassName: [themeClass, pageClass].filter(Boolean).join(' '),
    containerClass: `${themeClass} ${pageClass}`.trim(),
  };
}

export default ThemeProvider;