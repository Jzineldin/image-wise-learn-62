/**
 * SINGLE SOURCE OF TRUTH FOR CREDIT COSTS
 * This file is shared between frontend (React) and backend (Deno edge functions)
 * 
 * ⚠️ IMPORTANT: Any changes here affect billing across the entire platform
 */

// Credit cost configuration - aligned across frontend and backend
export const CREDIT_COSTS = {
  // Story Generation (FREE)
  story: 0,                   // Full story creation (FREE)
  segment: 0,                 // Story segments/pages (FREE)
  image: 0,                   // Image generation (FREE)
  
  // Audio Generation (PAID)
  audioPerWord: 0.01,         // $0.01 per word (100 words = 1 credit)
  audioPerChapter: 2,         // Flat rate: 2 credits per chapter (simpler billing)
  
  // Video Animation (PAID - based on duration)
  videoShort: 5,              // 2-3 seconds
  videoMedium: 8,             // 4-5 seconds
  videoLong: 12,              // 6-8 seconds
  
  // Legacy/Deprecated (kept for backwards compatibility)
  storyGeneration: 0,
  storySegment: 0,
  audioGeneration: 1,         // Per 100 words
  imageGeneration: 0,
  storyTitle: 0,
} as const;

/**
 * Calculate audio credits based on word count
 * Pricing: 1 credit per 100 words, rounded up
 */
export function calculateAudioCredits(text: string): number {
  const trimmedText = text.trim();
  if (!trimmedText) return 0;
  
  const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / 100));
}

/**
 * Calculate video credits based on duration
 */
export function calculateVideoCredits(durationSeconds: number): number {
  if (durationSeconds <= 3) return CREDIT_COSTS.videoShort;
  if (durationSeconds <= 5) return CREDIT_COSTS.videoMedium;
  return CREDIT_COSTS.videoLong;
}

/**
 * Get pricing tiers for display
 */
export function getPricingTiers() {
  return {
    audio: [
      { range: '1-100 words', credits: 1 },
      { range: '101-200 words', credits: 2 },
      { range: '201-300 words', credits: 3 },
      { range: '301-400 words', credits: 4 },
      { range: '401-500 words', credits: 5 },
    ],
    video: [
      { duration: '2-3 seconds', credits: CREDIT_COSTS.videoShort },
      { duration: '4-5 seconds', credits: CREDIT_COSTS.videoMedium },
      { duration: '6-8 seconds', credits: CREDIT_COSTS.videoLong },
    ],
  };
}

// Type exports
export type CreditOperation = keyof typeof CREDIT_COSTS;
