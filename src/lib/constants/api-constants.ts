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
  story: 2,
  segment: 1, 
  image: 1,
  audioBase: 1, // Plus word-based calculation
};

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