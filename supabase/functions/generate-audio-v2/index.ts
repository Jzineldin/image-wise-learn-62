/**
 * Generate Audio V2 - Gemini TTS Edition with Word-Based Pricing
 *
 * Uses Gemini TTS for high-quality narration
 * Pricing: 1 credit per 100 words (rounded up)
 */

import { GoogleAIUnifiedService } from '../_shared/google-ai-unified-service.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { CreditService } from '../_shared/credit-system.ts';
import { calculateAudioCredits } from '../_shared/credit-costs.ts';

interface GenerateAudioRequest {
  text: string;
  voiceId?: string; // Gemini voice: Kore, Charon, Fenrir, etc.
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.unauthorized('Missing authorization header');
    }

    // Initialize credit service
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseServiceKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    logger.info('User authenticated', { userId, requestId });

    // Check if user has paid subscription (TTS requires subscription)
    const { data: userProfile, error: profileError } = await creditService.supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      logger.error('Failed to fetch user profile', { userId, error: profileError });
      throw new Error('Failed to verify subscription status');
    }

    const isPaidUser = userProfile.subscription_tier !== 'free';

    if (!isPaidUser) {
      logger.warn('Free user attempted to use TTS', { userId, requestId });
      return ResponseHandler.error(
        'TTS_REQUIRES_SUBSCRIPTION',
        403, // Forbidden
        {
          error: 'feature_locked',
          message: 'Text-to-Speech (TTS) narration is only available for paid subscribers. Upgrade to unlock!',
          feature: 'tts',
          upgradeUrl: '/pricing'
        }
      );
    }

    logger.info('Subscription check passed for TTS', { userId, tier: userProfile.subscription_tier });

    // Parse request
    logger.info('Parsing request body', { requestId });
    const body: GenerateAudioRequest = await req.json();
    logger.info('Request body parsed', { requestId, hasText: !!body.text, voiceId: body.voiceId });

    const { text, voiceId = 'Kore' } = body;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    // Calculate credits based on word count (1 credit per 100 words)
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const creditsRequired = calculateAudioCredits(text);

    logger.info('Audio generation V2 started (Gemini TTS)', {
      requestId,
      userId,
      voiceId,
      textLength: text.length,
      wordCount,
      creditsRequired,
      pricing: '1 credit per 100 words (rounded up)'
    });

    // Validate credits BEFORE generating
    const { hasCredits, currentCredits } = await creditService.checkUserCredits(userId, creditsRequired);
    if (!hasCredits) {
      logger.error('Insufficient credits for audio generation V2', {
        userId,
        wordCount,
        creditsRequired,
        currentCredits,
        requestId
      });
      return ResponseHandler.error(
        'INSUFFICIENT_CREDITS',
        402,
        {
          required: creditsRequired,
          available: currentCredits,
          message: `Insufficient credits. Required: ${creditsRequired} credits for ${wordCount} words, Available: ${currentCredits}`
        }
      );
    }

    logger.info('Credits validated for audio generation V2', {
      userId,
      wordCount,
      creditsRequired,
      currentCredits,
      requestId
    });

    // Initialize Google AI Studio
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google AI Studio API key not configured');
    }

    const googleAI = new GoogleAIUnifiedService(googleApiKey);

    // Generate narration (FREE with Gemini TTS!)
    const audioBase64 = await googleAI.generateNarration(text, voiceId);

    if (!audioBase64 || audioBase64.length === 0) {
      throw new Error('No audio data generated from Gemini TTS');
    }

    // Convert base64 to data URL for browser audio playback
    const audioDataUrl = `data:audio/wav;base64,${audioBase64}`;

    // Deduct credits AFTER successful generation (word-based: 1 credit per 100 words)
    const creditResult = await creditService.deductCredits(
      userId,
      creditsRequired,
      'Audio generation (Gemini TTS - word-based)',
      requestId,
      'audio_generation',
      {
        requestId,
        wordCount,
        voiceId,
        creditsCalculation: `${wordCount} words = ${creditsRequired} credits (1 per 100 words)`
      }
    );

    logger.info('Audio generated successfully with Gemini TTS (word-based pricing)', {
      requestId,
      userId,
      wordCount,
      creditsUsed: creditsRequired,
      newBalance: creditResult.newBalance,
      audioLength: audioBase64.length,
      pricing: `${wordCount} words = ${creditsRequired} credits`
    });

    return ResponseHandler.success({
      success: true,
      audio_url: audioDataUrl,  // Frontend expects audio_url
      audioBase64, // Also return base64 for compatibility
      mimeType: 'audio/wav',
      credits_used: creditsRequired,
      credits_remaining: creditResult.newBalance,
      word_count: wordCount,
      pricing_info: `${wordCount} words = ${creditsRequired} credits (1 per 100 words)`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Audio generation V2 failed', {
      error: errorMessage,
      errorType: error?.constructor?.name,
      stack: errorStack,
      requestId
    });

    return ResponseHandler.error(
      errorMessage || 'Failed to generate audio',
      500,
      { requestId, errorType: error?.constructor?.name }
    );
  }
});
