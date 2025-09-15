/**
 * Credit calculation utilities for Tale Forge
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
export const calculateTTSCredits = (text: string): { words: number; credits: number; priceBreakdown: string } => {
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