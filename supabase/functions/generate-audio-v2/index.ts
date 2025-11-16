/**
 * Generate Audio V2 - Gemini TTS Edition with Word-Based Pricing
 *
 * Uses Gemini TTS for high-quality narration
 * Pricing: 1 credit per 100 words (minimum 1 credit)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { GoogleAIUnifiedService } from '../_shared/google-ai-unified-service.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { CreditService } from '../_shared/credit-system.ts';
import { calculateAudioCredits } from '../_shared/credit-costs.ts';

interface GenerateAudioRequest {
  text: string;
  voiceId?: string; // Gemini voice: Kore, Charon, Fenrir, etc.
  segment_id?: string; // Optional: segment to update with audio URL
  story_id?: string; // Optional: story to update
}

/**
 * Creates a WAV file header for raw PCM audio data
 * Gemini TTS returns linear16 PCM at 24kHz, 1 channel (mono)
 */
function createWavHeader(pcmData: Uint8Array): Uint8Array {
  const sampleRate = 24000; // Gemini TTS default sample rate
  const numChannels = 1; // Mono
  const bitsPerSample = 16; // linear16 = 16-bit PCM

  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmData.length;
  const fileSize = 44 + dataSize; // 44 bytes for WAV header + PCM data

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, fileSize - 8, true); // File size - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Subchunk2Size

  return new Uint8Array(header);
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

    // Parse request
    logger.info('Parsing request body', { requestId });
    const body: GenerateAudioRequest = await req.json();
    logger.info('Request body parsed', { requestId, hasText: !!body.text, voiceId: body.voiceId });

    const { text, voiceId = 'Kore', segment_id, story_id } = body;

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for audio generation');
    }

    // Calculate credits based on word count (1 credit per 100 words, minimum 1)
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const creditsRequired = calculateAudioCredits(text);

    logger.info('Audio generation V2 started (Gemini TTS)', {
      requestId,
      userId,
      voiceId,
      textLength: text.length,
      wordCount,
      creditsRequired,
      pricing: '1 credit per 100 words (minimum 1)'
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
          message: `Insufficient credits. Required: ${creditsRequired} credits (${wordCount} words), Available: ${currentCredits}`
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

    // Upload audio to Supabase Storage for persistence
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to Uint8Array - this is raw PCM data from Gemini TTS
    const pcmData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));

    // Gemini TTS returns raw PCM audio (linear16) WITHOUT WAV headers
    // We need to construct a proper WAV file before saving to storage
    const wavHeader = createWavHeader(pcmData);
    const audioBuffer = new Uint8Array(wavHeader.length + pcmData.length);
    audioBuffer.set(wavHeader, 0);
    audioBuffer.set(pcmData, wavHeader.length);

    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
    const filePath = `${userId}/${fileName}`;

    logger.info('Constructed WAV file from raw PCM', {
      requestId,
      pcmSize: pcmData.length,
      wavHeaderSize: wavHeader.length,
      totalSize: audioBuffer.length
    });

    logger.info('Uploading audio to storage', {
      requestId,
      userId,
      filePath,
      audioSize: audioBuffer.length
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-audio')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/wav',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Storage upload failed', uploadError, {
        requestId,
        filePath,
        errorCode: uploadError.statusCode,
        errorMessage: uploadError.message,
        errorDetails: JSON.stringify(uploadError)
      });
      throw new Error(`Failed to upload audio file to storage: ${uploadError.message} (${uploadError.statusCode || 'unknown code'})`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('story-audio')
      .getPublicUrl(filePath);

    const audioUrl = urlData.publicUrl;

    logger.info('Audio uploaded successfully', {
      requestId,
      audioUrl,
      uploadPath: uploadData.path
    });

    // Update story segment if segment_id provided
    if (segment_id) {
      const { error: updateError } = await supabase
        .from('story_segments')
        .update({
          audio_url: audioUrl,
          voice_status: 'ready',
        })
        .eq('id', segment_id);

      if (updateError) {
        logger.error('Error updating segment with audio URL', updateError, {
          requestId,
          segmentId: segment_id
        });
      } else {
        logger.info('Segment updated with audio URL', {
          requestId,
          segmentId: segment_id,
          audioUrl
        });
      }
    }

    // Update story if story_id provided
    if (story_id) {
      const { error: storyUpdateError } = await supabase
        .from('stories')
        .update({
          full_story_audio_url: audioUrl,
        })
        .eq('id', story_id);

      if (storyUpdateError) {
        logger.error('Error updating story with audio URL', storyUpdateError, {
          requestId,
          storyId: story_id
        });
      }
    }

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
      audio_url: audioUrl,  // Permanent storage URL
      audioUrl: audioUrl, // Support both formats
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
