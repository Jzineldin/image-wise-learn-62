/**
 * Generate Audio V2 - Gemini TTS Edition
 *
 * Uses Gemini TTS (FREE!) instead of ElevenLabs
 * Based on the working copy-of-tale-forge app
 */

import { GoogleAIUnifiedService } from '../_shared/google-ai-unified-service.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';

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
    // Parse request
    logger.info('Parsing request body', { requestId });
    const body: GenerateAudioRequest = await req.json();
    logger.info('Request body parsed', { requestId, hasText: !!body.text, voiceId: body.voiceId });

    const { text, voiceId = 'Kore' } = body;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    logger.info('Audio generation V2 started (Gemini TTS)', { requestId, voiceId, textLength: text.length });

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

    logger.info('Audio generated successfully with Gemini TTS', {
      requestId,
      audioLength: audioBase64.length,
      hasDataUrl: !!audioDataUrl
    });

    return ResponseHandler.success({
      success: true,
      audio_url: audioDataUrl,  // Frontend expects audio_url
      audioBase64, // Also return base64 for compatibility
      mimeType: 'audio/wav',
      credits_used: 0 // FREE!
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
