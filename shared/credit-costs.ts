/**
 * SINGLE SOURCE OF TRUTH FOR CREDIT COSTS
 * This file is shared between frontend (React) and backend (Deno edge functions)
 *
 * ⚠️ IMPORTANT: Any changes here affect billing across the entire platform
 *
 * UNIFIED CREDITS MODEL (2025-11-16):
 * - Chapters = daily quota for text/image generation (4/day free, unlimited paid)
 * - Credits = universal currency for compute-intensive features
 * - Free users: 100 signup credits + 10/day
 * - Subscribers: unlimited chapters + 500 credits/month
 */

// Credit cost configuration - aligned across frontend and backend
export const CREDIT_COSTS = {
  // Story Generation (FREE - uses chapters, not credits)
  story: 0,                   // Full story creation (FREE)
  segment: 0,                 // Story segments/pages (FREE)
  image: 0,                   // Image generation (FREE)

  // TTS (PAID - 2 credits per second)
  ttsPerSecond: 2,            // 2 credits/second of audio
  audioPerWord: 0.01,         // Deprecated: use ttsPerSecond instead
  audioPerChapter: 2,         // Deprecated: use calculateTTSCredits() instead

  // Animate Scene (PAID - 15 credits per scene)
  animateScene: 15,           // 15 credits per animated scene (3-5 seconds)

  // Video Animation (PAID - 30 credits for 30sec video)
  video30sec: 30,             // 30 credits for 30-second video
  videoShort: 5,              // Deprecated: 2-3 seconds
  videoMedium: 8,             // Deprecated: 4-5 seconds
  videoLong: 12,              // Deprecated: 6-8 seconds

  // Legacy/Deprecated (kept for backwards compatibility)
  storyGeneration: 0,
  storySegment: 0,
  audioGeneration: 1,         // Per 100 words
  imageGeneration: 0,
  storyTitle: 0,
} as const;

/**
 * Estimate TTS duration from text
 * Average speech rate: 150 words per minute = 2.5 words per second
 */
export function estimateTTSDuration(text: string): number {
  const trimmedText = text.trim();
  if (!trimmedText) return 0;

  const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
  const WORDS_PER_SECOND = 2.5; // Average speech rate
  return Math.ceil(wordCount / WORDS_PER_SECOND);
}

/**
 * Calculate TTS credits based on estimated duration
 * New pricing model: 2 credits per second
 */
export function calculateTTSCredits(text: string): number {
  const durationSeconds = estimateTTSDuration(text);
  return durationSeconds * CREDIT_COSTS.ttsPerSecond;
}

/**
 * Calculate TTS credits from known duration
 */
export function calculateTTSCreditsFromDuration(durationSeconds: number): number {
  return Math.ceil(durationSeconds) * CREDIT_COSTS.ttsPerSecond;
}

/**
 * DEPRECATED: Calculate audio credits based on word count
 * Use calculateTTSCredits() instead
 * Pricing: 1 credit per 100 words, rounded up
 */
export function calculateAudioCredits(text: string): number {
  const trimmedText = text.trim();
  if (!trimmedText) return 0;

  const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / 100));
}

/**
 * Calculate Animate Scene credits (fixed cost)
 */
export function calculateAnimateCredits(): number {
  return CREDIT_COSTS.animateScene;
}

/**
 * Calculate video credits (fixed 30-second duration)
 */
export function calculateVideoCredits(): number {
  return CREDIT_COSTS.video30sec;
}

/**
 * DEPRECATED: Calculate video credits based on duration
 * Use calculateVideoCredits() instead (now fixed cost)
 */
export function calculateVideoCreditsLegacy(durationSeconds: number): number {
  if (durationSeconds <= 3) return CREDIT_COSTS.videoShort;
  if (durationSeconds <= 5) return CREDIT_COSTS.videoMedium;
  return CREDIT_COSTS.videoLong;
}

/**
 * Get pricing tiers for display
 */
export function getPricingTiers() {
  return {
    tts: [
      { duration: '5 seconds', credits: 10 },
      { duration: '10 seconds', credits: 20 },
      { duration: '30 seconds', credits: 60 },
      { duration: '1 minute', credits: 120 },
      { note: '2 credits per second' }
    ],
    animate: [
      { description: 'Per scene (3-5 sec)', credits: CREDIT_COSTS.animateScene }
    ],
    video: [
      { duration: '30 seconds', credits: CREDIT_COSTS.video30sec }
    ],
    // Legacy tiers (deprecated)
    audio: [
      { range: '1-100 words', credits: 1 },
      { range: '101-200 words', credits: 2 },
      { range: '201-300 words', credits: 3 },
      { range: '301-400 words', credits: 4 },
      { range: '401-500 words', credits: 5 },
    ],
  };
}

// Type exports
export type CreditOperation = keyof typeof CREDIT_COSTS;
