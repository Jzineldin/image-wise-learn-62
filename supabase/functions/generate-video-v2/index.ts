/**
 * Generate Video V2 - Veo 3.1 Edition
 *
 * Uses Veo 3.1 for high-quality video animation
 * Based on the working copy-of-tale-forge app
 */

import { GoogleAIUnifiedService } from '../_shared/google-ai-unified-service.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

interface GenerateVideoRequest {
  segment_id: string;
  imageUrl?: string;
  imageBase64?: string;
  prompt: string;
  includeNarration?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // ULTRA EXPLICIT LOGGING - Using console.log to bypass any logger issues
  console.log('=== VIDEO V2 FUNCTION ENTRY POINT ===', { requestId });

  try {
    console.log('=== INSIDE TRY BLOCK ===', { requestId });

    // Log request details BEFORE parsing
    const contentType = req.headers.get('content-type');
    const contentLength = req.headers.get('content-length');

    console.log('=== ABOUT TO LOG WITH LOGGER ===', { requestId });
    logger.info('Video generation V2 started (Veo 3.1)', {
      requestId,
      contentType,
      contentLength
    });
    console.log('=== LOGGER WORKED ===', { requestId });

    // Parse request - use text first, then parse manually to avoid req.json() issues
    let body: GenerateVideoRequest;
    try {
      const bodyText = await req.text();
      logger.info('Request body received', { bodyLength: bodyText.length });
      body = JSON.parse(bodyText);
      logger.info('Request body parsed successfully');
    } catch (jsonError) {
      logger.error('Failed to parse request JSON', { error: String(jsonError) });
      throw new Error(`Invalid request format: ${jsonError}`);
    }

    const { segment_id, imageUrl, imageBase64, prompt, includeNarration = false } = body;

    // Skip credit validation for now (like audio V2)
    // TODO: Add credit validation when user auth is properly set up
    logger.info('Skipping credit validation for V2', { operation: 'video-generation' });

    // Get image as base64
    let imgBase64 = imageBase64;
    if (!imgBase64 && imageUrl) {
      logger.info('Fetching image from URL', { imageUrl });

      // Fetch image from URL and convert to base64
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} - ${imageResponse.statusText}`);
      }

      const imageBlob = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(imageBlob);

      // Use Deno standard library base64 encoding - handles large files without stack overflow
      // This avoids the btoa() stack overflow issue with images > 1MB
      imgBase64 = encodeBase64(uint8Array);

      logger.info('Image converted to base64', { size: imgBase64.length });
    }

    if (!imgBase64) {
      throw new Error('No image provided (imageUrl or imageBase64 required)');
    }

    // Initialize Google AI Studio
    console.log('=== ABOUT TO GET API KEY ===', { requestId });
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google AI Studio API key not configured');
    }
    console.log('=== GOT API KEY ===', { requestId, keyLength: googleApiKey.length });

    console.log('=== ABOUT TO INSTANTIATE GoogleAIUnifiedService ===', { requestId });
    const googleAI = new GoogleAIUnifiedService(googleApiKey);
    console.log('=== GoogleAIUnifiedService CREATED ===', { requestId });

    console.log('=== ABOUT TO CALL generateVideo ===', { requestId, includeNarration, promptLength: prompt.length, imageSize: imgBase64.length });
    logger.info('Generating video with Veo 3.1 Fast', { includeNarration });

    // Generate video (this will poll until complete)
    const videoDownloadLink = await googleAI.generateVideo(imgBase64, prompt, includeNarration);
    console.log('=== generateVideo RETURNED ===', { requestId, downloadLink: videoDownloadLink });

    logger.info('Video generated successfully with Veo 3.1', { downloadLink: videoDownloadLink });

    // Download video and upload to Supabase Storage
    logger.info('Downloading video from Google', { downloadLink: videoDownloadLink });
    const videoResponse = await fetch(`${videoDownloadLink}&key=${googleApiKey}`);

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} - ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.arrayBuffer();
    const videoBytes = new Uint8Array(videoBlob);
    logger.info('Video downloaded successfully', { sizeBytes: videoBytes.length });

    const supabase = createSupabaseClient(true);
    const fileName = `${segment_id}_video_${Date.now()}.mp4`;

    logger.info('Uploading video to Supabase storage', { fileName, bucket: 'story-videos' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-videos')
      .upload(fileName, videoBytes, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      logger.error('Failed to upload video to storage', { error: uploadError });
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    let videoUrl = '';
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('story-videos')
        .getPublicUrl(fileName);
      videoUrl = urlData.publicUrl;
      logger.info('Got public URL for video', { videoUrl });

      // Update segment with video URL
      const { error: updateError } = await supabase
        .from('story_segments')
        .update({
          video_url: videoUrl,
          video_generation_status: 'completed'
        })
        .eq('id', segment_id);

      if (updateError) {
        logger.error('Failed to update segment with video URL', { error: updateError });
      }
    }

    logger.info('Video uploaded to storage', { videoUrl });

    // Skip credit deduction for V2 (like audio V2)
    // TODO: Add credit deduction when user auth is properly set up

    logger.info('Video V2 generated successfully', { requestId, videoUrl });

    return ResponseHandler.success({
      success: true,
      video_url: videoUrl,  // Frontend expects snake_case
      videoUrl,             // Also return camelCase for compatibility
      credits_used: 0  // Free for now
    });

  } catch (error) {
    console.log('=== CAUGHT ERROR ===', { requestId, errorType: error?.constructor?.name });

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.log('=== ERROR DETAILS ===', {
      message: errorMessage,
      type: error?.constructor?.name,
      hasStack: !!errorStack
    });

    logger.error('Video generation V2 failed', {
      error: errorMessage,
      errorType: error?.constructor?.name,
      stack: errorStack,
      requestId
    });

    console.log('=== ABOUT TO RETURN ERROR RESPONSE ===', { requestId });

    return ResponseHandler.error(
      errorMessage || 'Failed to generate video',
      500,
      { requestId, errorType: error?.constructor?.name }
    );
  }
});
