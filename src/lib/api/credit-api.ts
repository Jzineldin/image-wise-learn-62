/**
 * Credit API utilities - consolidated from creditCalculations.ts
 * Handles all credit-related calculations and operations
 */

/**
 * Calculate credits for TTS generation based on word count
 * Pricing model: 1 credit per 100 words (rounded up)
 *
 * Examples:
 * - 1-100 words = 1 credit
 * - 101-200 words = 2 credits
 * - 199 words = 2 credits (rounds up to next 100)
 * - 201 words = 3 credits
 *
 * This ensures fairness for both users and platform:
 * - Users know exactly what they'll pay
 * - Platform maintains profitability
 * - Simple, transparent pricing
 */
export const calculateTTSCredits = (text: string | null | undefined): { words: number; credits: number; priceBreakdown: string } => {
  // Handle null/undefined content gracefully
  if (!text || typeof text !== 'string') {
    return {
      words: 0,
      credits: 0,
      priceBreakdown: 'No content to process'
    };
  }

  // Remove extra whitespace and split by spaces
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // Calculate credits: 1 credit per 100 words, rounded up
  const credits = Math.ceil(wordCount / 100);

  // Create a user-friendly price breakdown
  let priceBreakdown = '';
  if (wordCount <= 100) {
    priceBreakdown = `${wordCount} words = 1 credit`;
  } else {
    const blocks = Math.floor(wordCount / 100);
    const remainder = wordCount % 100;
    if (remainder === 0) {
      priceBreakdown = `${wordCount} words (${blocks} × 100) = ${credits} credits`;
    } else {
      priceBreakdown = `${wordCount} words (${blocks} × 100 + ${remainder}) = ${credits} credits`;
    }
  }

  return {
    words: wordCount,
    credits: Math.max(1, credits), // Minimum 1 credit
    priceBreakdown
  };
};

/**
 * Format credit cost display with breakdown
 */
export const formatTTSCreditDisplay = (text: string): string => {
  const { words, credits, priceBreakdown } = calculateTTSCredits(text);
  return priceBreakdown;
};

/**
 * Get TTS pricing tiers for display
 */
export const getTTSPricingTiers = () => [
  { range: '1-100 words', credits: 1 },
  { range: '101-200 words', credits: 2 },
  { range: '201-300 words', credits: 3 },
  { range: '301-400 words', credits: 4 },
  { range: '401-500 words', credits: 5 },
  { range: '500+ words', credits: '1 per 100 words' }
];

/**
 * Estimate TTS duration based on word count
 * Average speech rate: 150 words per minute
 */
export const estimateTTSDuration = (wordCount: number): string => {
  const minutes = wordCount / 150;
  if (minutes < 1) {
    return `~${Math.round(minutes * 60)} seconds`;
  }
  return `~${minutes.toFixed(1)} minutes`;
};

/**
 * Calculate credits for story generation operations
 */
export const calculateStoryCredits = (operation: 'story' | 'segment' | 'image' | 'audio', options?: any): number => {
  const creditCosts = {
    story: 2,      // Full story generation
    segment: 1,    // Single segment
    image: 1,      // Image generation
    audio: 1       // Base audio cost (actual cost calculated by word count)
  };

  return creditCosts[operation] || 1;
};

/**
 * Get voice recommendations for different languages
 */
export const getRecommendedVoices = (languageCode: string): string[] => {
  const voiceMapping: { [key: string]: string[] } = {
    'en': ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    'sv': ['alloy', 'nova'], // Swedish works better with these voices
    // Add more language-specific mappings as needed
  };

  return voiceMapping[languageCode] || voiceMapping['en'];
};