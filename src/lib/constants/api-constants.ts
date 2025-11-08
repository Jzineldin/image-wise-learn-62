/**
 * API and service-related constants
 */

export const API_TIMEOUTS = {
  default: 30000,
  story: 45000,
  image: 60000,
  audio: 90000,
};

export const RETRY_ATTEMPTS = {
  default: 1,
  critical: 2,
  image: 2,
};

export const CREDIT_COSTS = {
  // Story creation - FREE for Starter tier and above
  story: 0,           // Unlimited story creation
  segment: 0,         // Unlimited pages/chapters
  image: 0,           // Unlimited image generation

  // Enhancements - PAID (credits required)
  audioPerChapter: 2, // Flat rate per chapter (simpler than word-based)

  // Video animation costs (based on duration)
  videoShort: 5,      // 2-3 seconds
  videoMedium: 8,     // 4-5 seconds
  videoLong: 12,      // 6-8 seconds
};

// Legacy TTS pricing (kept for backwards compatibility)
export const TTS_PRICING = {
  wordsPerCredit: 100,
  minCredits: 1,
  maxWordsPerGeneration: 5000,
};

export const VOICE_IDS = {
  default: '9BWtsMINqrJLrRacOk9x', // Aria
  children: ['alloy', 'nova', 'shimmer'],
  multilingual: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
};

export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg'];
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];