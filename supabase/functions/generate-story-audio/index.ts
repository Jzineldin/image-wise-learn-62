import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, calculateAudioCredits, validateCredits, deductCreditsAfterSuccess } from '../_shared/credit-system.ts';
import { ResponseHandler, ERROR_CODES } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';

// Helper function to get current credits
const getCurrentCredits = async (creditService: any, userId: string): Promise<number> => {
  try {
    const { currentCredits } = await creditService.checkUserCredits(userId, 0);
    return currentCredits;
  } catch (error) {
    logger.error('Error getting current credits', error, { userId, operation: 'get-credits' });
    return 0;
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioRequest {
  text: string;
  voice_id?: string;
  voiceId?: string; // Support both formats
  story_id?: string;
  segment_id?: string;
  languageCode?: string;
  modelId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Define these outside try block so they're accessible in catch
  let supabaseUrl: string | undefined;
  let supabaseKey: string | undefined;
  let segment_id: string | undefined;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401, { endpoint: 'generate-story-audio' });
    }

    // Initialize services
    supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    const requestId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Processing audio generation', { requestId, userId, operation: 'audio-generation' });

    // Parse request body
    const requestBody: AudioRequest = await req.json();
    const { text, voice_id = '21m00Tcm4TlvDq8ikWAM', story_id, voiceId, languageCode, modelId } = requestBody;
    segment_id = requestBody.segment_id;

    if (!text) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.VALIDATION_ERROR,
        'Text is required for audio generation',
        { field: 'text' }
      );
    }

    // Map request parameters for backwards compatibility
    const finalVoiceId = voiceId || voice_id;
    const finalModelId = modelId || 'eleven_monolingual_v1';

    // Initialize Supabase client for checking existing audio
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if segment already has audio (idempotency)
    if (segment_id) {
      const { data: existingSegment, error: segmentError } = await supabase
        .from('story_segments')
        .select('audio_url, voice_status')
        .eq('id', segment_id)
        .single();

      if (!segmentError && existingSegment?.audio_url) {
        logger.info('Audio already exists, returning cached URL', { 
          requestId, 
          segmentId: segment_id, 
          operation: 'audio-cache-hit' 
        });
        return new Response(
          JSON.stringify({
            success: true,
            audio_url: existingSegment.audio_url,
            audioUrl: existingSegment.audio_url, // Support both formats
            credits_used: 0,
            credits_remaining: await getCurrentCredits(creditService, userId),
            word_count: text.trim().split(/\s+/).length,
            from_cache: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Mark as in progress to prevent concurrent requests
      if (existingSegment?.voice_status !== 'processing') {
        await supabase
          .from('story_segments')
          .update({ voice_status: 'processing' })
          .eq('id', segment_id);
      }
    }

    // Calculate credits based on word count (1 credit per 100 words)
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const creditsRequired = calculateAudioCredits(text);
    
    logger.info('Audio generation credit calculation', { 
      requestId, 
      userId,
      wordCount,
      creditsRequired,
      formula: '1 credit per 100 words (rounded up)',
      operation: 'audio-credit-calculation' 
    });

    // Validate credits before processing (don't deduct yet)
    const { hasCredits, currentCredits } = await creditService.checkUserCredits(userId, creditsRequired);

    if (!hasCredits) {
      logger.error('Insufficient credits for audio generation', {
        requestId,
        userId,
        wordCount,
        creditsRequired,
        currentCredits,
        operation: 'audio-insufficient-credits'
      });
      throw new Error(`Insufficient credits. Required: ${creditsRequired} credits for ${wordCount} words, Available: ${currentCredits}`);
    }

    logger.info('Credits validated for audio generation', { 
      requestId, 
      userId,
      wordCount,
      creditsRequired, 
      currentCredits, 
      operation: 'audio-credit-check' 
    });

    // Generate audio using ElevenLabs
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: finalModelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFile = new Uint8Array(audioBuffer);

    // Upload to Supabase Storage
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-audio')
      .upload(filePath, audioFile, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Storage upload failed', uploadError, { requestId, filePath, operation: 'storage-upload' });
      // Mark segment as failed
      if (segment_id) {
        await supabase
          .from('story_segments')
          .update({ voice_status: 'failed' })
          .eq('id', segment_id);
      }
      throw new Error('Failed to upload audio file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('story-audio')
      .getPublicUrl(filePath);

    const audioUrl = urlData.publicUrl;

    // Deduct credits AFTER successful generation (word-based: 1 credit per 100 words)
    const validation = await validateCredits(creditService, userId, 'audioGeneration', { text });
    const creditResult = await deductCreditsAfterSuccess(
      creditService,
      userId,
      'audioGeneration',
      validation.creditsRequired,
      segment_id, // idempotent ref: segment
      { 
        audioUrl,
        wordCount,
        creditsCalculation: `${wordCount} words = ${validation.creditsRequired} credits (1 per 100 words)`
      }
    );
    logger.info('Credits deducted after successful audio generation (word-based)', { 
      requestId, 
      wordCount,
      creditsUsed: validation.creditsRequired,
      calculation: `${wordCount} words = ${validation.creditsRequired} credits`,
      newBalance: creditResult.newBalance, 
      operation: 'credit-deduction' 
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
        logger.error('Error updating segment with audio URL', updateError, { requestId, segmentId: segment_id });
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
        logger.error('Error updating story with audio URL', storyUpdateError, { requestId, storyId: story_id });
      }
    }

    logger.info('Audio generated successfully with word-based pricing', { 
      requestId, 
      audioUrl,
      wordCount,
      creditsUsed: validation.creditsRequired,
      pricing: `${wordCount} words = ${validation.creditsRequired} credits`,
      operation: 'audio-generation-success' 
    });

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: audioUrl,
        audioUrl: audioUrl, // Support both formats for frontend compatibility
        credits_used: validation.creditsRequired,
        credits_remaining: creditResult.newBalance,
        word_count: wordCount,
        pricing_info: `${wordCount} words = ${validation.creditsRequired} credits (1 per 100 words)`,
        from_cache: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    logger.error('Audio generation failed', error, { segmentId: segment_id, operation: 'audio-generation' });

    // Mark segment as failed if segment_id provided and we have credentials
    if (segment_id && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('story_segments')
          .update({ voice_status: 'failed' })
          .eq('id', segment_id);
      } catch (updateError) {
        logger.error('Failed to update segment status to failed', updateError, { segmentId: segment_id });
      }
    }

    // Handle insufficient credits error
    if ((error as any)?.message?.includes('Insufficient credits')) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INSUFFICIENT_CREDITS,
        'Insufficient credits',
        { original: (error as any).message }
      );
    }

    return ResponseHandler.handleError(error, { endpoint: 'generate-story-audio' });

  }
});