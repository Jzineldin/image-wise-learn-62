import { describe, it, expect } from 'vitest';
import { 
  calculateTTSCredits, 
  formatTTSCreditDisplay, 
  getTTSPricingTiers,
  estimateTTSDuration,
  calculateStoryCredits,
  getRecommendedVoices
} from '../credit-api';

describe('credit-api', () => {
  describe('calculateTTSCredits', () => {
    it('should calculate 1 credit for 1-100 words', () => {
      const result = calculateTTSCredits('Hello world');
      expect(result.words).toBe(2);
      expect(result.credits).toBe(1);
      expect(result.priceBreakdown).toBe('2 words = 1 credit');
    });

    it('should calculate 1 credit for exactly 100 words', () => {
      const text = Array(100).fill('word').join(' ');
      const result = calculateTTSCredits(text);
      expect(result.words).toBe(100);
      expect(result.credits).toBe(1);
      expect(result.priceBreakdown).toBe('100 words (1 × 100) = 1 credit');
    });

    it('should calculate 2 credits for 101 words', () => {
      const text = Array(101).fill('word').join(' ');
      const result = calculateTTSCredits(text);
      expect(result.words).toBe(101);
      expect(result.credits).toBe(2);
      expect(result.priceBreakdown).toBe('101 words (1 × 100 + 1) = 2 credits');
    });

    it('should calculate 3 credits for 250 words', () => {
      const text = Array(250).fill('word').join(' ');
      const result = calculateTTSCredits(text);
      expect(result.words).toBe(250);
      expect(result.credits).toBe(3);
      expect(result.priceBreakdown).toBe('250 words (2 × 100 + 50) = 3 credits');
    });

    it('should handle empty text', () => {
      const result = calculateTTSCredits('');
      expect(result.words).toBe(0);
      expect(result.credits).toBe(1); // Minimum 1 credit
    });

    it('should handle text with extra whitespace', () => {
      const result = calculateTTSCredits('  hello   world  ');
      expect(result.words).toBe(2);
      expect(result.credits).toBe(1);
    });

    it('should filter out empty words', () => {
      const result = calculateTTSCredits('hello  world');
      expect(result.words).toBe(2);
      expect(result.credits).toBe(1);
    });
  });

  describe('formatTTSCreditDisplay', () => {
    it('should return formatted credit display', () => {
      const display = formatTTSCreditDisplay('Hello world test');
      expect(display).toBe('3 words = 1 credit');
    });

    it('should handle longer text', () => {
      const text = Array(150).fill('word').join(' ');
      const display = formatTTSCreditDisplay(text);
      expect(display).toBe('150 words (1 × 100 + 50) = 2 credits');
    });
  });

  describe('getTTSPricingTiers', () => {
    it('should return correct pricing tiers', () => {
      const tiers = getTTSPricingTiers();
      expect(tiers).toEqual([
        { range: '1-100 words', credits: 1 },
        { range: '101-200 words', credits: 2 },
        { range: '201-300 words', credits: 3 },
        { range: '301-400 words', credits: 4 },
        { range: '401-500 words', credits: 5 },
        { range: '500+ words', credits: '1 per 100 words' }
      ]);
    });
  });

  describe('estimateTTSDuration', () => {
    it('should estimate duration in seconds for short text', () => {
      const duration = estimateTTSDuration(50); // 50 words
      expect(duration).toBe('~20 seconds');
    });

    it('should estimate duration in minutes for longer text', () => {
      const duration = estimateTTSDuration(300); // 300 words
      expect(duration).toBe('~2.0 minutes');
    });

    it('should handle 150 words exactly (1 minute)', () => {
      const duration = estimateTTSDuration(150);
      expect(duration).toBe('~1.0 minutes');
    });
  });

  describe('calculateStoryCredits', () => {
    it('should return correct credits for story operations', () => {
      expect(calculateStoryCredits('story')).toBe(2);
      expect(calculateStoryCredits('segment')).toBe(1);
      expect(calculateStoryCredits('image')).toBe(1);
      expect(calculateStoryCredits('audio')).toBe(1);
    });

    it('should return 1 credit for unknown operations', () => {
      expect(calculateStoryCredits('unknown' as any)).toBe(1);
    });
  });

  describe('getRecommendedVoices', () => {
    it('should return English voices for English language', () => {
      const voices = getRecommendedVoices('en');
      expect(voices).toEqual(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);
    });

    it('should return Swedish-optimized voices for Swedish language', () => {
      const voices = getRecommendedVoices('sv');
      expect(voices).toEqual(['alloy', 'nova']);
    });

    it('should fallback to English voices for unsupported languages', () => {
      const voices = getRecommendedVoices('fr');
      expect(voices).toEqual(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);
    });
  });
});