import { describe, it, expect } from 'vitest';
import { 
  getOperationEstimate, 
  isOperationSupported,
  AI_PROVIDERS,
  AI_MODELS,
  getAgeGroupConfig,
  getGenreConfig,
  getAvailableProviders,
  getProviderModels
} from '../ai-constants';

describe('ai-constants', () => {
  describe('AI_PROVIDERS', () => {
    it('should have OpenRouter provider configuration', () => {
      expect(AI_PROVIDERS.openrouter).toBeDefined();
      expect(AI_PROVIDERS.openrouter.name).toBe('OpenRouter');
      expect(AI_PROVIDERS.openrouter.isAvailable).toBe(true);
    });

    it('should have OpenAI provider configuration', () => {
      expect(AI_PROVIDERS.openai).toBeDefined();
      expect(AI_PROVIDERS.openai.name).toBe('OpenAI');
      expect(AI_PROVIDERS.openai.isAvailable).toBe(true);
    });

    it('should have OVH provider configuration', () => {
      expect(AI_PROVIDERS.ovh).toBeDefined();
      expect(AI_PROVIDERS.ovh.name).toBe('OVH Llama');
      expect(AI_PROVIDERS.ovh.isAvailable).toBe(true);
    });
  });

  describe('AI_MODELS', () => {
    it('should have text generation models', () => {
      expect(AI_MODELS['openrouter/sonoma-dusk-alpha']).toBeDefined();
      expect(AI_MODELS['gpt-4o-mini']).toBeDefined();
      expect(AI_MODELS['Meta-Llama-3_3-70B-Instruct']).toBeDefined();
    });

    it('should have model metadata', () => {
      const model = AI_MODELS['gpt-4o-mini'];
      expect(model.name).toBe('GPT-4o Mini');
      expect(model.provider).toBe('openai');
      expect(model.capabilities).toContain('structured-output');
      expect(model.costTier).toBe('low');
    });
  });

  describe('getOperationEstimate', () => {
    it('should return estimate for story generation', () => {
      const estimate = getOperationEstimate('story-generation');
      expect(estimate.estimatedTime).toBe(15);
      expect(estimate.estimatedTokens).toBe(2000);
      expect(estimate.description).toContain('complete stories');
    });

    it('should return estimate for story seeds', () => {
      const estimate = getOperationEstimate('story-seeds');
      expect(estimate.estimatedTime).toBe(5);
      expect(estimate.estimatedTokens).toBe(500);
    });

    it('should throw error for unknown operations', () => {
      expect(() => getOperationEstimate('unknown')).toThrow('Unknown operation: unknown');
    });
  });

  describe('isOperationSupported', () => {
    it('should return true for supported story generation combinations', () => {
      expect(isOperationSupported('story-generation', '4-6', 'Fantasy')).toBe(true);
      expect(isOperationSupported('story-generation', '10-12', 'Adventure')).toBe(true);
    });

    it('should return false for unsupported combinations', () => {
      expect(isOperationSupported('story-generation', 'invalid-age', 'Fantasy')).toBe(false);
      expect(isOperationSupported('story-generation', '4-6', 'UnsupportedGenre')).toBe(false);
    });

    it('should return false for unknown operations', () => {
      expect(isOperationSupported('unknown', '4-6', 'Fantasy')).toBe(false);
    });
  });

  describe('getAgeGroupConfig', () => {
    it('should return configuration for valid age groups', () => {
      const config = getAgeGroupConfig('4-6');
      expect(config.name).toBe('Ages 4-6 (Preschool)');
      expect(config.wordLimits.min).toBe(30);
      expect(config.wordLimits.max).toBe(60);
      expect(config.vocabularyLevel).toBe('basic');
    });

    it('should return default config for invalid age groups', () => {
      const config = getAgeGroupConfig('invalid');
      expect(config.name).toBe('Ages 10-12 (Middle Elementary)');
    });
  });

  describe('getGenreConfig', () => {
    it('should return configuration for valid genres', () => {
      const config = getGenreConfig('Fantasy');
      expect(config.name).toBe('Fantasy');
      expect(config.keywords).toContain('magical');
      expect(config.themes).toContain('magic');
    });

    it('should return default config for invalid genres', () => {
      const config = getGenreConfig('invalid');
      expect(config.name).toBe('Adventure');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return providers for story generation', () => {
      const providers = getAvailableProviders('story-generation');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.every(p => p.isAvailable)).toBe(true);
      expect(providers.every(p => p.supportedOperations.includes('story-generation'))).toBe(true);
    });
  });

  describe('getProviderModels', () => {
    it('should return models for OpenAI provider', () => {
      const models = getProviderModels('openai');
      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => m.provider === 'openai')).toBe(true);
    });

    it('should return empty array for unknown provider', () => {
      const models = getProviderModels('unknown');
      expect(models).toEqual([]);
    });
  });
});