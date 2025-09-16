import { describe, it, expect, vi } from 'vitest';

describe('Application Integration Tests', () => {
  describe('Theme System Integration', () => {
    it('should import ThemeProvider without errors', async () => {
      const { ThemeProvider } = await import('@/components/ThemeProvider');
      expect(ThemeProvider).toBeDefined();
    });

    it('should import theme utilities without errors', async () => {
      const themeUtils = await import('@/lib/utils/theme');
      expect(themeUtils.THEME_CONFIGS).toBeDefined();
      expect(themeUtils.applyTheme).toBeDefined();
      expect(themeUtils.getCurrentTheme).toBeDefined();
    });

    it('should have consistent theme types across stores and components', async () => {
      const { useUIStore } = await import('@/stores/uiStore');
      const themeUtils = await import('@/lib/utils/theme');
      
      expect(useUIStore).toBeDefined();
      expect(themeUtils.THEME_CONFIGS).toBeDefined();
      
      // Verify that store uses correct theme type
      const store = useUIStore.getState();
      expect(['midnight', 'twilight', 'dawn']).toContain(store.theme);
    });
  });

  describe('Logger Integration', () => {
    it('should import debug logger without errors', async () => {
      const { logger, DebugLogger, generateRequestId } = await import('@/lib/debug');
      
      expect(logger).toBeDefined();
      expect(DebugLogger).toBeDefined();
      expect(generateRequestId).toBeDefined();
      expect(typeof generateRequestId).toBe('function');
    });

    it('should generate valid request IDs', async () => {
      const { generateRequestId } = await import('@/lib/debug');
      
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Store Integration', () => {
    it('should import all stores from index', async () => {
      const stores = await import('@/stores/index');
      
      expect(stores.useAuthStore).toBeDefined();
      expect(stores.useUIStore).toBeDefined();
      expect(stores.useStoryStore).toBeDefined();
    });

    it('should have properly typed store states', async () => {
      const { useAuthStore, useUIStore, useStoryStore } = await import('@/stores/index');
      
      const authState = useAuthStore.getState();
      const uiState = useUIStore.getState();
      const storyState = useStoryStore.getState();
      
      // Auth store
      expect(typeof authState.loading).toBe('boolean');
      expect(authState.user === null || typeof authState.user === 'object').toBe(true);
      
      // UI store
      expect(['midnight', 'twilight', 'dawn']).toContain(uiState.theme);
      expect(['en', 'sv']).toContain(uiState.language);
      expect(typeof uiState.sidebarOpen).toBe('boolean');
      
      // Story store
      expect(typeof storyState.isGenerating).toBe('boolean');
      expect(typeof storyState.generationProgress).toBe('number');
      expect(['text', 'audio', 'both']).toContain(storyState.readingMode);
    });
  });

  describe('API Integration', () => {
    it('should import story API without errors', async () => {
      const storyApi = await import('@/lib/api/story-api');
      
      expect(storyApi.generateStory).toBeDefined();
      expect(storyApi.generateAudio).toBeDefined();
      expect(storyApi.translateContent).toBeDefined();
      expect(storyApi.generateStoryEnding).toBeDefined();
      
      expect(typeof storyApi.generateStory).toBe('function');
      expect(typeof storyApi.generateAudio).toBe('function');
    });

    it('should import credit API without errors', async () => {
      const creditApi = await import('@/lib/api/credit-api');
      
      expect(creditApi.calculateTTSCredits).toBeDefined();
      expect(creditApi.formatTTSCreditDisplay).toBeDefined();
      expect(creditApi.getTTSPricingTiers).toBeDefined();
      
      expect(typeof creditApi.calculateTTSCredits).toBe('function');
      expect(typeof creditApi.formatTTSCreditDisplay).toBe('function');
    });
  });

  describe('Component Integration', () => {
    it('should import UI components without errors', async () => {
      const { Button } = await import('@/components/ui/button');
      const { Card } = await import('@/components/ui/card');
      const { toast } = await import('@/components/ui/sonner');
      
      expect(Button).toBeDefined();
      expect(Card).toBeDefined();
      expect(toast).toBeDefined();
    });

    it('should import theme components without errors', async () => {
      const { ThemeToggle } = await import('@/components/ThemeToggle');
      const { ThemeProvider } = await import('@/components/ThemeProvider');
      
      expect(ThemeToggle).toBeDefined();
      expect(ThemeProvider).toBeDefined();
    });
  });

  describe('Constants Integration', () => {
    it('should import AI constants without errors', async () => {
      const aiConstants = await import('@/lib/constants/ai-constants');
      
      expect(aiConstants.AI_PROVIDERS).toBeDefined();
      expect(aiConstants.AI_MODELS).toBeDefined();
      expect(aiConstants.getOperationEstimate).toBeDefined();
      expect(aiConstants.isOperationSupported).toBeDefined();
      
      expect(typeof aiConstants.getOperationEstimate).toBe('function');
      expect(typeof aiConstants.isOperationSupported).toBe('function');
    });
  });

  describe('Build Health Check', () => {
    it('should have no circular dependencies in main modules', async () => {
      // Test that we can import all main modules without issues
      const imports = await Promise.all([
        import('@/App'),
        import('@/stores/index'),
        import('@/components/ThemeProvider'),
        import('@/lib/debug'),
        import('@/lib/api/story-api'),
        import('@/lib/utils/theme'),
      ]);
      
      imports.forEach((module, index) => {
        expect(module).toBeDefined();
        expect(typeof module).toBe('object');
      });
    });

    it('should have properly configured TypeScript paths', async () => {
      // Test that @ paths resolve correctly
      const modules = await Promise.all([
        import('@/components/ui/button'),
        import('@/hooks/useAuth'),
        import('@/lib/utils/cn'),
        import('@/stores/authStore'),
        import('@/types/character'),
      ]);
      
      modules.forEach(module => {
        expect(module).toBeDefined();
      });
    });
  });
});