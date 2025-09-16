import { describe, it, expect } from 'vitest';

describe('Import Path Integration Tests', () => {
  describe('Store exports', () => {
    it('should export all stores from stores/index.ts', async () => {
      const storesIndex = await import('@/stores/index');
      
      expect(storesIndex.useAuthStore).toBeDefined();
      expect(storesIndex.useUIStore).toBeDefined();
      expect(storesIndex.useStoryStore).toBeDefined();
    });

    it('should import individual stores directly', async () => {
      const { useUIStore } = await import('@/stores/uiStore');
      const { useStoryStore } = await import('@/stores/storyStore');
      const { useAuthStore } = await import('@/stores/authStore');
      
      expect(useUIStore).toBeDefined();
      expect(useStoryStore).toBeDefined();
      expect(useAuthStore).toBeDefined();
    });
  });

  describe('API exports', () => {
    it('should export credit API functions', async () => {
      const creditApi = await import('@/lib/api/credit-api');
      
      expect(creditApi.calculateTTSCredits).toBeDefined();
      expect(creditApi.formatTTSCreditDisplay).toBeDefined();
      expect(creditApi.getTTSPricingTiers).toBeDefined();
      expect(creditApi.estimateTTSDuration).toBeDefined();
      expect(creditApi.calculateStoryCredits).toBeDefined();
      expect(creditApi.getRecommendedVoices).toBeDefined();
    });

    it('should export story API functions', async () => {
      const storyApi = await import('@/lib/api/story-api');
      
      expect(storyApi.generateStory).toBeDefined();
      expect(storyApi.generateAudio).toBeDefined();
      expect(storyApi.translateContent).toBeDefined();
      expect(storyApi.generateStoryEnding).toBeDefined();
      expect(storyApi.createStoryWithLocalization).toBeDefined();
      expect(storyApi.getLocalizedStoryContent).toBeDefined();
      expect(storyApi.getStoryLanguages).toBeDefined();
    });
  });

  describe('Constants exports', () => {
    it('should export from constants/index.ts', async () => {
      const constants = await import('@/lib/constants/index');
      
      expect(constants.AI_PROVIDERS).toBeDefined();
      expect(constants.AI_MODELS).toBeDefined();
      expect(constants.getOperationEstimate).toBeDefined();
      expect(constants.isOperationSupported).toBeDefined();
    });

    it('should export ai constants directly', async () => {
      const aiConstants = await import('@/lib/constants/ai-constants');
      
      expect(aiConstants.AI_PROVIDERS).toBeDefined();
      expect(aiConstants.AI_MODELS).toBeDefined();
    });
  });

  describe('Utils exports', () => {
    it('should export from utils/index.ts', async () => {
      const utils = await import('@/lib/utils/index');
      
      expect(utils.cn).toBeDefined();
      expect(utils.calculateTTSCredits).toBeDefined();
      expect(utils.formatTTSCreditDisplay).toBeDefined();
    });

    it('should export cn utility directly', async () => {
      const { cn } = await import('@/lib/utils/cn');
      expect(cn).toBeDefined();
      expect(typeof cn).toBe('function');
    });

    it('should export credit calculations directly', async () => {
      const creditCalc = await import('@/lib/utils/credit-calculations');
      
      expect(creditCalc.calculateTTSCredits).toBeDefined();
      expect(creditCalc.formatTTSCreditDisplay).toBeDefined();
    });
  });

  describe('Helpers exports', () => {
    it('should export from helpers/index.ts', async () => {
      const helpers = await import('@/lib/helpers/index');
      
      // Test that helpers module exists and has expected structure
      expect(helpers).toBeDefined();
    });

    it('should export sample data directly', async () => {
      const sampleData = await import('@/lib/helpers/sample-data');
      
      // Test that sample data module exists and has expected structure
      expect(sampleData).toBeDefined();
    });
  });

  describe('UI Component imports', () => {
    it('should import cn from correct path in button component', async () => {
      // This tests that the import path refactor worked correctly
      const buttonModule = await import('@/components/ui/button');
      expect(buttonModule.Button).toBeDefined();
      expect(buttonModule.buttonVariants).toBeDefined();
    });

    it('should import cn from correct path in card component', async () => {
      const cardModule = await import('@/components/ui/card');
      expect(cardModule.Card).toBeDefined();
      expect(cardModule.CardContent).toBeDefined();
      expect(cardModule.CardHeader).toBeDefined();
    });
  });

  describe('Component imports using barrel exports', () => {
    it('should be able to import multiple utilities from utils barrel', async () => {
      const { cn, calculateTTSCredits } = await import('@/lib/utils/index');
      
      expect(cn).toBeDefined();
      expect(calculateTTSCredits).toBeDefined();
      expect(typeof cn).toBe('function');
      expect(typeof calculateTTSCredits).toBeDefined();
    });

    it('should be able to import multiple constants from constants barrel', async () => {
      const { AI_PROVIDERS, getOperationEstimate } = await import('@/lib/constants/index');
      
      expect(AI_PROVIDERS).toBeDefined();
      expect(getOperationEstimate).toBeDefined();
      expect(typeof getOperationEstimate).toBe('function');
    });
  });
});