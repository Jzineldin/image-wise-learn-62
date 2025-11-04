/**
 * Generate Video Async - Veo 3.1 Background Processing
 *
 * Returns immediately with job_id, processes video in background
 * Uses Supabase Realtime for status updates to frontend
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

  try {
    logger.info('Async video generation started', { requestId });

    // Parse request
    let body: GenerateVideoRequest;
    try {
      const bodyText = await req.text();
      body = JSON.parse(bodyText);
    } catch (jsonError) {
      throw new Error(`Invalid request format: ${jsonError}`);
    }

    const { segment_id, imageUrl, imageBase64, prompt, includeNarration = false } = body;

    // Get image as base64
    let imgBase64 = imageBase64;
    if (!imgBase64 && imageUrl) {
      logger.info('Fetching image from URL', { imageUrl });

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBlob = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(imageBlob);
      imgBase64 = encodeBase64(uint8Array);

      logger.info('Image converted to base64', { size: imgBase64.length });
    }

    if (!imgBase64) {
      throw new Error('No image provided (imageUrl or imageBase64 required)');
    }

    // Create job record in database
    const supabase = createSupabaseClient(true); // Use service role
    const { data: job, error: jobError } = await supabase
      .from('video_generation_jobs')
      .insert({
        segment_id,
        image_url: imageUrl || '',
        prompt,
        include_narration: includeNarration,
        status: 'pending'
      })
      .select()
      .single();

    if (jobError || !job) {
      logger.error('Failed to create job record', { error: jobError });
      throw new Error('Failed to create video generation job');
    }

    logger.info('Job created, starting background processing', {
      jobId: job.id,
      segmentId: segment_id
    });

    // Start background processing (don't await!)
    processVideoGeneration(
      job.id,
      segment_id,
      imgBase64,
      prompt,
      includeNarration
    ).catch(async (error) => {
      logger.error('Background video generation failed', {
        jobId: job.id,
        error: error.message
      });

      // Update job with error status
      await supabase
        .from('video_generation_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);
    });

    // Return immediately with job info
    return ResponseHandler.success({
      success: true,
      job_id: job.id,
      status: 'pending',
      message: 'Video generation started in background',
      segment_id
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Async video generation failed', {
      error: errorMessage,
      requestId
    });

    return ResponseHandler.error(
      errorMessage || 'Failed to start video generation',
      500,
      { requestId }
    );
  }
});

/**
 * Background processing function - runs async
 * Updates job status in database as it progresses
 */
async function processVideoGeneration(
  jobId: string,
  segmentId: string,
  imageBase64: string,
  prompt: string,
  includeNarration: boolean
) {
  const supabase = createSupabaseClient(true);

  try {
    // Update status to processing
    await supabase
      .from('video_generation_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    logger.info('Processing video generation', {
      jobId,
      segmentId,
      includeNarration
    });

    // Get Google AI API key
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!googleApiKey) {
      throw new Error('Google AI Studio API key not configured');
    }

    // Initialize Google AI service
    const googleAI = new GoogleAIUnifiedService(googleApiKey);

    // Generate video (this will poll until complete - ~55 seconds)
    logger.info('Calling Veo 3.1 Fast API', { jobId });
    const videoDownloadLink = await googleAI.generateVideo(imageBase64, prompt, includeNarration);
    logger.info('Video generated successfully', { jobId, downloadLink: videoDownloadLink });

    // Download video from Google
    logger.info('Downloading video from Google', { jobId });
    const videoResponse = await fetch(`${videoDownloadLink}&key=${googleApiKey}`);

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`);
    }

    const videoBlob = await videoResponse.arrayBuffer();
    const videoBytes = new Uint8Array(videoBlob);
    logger.info('Video downloaded', { jobId, sizeBytes: videoBytes.length });

    // Upload to Supabase Storage
    const fileName = `${segmentId}_video_${Date.now()}.mp4`;
    logger.info('Uploading to Supabase storage', { jobId, fileName });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-videos')
      .upload(fileName, videoBytes, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('story-videos')
      .getPublicUrl(fileName);

    const videoUrl = urlData.publicUrl;
    logger.info('Video uploaded successfully', { jobId, videoUrl });

    // Update segment with video URL
    await supabase
      .from('story_segments')
      .update({
        video_url: videoUrl,
        video_generation_status: 'completed'
      })
      .eq('id', segmentId);

    // Update job to completed status
    await supabase
      .from('video_generation_jobs')
      .update({
        status: 'completed',
        video_url: videoUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    logger.info('Video generation job completed', {
      jobId,
      segmentId,
      videoUrl
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Video generation processing failed', {
      jobId,
      error: errorMessage
    });

    // Update job with failed status
    await supabase
      .from('video_generation_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    throw error;
  }
}
