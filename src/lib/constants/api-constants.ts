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

// DEPRECATED: Use shared/credit-costs.ts instead
// This is kept for backwards compatibility only
import { CREDIT_COSTS as SHARED_COSTS } from '../../../shared/credit-costs';

export const CREDIT_COSTS = SHARED_COSTS;

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