/**
 * Theme utilities - moved from lib/theme-utils.ts for better organization
 */

export type ThemeVariant = 'midnight' | 'twilight' | 'dawn';

export interface ThemeConfig {
  name: string;
  displayName: string;
  description: string;
  primaryColors: {
    background: string;
    foreground: string;
    surface: string;
    surfaceElevated: string;
    surfaceOverlay: string;
  };
  brandColors: {
    primary: string;
    primaryForeground: string;
    primaryHover: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
  };
  glassMorphism: {
    dark: string;
    medium: string;
    light: string;
    cardOverlay: string;
    backdropBlur: string;
  };
  textColors: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  semanticColors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  shadows: {
    glow: string;
    glowStrong: string;
    glass: string;
    text: string;
  };
  gradients: {
    primary: string;
    surface: string;
    glass: string;
    fire: string;
  };
  borders: {
    default: string;
    input: string;
    ring: string;
  };
}

// Export all theme configurations from the original file
export const THEME_CONFIGS: Record<ThemeVariant, ThemeConfig> = {
  midnight: {
    name: 'midnight',
    displayName: 'Midnight',
    description: 'Deep, immersive dark theme perfect for focused storytelling',
    primaryColors: {
      background: '240 25% 3%', // #050510 - Very Dark Blue-Black
      foreground: '0 0% 100%', // #FFFFFF - White
      surface: '240 25% 7%', // #0A0A1F - Dark Surface
      surfaceElevated: '240 25% 11%', // #12122A - Elevated Surface
      surfaceOverlay: '240 25% 15%', // #1A1A35 - Overlay Surface
    },
    brandColors: {
      primary: '39 100% 50%', // #FFA500 - Amber
      primaryForeground: '0 0% 100%',
      primaryHover: '33 100% 50%', // #FF8C00 - Dark Orange
      secondary: '51 100% 50%', // #FFD700 - Gold
      secondaryForeground: '240 25% 3%',
      accent: '39 100% 50%',
      accentForeground: '0 0% 100%',
    },
    glassMorphism: {
      dark: '0 0% 0% / 0.6',
      medium: '0 0% 0% / 0.4',
      light: '0 0% 100% / 0.05',
      cardOverlay: '0 0% 0% / 0.7',
      backdropBlur: '12px',
    },
    textColors: {
      primary: '0 0% 100%',
      secondary: '0 0% 85%',
      tertiary: '0 0% 70%',
      muted: '0 0% 100% / 0.8',
    },
    semanticColors: {
      success: '142 71% 45%', // #10B981 - Green
      warning: '45 93% 47%', // #F59E0B - Yellow
      error: '0 84% 60%', // #EF4444 - Red
      info: '217 91% 60%', // #3B82F6 - Blue
    },
    shadows: {
      glow: '0 0 20px hsl(39 100% 50% / 0.3)',
      glowStrong: '0 0 40px hsl(39 100% 50% / 0.5)',
      glass: '0 20px 25px -5px hsl(0 0% 0% / 0.4)',
      text: '0 1px 3px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.4)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(39 100% 50%), hsl(51 100% 50%))',
      surface: 'linear-gradient(135deg, hsl(240 25% 7%), hsl(240 25% 11%))',
      glass: 'linear-gradient(135deg, hsl(0 0% 0% / 0.6), hsl(0 0% 0% / 0.3))',
      fire: 'linear-gradient(135deg, #ff8c00, #ffa500, #ffb347, #ffd700, #ffdd4a, #ffe135)',
    },
    borders: {
      default: '39 100% 50% / 0.2',
      input: '0 0% 100% / 0.2',
      ring: '39 100% 50%',
    },
  },
  // Add other theme variants here...
  twilight: {
    name: 'twilight',
    displayName: 'Twilight',
    description: 'Balanced theme with softer contrasts for extended reading sessions',
    primaryColors: {
      background: '240 20% 8%',
      foreground: '0 0% 95%',
      surface: '240 20% 12%',
      surfaceElevated: '240 20% 16%',
      surfaceOverlay: '240 20% 20%',
    },
    brandColors: {
      primary: '39 85% 55%',
      primaryForeground: '0 0% 100%',
      primaryHover: '33 85% 55%',
      secondary: '51 85% 55%',
      secondaryForeground: '240 20% 8%',
      accent: '270 60% 60%',
      accentForeground: '0 0% 100%',
    },
    glassMorphism: {
      dark: '0 0% 0% / 0.5',
      medium: '0 0% 0% / 0.3',
      light: '0 0% 100% / 0.08',
      cardOverlay: '0 0% 0% / 0.6',
      backdropBlur: '16px',
    },
    textColors: {
      primary: '0 0% 95%',
      secondary: '0 0% 80%',
      tertiary: '0 0% 65%',
      muted: '0 0% 95% / 0.7',
    },
    semanticColors: {
      success: '142 65% 50%',
      warning: '45 85% 52%',
      error: '0 75% 65%',
      info: '217 85% 65%',
    },
    shadows: {
      glow: '0 0 24px hsl(39 85% 55% / 0.4)',
      glowStrong: '0 0 48px hsl(39 85% 55% / 0.6)',
      glass: '0 24px 32px -6px hsl(0 0% 0% / 0.3)',
      text: '0 1px 2px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(39 85% 55%), hsl(51 85% 55%))',
      surface: 'linear-gradient(135deg, hsl(240 20% 12%), hsl(240 20% 16%))',
      glass: 'linear-gradient(135deg, hsl(0 0% 0% / 0.5), hsl(0 0% 0% / 0.2))',
      fire: 'linear-gradient(135deg, #e67e22, #f39c12, #f1c40f, #f7dc6f, #f8c471, #f5b041)',
    },
    borders: {
      default: '39 85% 55% / 0.25',
      input: '0 0% 100% / 0.25',
      ring: '39 85% 55%',
    },
  },
  dawn: {
    name: 'dawn',
    displayName: 'Dawn',
    description: 'Warm, lighter theme inspired by early morning light',
    primaryColors: {
      background: '35 15% 15%',
      foreground: '35 5% 90%',
      surface: '35 12% 20%',
      surfaceElevated: '35 10% 25%',
      surfaceOverlay: '35 8% 30%',
    },
    brandColors: {
      primary: '25 100% 60%',
      primaryForeground: '35 15% 15%',
      primaryHover: '20 100% 55%',
      secondary: '45 100% 65%',
      secondaryForeground: '35 15% 15%',
      accent: '320 50% 65%',
      accentForeground: '35 15% 15%',
    },
    glassMorphism: {
      dark: '35 25% 10% / 0.6',
      medium: '35 20% 15% / 0.4',
      light: '35 5% 90% / 0.1',
      cardOverlay: '35 20% 10% / 0.7',
      backdropBlur: '20px',
    },
    textColors: {
      primary: '35 5% 90%',
      secondary: '35 5% 75%',
      tertiary: '35 5% 60%',
      muted: '35 5% 90% / 0.8',
    },
    semanticColors: {
      success: '142 55% 55%',
      warning: '45 80% 60%',
      error: '0 70% 70%',
      info: '217 75% 70%',
    },
    shadows: {
      glow: '0 0 28px hsl(25 100% 60% / 0.4)',
      glowStrong: '0 0 56px hsl(25 100% 60% / 0.6)',
      glass: '0 28px 40px -8px hsl(35 25% 10% / 0.4)',
      text: '0 1px 2px rgba(33, 31, 28, 0.6), 0 2px 4px rgba(33, 31, 28, 0.3)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(25 100% 60%), hsl(45 100% 65%))',
      surface: 'linear-gradient(135deg, hsl(35 12% 20%), hsl(35 10% 25%))',
      glass: 'linear-gradient(135deg, hsl(35 25% 10% / 0.6), hsl(35 20% 15% / 0.3))',
      fire: 'linear-gradient(135deg, #e67e22, #f39c12, #f1c40f, #f7dc6f, #f8c471, #f5b041)',
    },
    borders: {
      default: '25 100% 60% / 0.3',
      input: '35 5% 90% / 0.3',
      ring: '25 100% 60%',
    },
  },
};

export const THEME_STORAGE_KEY = 'tale-forge-theme';
export const DEFAULT_THEME: ThemeVariant = 'midnight';

/**
 * Get the current theme from localStorage or return default
 */
export function getCurrentTheme(): ThemeVariant {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && Object.keys(THEME_CONFIGS).includes(stored)) {
    return stored as ThemeVariant;
  }

  return DEFAULT_THEME;
}

/**
 * Save theme preference to localStorage
 */
export function saveTheme(theme: ThemeVariant): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Apply theme to document root
 */
export function applyTheme(theme: ThemeVariant): void {
  const config = THEME_CONFIGS[theme];
  const root = document.documentElement;

  // Apply primary colors
  root.style.setProperty('--background', config.primaryColors.background);
  root.style.setProperty('--foreground', config.primaryColors.foreground);
  root.style.setProperty('--surface', config.primaryColors.surface);
  root.style.setProperty('--surface-elevated', config.primaryColors.surfaceElevated);
  root.style.setProperty('--surface-overlay', config.primaryColors.surfaceOverlay);

  // Apply brand colors
  root.style.setProperty('--primary', config.brandColors.primary);
  root.style.setProperty('--primary-foreground', config.brandColors.primaryForeground);
  root.style.setProperty('--primary-hover', config.brandColors.primaryHover);
  root.style.setProperty('--secondary', config.brandColors.secondary);
  root.style.setProperty('--secondary-foreground', config.brandColors.secondaryForeground);
  root.style.setProperty('--accent', config.brandColors.accent);
  root.style.setProperty('--accent-foreground', config.brandColors.accentForeground);

  // Apply glass morphism
  root.style.setProperty('--glass-dark', config.glassMorphism.dark);
  root.style.setProperty('--glass-medium', config.glassMorphism.medium);
  root.style.setProperty('--glass-light', config.glassMorphism.light);
  root.style.setProperty('--glass-card-overlay', config.glassMorphism.cardOverlay);
  root.style.setProperty('--glass-backdrop-blur', config.glassMorphism.backdropBlur);

  // Apply text colors
  root.style.setProperty('--text-primary', config.textColors.primary);
  root.style.setProperty('--text-secondary', config.textColors.secondary);
  root.style.setProperty('--text-tertiary', config.textColors.tertiary);
  root.style.setProperty('--text-muted', config.textColors.muted);

  // Apply semantic colors
  root.style.setProperty('--success', config.semanticColors.success);
  root.style.setProperty('--warning', config.semanticColors.warning);
  root.style.setProperty('--error', config.semanticColors.error);
  root.style.setProperty('--info', config.semanticColors.info);

  // Apply shadows
  root.style.setProperty('--shadow-glow', config.shadows.glow);
  root.style.setProperty('--shadow-glow-strong', config.shadows.glowStrong);
  root.style.setProperty('--shadow-glass', config.shadows.glass);
  root.style.setProperty('--shadow-text', config.shadows.text);

  // Apply gradients
  root.style.setProperty('--gradient-primary', config.gradients.primary);
  root.style.setProperty('--gradient-surface', config.gradients.surface);
  root.style.setProperty('--gradient-glass', config.gradients.glass);
  root.style.setProperty('--gradient-fire', config.gradients.fire);

  // Apply borders
  root.style.setProperty('--border', config.borders.default);
  root.style.setProperty('--input', config.borders.input);
  root.style.setProperty('--ring', config.borders.ring);

  // Update shadcn/ui compatibility
  root.style.setProperty('--card', config.primaryColors.surface);
  root.style.setProperty('--card-foreground', config.primaryColors.foreground);
  root.style.setProperty('--popover', config.primaryColors.surfaceElevated);
  root.style.setProperty('--popover-foreground', config.primaryColors.foreground);
  root.style.setProperty('--muted', config.primaryColors.surfaceOverlay);
  root.style.setProperty('--muted-foreground', config.textColors.tertiary);
  root.style.setProperty('--destructive', config.semanticColors.error);
  root.style.setProperty('--destructive-foreground', config.primaryColors.foreground);

  // Add theme class to body for CSS selectors
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${theme}`);
}

/**
 * Return the recommended theme based on time of day (local by default)
 */
export function getRecommendedTheme(date: Date = new Date()): ThemeVariant {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'dawn';
  if (hour >= 12 && hour < 18) return 'twilight';
  return 'midnight';
}