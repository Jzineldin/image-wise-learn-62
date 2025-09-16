import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ThemeVariant,
  THEME_CONFIGS,
  getCurrentTheme,
  saveTheme,
  applyTheme,
  getRecommendedTheme,
  THEME_STORAGE_KEY,
  DEFAULT_THEME
} from '../theme';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock document
const mockDocument = {
  documentElement: {
    style: {
      setProperty: vi.fn(),
    },
  },
  body: {
    className: '',
    classList: {
      remove: vi.fn(),
      add: vi.fn(),
    },
  },
};

describe('Theme Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.localStorage = mockLocalStorage as any;
    global.document = mockDocument as any;
    mockDocument.body.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Theme Types and Constants', () => {
    it('should have correct theme variants', () => {
      const expectedThemes: ThemeVariant[] = ['midnight', 'twilight', 'dawn'];
      expectedThemes.forEach(theme => {
        expect(THEME_CONFIGS[theme]).toBeDefined();
      });
    });

    it('should have complete theme configurations', () => {
      Object.entries(THEME_CONFIGS).forEach(([themeName, config]) => {
        expect(config).toHaveProperty('primaryColors');
        expect(config.primaryColors).toHaveProperty('background');
        expect(config.primaryColors).toHaveProperty('foreground');
        
        expect(config).toHaveProperty('brand');
        expect(config).toHaveProperty('glassmorphism');
        expect(config).toHaveProperty('text');
        expect(config).toHaveProperty('semantic');
        expect(config).toHaveProperty('shadow');
        expect(config).toHaveProperty('gradient');
        expect(config).toHaveProperty('border');
      });
    });

    it('should have correct default theme', () => {
      expect(DEFAULT_THEME).toBe('midnight');
      expect(THEME_CONFIGS[DEFAULT_THEME]).toBeDefined();
    });
  });

  describe('getCurrentTheme', () => {
    it('should return default theme when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const theme = getCurrentTheme();
      
      expect(theme).toBe(DEFAULT_THEME);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    });

    it('should return stored theme when available', () => {
      mockLocalStorage.getItem.mockReturnValue('twilight');
      
      const theme = getCurrentTheme();
      
      expect(theme).toBe('twilight');
    });

    it('should return default theme for invalid stored value', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-theme');
      
      const theme = getCurrentTheme();
      
      expect(theme).toBe(DEFAULT_THEME);
    });
  });

  describe('saveTheme', () => {
    it('should save theme to localStorage', () => {
      saveTheme('dawn');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dawn');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => saveTheme('twilight')).not.toThrow();
    });
  });

  describe('applyTheme', () => {
    it('should apply theme CSS variables', () => {
      applyTheme('midnight');
      
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalled();
      expect(mockDocument.body.classList.remove).toHaveBeenCalled();
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('theme-midnight');
    });

    it('should apply all required CSS variables for each theme', () => {
      const themes: ThemeVariant[] = ['midnight', 'twilight', 'dawn'];
      
      themes.forEach(theme => {
        vi.clearAllMocks();
        applyTheme(theme);
        
        // Should call setProperty for each CSS variable
        expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalled();
        expect(mockDocument.body.classList.add).toHaveBeenCalledWith(`theme-${theme}`);
      });
    });

    it('should remove previous theme classes', () => {
      applyTheme('dawn');
      
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('theme-midnight');
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('theme-twilight');
      expect(mockDocument.body.classList.remove).toHaveBeenCalledWith('theme-dawn');
    });
  });

  describe('getRecommendedTheme', () => {
    it('should recommend dawn for morning hours (6-12)', () => {
      const morningDate = new Date('2023-01-01T09:00:00');
      expect(getRecommendedTheme(morningDate)).toBe('dawn');
      
      const noonDate = new Date('2023-01-01T11:59:59');
      expect(getRecommendedTheme(noonDate)).toBe('dawn');
    });

    it('should recommend twilight for evening hours (17-22)', () => {
      const eveningDate = new Date('2023-01-01T19:00:00');
      expect(getRecommendedTheme(eveningDate)).toBe('twilight');
      
      const lateEveningDate = new Date('2023-01-01T21:30:00');
      expect(getRecommendedTheme(lateEveningDate)).toBe('twilight');
    });

    it('should recommend midnight for night hours (23-5)', () => {
      const nightDate = new Date('2023-01-01T23:30:00');
      expect(getRecommendedTheme(nightDate)).toBe('midnight');
      
      const earlyMorningDate = new Date('2023-01-01T03:00:00');
      expect(getRecommendedTheme(earlyMorningDate)).toBe('midnight');
    });

    it('should recommend twilight for other hours (12-17)', () => {
      const afternoonDate = new Date('2023-01-01T14:00:00');
      expect(getRecommendedTheme(afternoonDate)).toBe('twilight');
      
      const lateAfternoonDate = new Date('2023-01-01T16:30:00');
      expect(getRecommendedTheme(lateAfternoonDate)).toBe('twilight');
    });

    it('should use current date when no date is provided', () => {
      const originalDate = Date;
      const mockDate = vi.fn(() => new Date('2023-01-01T14:00:00')) as any;
      mockDate.prototype = originalDate.prototype;
      global.Date = mockDate;
      
      const theme = getRecommendedTheme();
      expect(theme).toBe('twilight');
      
      global.Date = originalDate;
    });
  });

  describe('Theme Configuration Validation', () => {
    it('should have valid theme structure', () => {
      Object.entries(THEME_CONFIGS).forEach(([themeName, config]) => {
        expect(config.name).toBe(themeName);
        expect(config.displayName).toBeDefined();
        expect(config.description).toBeDefined();
        expect(config.primaryColors.background).toMatch(/^\d+\s+\d+%\s+\d+%$/);
      });
    });

    it('should have all required color properties', () => {
      const requiredProperties = [
        'primaryColors', 'brandColors', 'glassMorphism', 'textColors', 'semanticColors', 'shadows', 'gradients', 'borders'
      ];
      
      Object.entries(THEME_CONFIGS).forEach(([themeName, config]) => {
        requiredProperties.forEach(prop => {
          expect(config).toHaveProperty(prop);
          expect(config[prop as keyof typeof config]).toBeDefined();
        });
      });
    });
  });
});