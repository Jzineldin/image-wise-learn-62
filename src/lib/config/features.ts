/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for safe rollout of new features.
 * Flags can be controlled via environment variables for gradual deployment.
 */

/**
 * V2 Integration Feature Flags
 *
 * These flags control the Google AI Studio V2 integration which provides:
 * - Better quality (master storyteller prompts)
 * - Lower cost (FREE audio with Gemini TTS)
 * - Simpler architecture (combined text + image generation)
 *
 * Set to 'true' in .env to enable:
 * VITE_USE_V2_GENERATION=true
 * VITE_USE_V2_AUDIO=true
 * VITE_USE_V2_VIDEO=true
 */
export const FEATURES = {
  /**
   * Use V2 story generation (Google AI Studio - Master Storyteller)
   *
   * When enabled:
   * - Uses generate-story-page-v2 endpoint
   * - Gemini 2.5 Pro with proven "master storyteller" prompts
   * - Imagen 4 for beautiful storybook-style illustrations
   * - Combined text + image generation (faster, simpler)
   *
   * Cost: 2 credits (same as old system)
   * Quality: ⭐⭐⭐⭐⭐ vs ⭐⭐⭐
   *
   * Rollback: Set VITE_USE_V2_GENERATION=false to revert to old system
   */
  USE_V2_GENERATION: import.meta.env.VITE_USE_V2_GENERATION === 'true',

  /**
   * Use V2 audio generation (Gemini TTS - FREE!)
   *
   * When enabled:
   * - Uses generate-audio-v2 endpoint
   * - Gemini TTS with natural-sounding voices
   * - Replaces expensive ElevenLabs ($11-99/month)
   *
   * Voices available: Kore, Puck, Charon, Fenrir, Zephyr
   *
   * Cost: 0 credits (FREE during preview!)
   * Quality: High, natural voices
   * Savings: $11-99/month
   *
   * Rollback: Set VITE_USE_V2_AUDIO=false to use ElevenLabs
   */
  USE_V2_AUDIO: import.meta.env.VITE_USE_V2_AUDIO === 'true',

  /**
   * Use V2 video generation (Veo 3.1)
   *
   * When enabled:
   * - Uses generate-video-v2 endpoint
   * - Veo 3.1 for cinematic animations
   * - Better quality than Freepik at lower cost
   *
   * Note: Requires Google AI Studio video API quota
   *
   * Cost: 2 credits (~$0.10 vs $0.50-2 for Freepik)
   * Quality: ⭐⭐⭐⭐⭐ cinematic
   * Savings: 80-95% per video
   *
   * Rollback: Set VITE_USE_V2_VIDEO=false to use Freepik
   */
  USE_V2_VIDEO: import.meta.env.VITE_USE_V2_VIDEO === 'true',

  /**
   * Debug logging for V2 integration
   *
   * When enabled, logs detailed information about:
   * - Which endpoint is being called (V2 vs old)
   * - Response data structure
   * - Credit usage
   * - Quality metrics
   */
  DEBUG_V2: import.meta.env.VITE_DEBUG_V2 === 'true',
} as const;

/**
 * Helper to log feature flag status on app startup
 */
export function logFeatureFlags() {
  if (FEATURES.DEBUG_V2 || import.meta.env.DEV) {
    console.log('🚩 Feature Flags Status:');
    console.log('  V2 Generation:', FEATURES.USE_V2_GENERATION ? '✅ Enabled' : '❌ Disabled');
    console.log('  V2 Audio (FREE):', FEATURES.USE_V2_AUDIO ? '✅ Enabled' : '❌ Disabled');
    console.log('  V2 Video (Veo 3.1):', FEATURES.USE_V2_VIDEO ? '✅ Enabled' : '❌ Disabled');
    console.log('  Debug Logging:', FEATURES.DEBUG_V2 ? '✅ Enabled' : '❌ Disabled');
  }
}

/**
 * Get a human-readable summary of active V2 features
 */
export function getV2FeaturesSummary(): string {
  const enabled = [];

  if (FEATURES.USE_V2_GENERATION) enabled.push('Master Storyteller Prompts');
  if (FEATURES.USE_V2_AUDIO) enabled.push('FREE Audio (Gemini TTS)');
  if (FEATURES.USE_V2_VIDEO) enabled.push('Cinematic Video (Veo 3.1)');

  if (enabled.length === 0) {
    return 'Using legacy AI system';
  }

  return `V2 Active: ${enabled.join(', ')}`;
}
