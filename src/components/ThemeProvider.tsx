/**
 * ThemeProvider Component for Tale Forge
 * Provides theme context and management across the application
 */

import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import {
  ThemeVariant,
  getCurrentTheme,
  saveTheme,
  applyTheme,
  THEME_CONFIGS,
  DEFAULT_THEME,
} from '@/lib/utils/theme';
import { useUIStore } from '@/stores/uiStore';

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
  const { theme: currentTheme, setTheme: setStoreTheme } = useUIStore();
  
  // Local state for transitions only
  const [isThemeTransitioning, setIsThemeTransitioning] = React.useState(false);
  const [autoThemeEnabled, setAutoThemeEnabled] = React.useState(enableAutoTheme);

  // Initialize theme on mount
  useEffect(() => {
    // Apply theme from store
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Auto-theme based on time of day
  useEffect(() => {
    if (!autoThemeEnabled) return;

    const checkTimeBasedTheme = () => {
      // Get recommended theme based on time of day
      const hour = new Date().getHours();
      let recommendedTheme: ThemeVariant;
      
      if (hour >= 6 && hour < 12) {
        recommendedTheme = 'dawn'; // Morning
      } else if (hour >= 12 && hour < 18) {
        recommendedTheme = 'twilight'; // Afternoon/Evening
      } else {
        recommendedTheme = 'midnight'; // Night
      }
      
      if (recommendedTheme !== currentTheme) {
        setThemeHandler(recommendedTheme);
      }
    };

    // Check immediately
    checkTimeBasedTheme();

    // Check every hour
    const interval = setInterval(checkTimeBasedTheme, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoThemeEnabled, currentTheme]);

  const setThemeHandler = useCallback(async (newTheme: ThemeVariant) => {
    if (newTheme === currentTheme) return;

    setIsThemeTransitioning(true);

    // Add transitioning class to prevent flicker
    document.body.classList.add('theme-transitioning');

    // Apply the new theme - store will handle persistence
    applyTheme(newTheme);
    setStoreTheme(newTheme);

    // Re-enable transitions after a short delay
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
      setIsThemeTransitioning(false);
    }, 50);
  }, [currentTheme, setStoreTheme]);

  const toggleTheme = useCallback(() => {
    const themes: ThemeVariant[] = ['midnight', 'twilight', 'dawn'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setThemeHandler(themes[nextIndex]);
  }, [currentTheme, setThemeHandler]);

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
    // Get recommended theme based on time of day
    const hour = new Date().getHours();
    let recommendedTheme: ThemeVariant;
    
    if (hour >= 6 && hour < 12) {
      recommendedTheme = 'dawn'; // Morning
    } else if (hour >= 12 && hour < 18) {
      recommendedTheme = 'twilight'; // Afternoon/Evening
    } else {
      recommendedTheme = 'midnight'; // Night
    }
    
    setThemeHandler(recommendedTheme);
  }, [setThemeHandler]);

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
    setTheme: setThemeHandler,
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