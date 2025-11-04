/**
 * Feature Flags System
 *
 * Allows safe A/B testing of new features without affecting production
 *
 * Usage:
 * - Set environment variables to enable/disable features
 * - Use flags in code to conditionally enable functionality
 * - Test locally with flags enabled, production with flags disabled
 */

export interface FeatureFlags {
  // Enhanced prompt system with "master storyteller" persona
  USE_ENHANCED_PROMPTS: boolean;

  // Google AI Studio SDK integration (Gemini 2.5 Pro, Imagen 4, Veo)
  USE_GOOGLE_AI_STUDIO: boolean;

  // Personalized storytelling with child's name
  USE_PERSONALIZED_STORYTELLING: boolean;

  // Enhanced image prompts with style analogies
  USE_ENHANCED_IMAGE_PROMPTS: boolean;

  // Video generation with Veo
  USE_VEO_VIDEO_GENERATION: boolean;

  // Gemini TTS for audio narration
  USE_GEMINI_TTS: boolean;
}

/**
 * Load feature flags from environment variables
 *
 * TEMPORARY: Hardcoded to true for local testing
 * TODO: Remove hardcoding before production deployment
 */
export const FEATURE_FLAGS: FeatureFlags = {
  // Hardcoded for local testing - enhanced prompts enabled
  USE_ENHANCED_PROMPTS: Deno.env.get('FEATURE_ENHANCED_PROMPTS') === 'true' || true, // TEMP: Always true for testing
  USE_GOOGLE_AI_STUDIO: Deno.env.get('FEATURE_GOOGLE_AI_STUDIO') === 'true',
  USE_PERSONALIZED_STORYTELLING: Deno.env.get('FEATURE_PERSONALIZED') === 'true' || true, // TEMP: Always true
  USE_ENHANCED_IMAGE_PROMPTS: Deno.env.get('FEATURE_ENHANCED_IMAGE_PROMPTS') === 'true' || true, // TEMP: Always true
  USE_VEO_VIDEO_GENERATION: Deno.env.get('FEATURE_VEO_VIDEO') === 'true',
  USE_GEMINI_TTS: Deno.env.get('FEATURE_GEMINI_TTS') === 'true',
};

/**
 * Helper to log which features are enabled
 */
export function logFeatureFlags(): void {
  console.log('🚩 Feature Flags:', {
    enhancedPrompts: FEATURE_FLAGS.USE_ENHANCED_PROMPTS,
    googleAIStudio: FEATURE_FLAGS.USE_GOOGLE_AI_STUDIO,
    personalized: FEATURE_FLAGS.USE_PERSONALIZED_STORYTELLING,
    enhancedImages: FEATURE_FLAGS.USE_ENHANCED_IMAGE_PROMPTS,
    veoVideo: FEATURE_FLAGS.USE_VEO_VIDEO_GENERATION,
    geminiTTS: FEATURE_FLAGS.USE_GEMINI_TTS,
  });
}

/**
 * Check if enhanced prompt system should be used
 */
export function shouldUseEnhancedPrompts(): boolean {
  return FEATURE_FLAGS.USE_ENHANCED_PROMPTS;
}

/**
 * Check if enhanced image prompts should be used
 */
export function shouldUseEnhancedImagePrompts(): boolean {
  return FEATURE_FLAGS.USE_ENHANCED_IMAGE_PROMPTS;
}

/**
 * Check if personalization should be enabled
 */
export function shouldUsePersonalization(): boolean {
  return FEATURE_FLAGS.USE_PERSONALIZED_STORYTELLING;
}
