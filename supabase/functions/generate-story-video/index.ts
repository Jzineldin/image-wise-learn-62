import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CreditService, validateCredits, deductCreditsAfterSuccess, refundCredits } from '../_shared/credit-system.ts';
import { FreepikVideoService } from '../_shared/freepik-video-service.ts';
import { ResponseHandler, ERROR_CODES } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { InputValidator, InputSanitizer, RateLimiter, SecurityAuditor } from '../_shared/validation.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';

interface VideoRequest {
  segment_id: string;
  story_id: string;
  image_url: string;
  prompt?: string;
  wait_for_completion?: boolean; // If true, poll until complete
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let segment_id: string | undefined;
  let userId: string | null = null;
  let creditsRequired = 0;

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.AUTHENTICATION_FAILED,
        'Authorization header required'
      );
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);
    const videoService = new FreepikVideoService();

    // Get user ID
    userId = await creditService.getUserId();
    logger.info('Processing video generation request', { requestId, userId, operation: 'video-generation' });

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `video_generation_${userId}_${clientIp}`;
    const rateLimit = RateLimiter.checkLimit(rateLimitKey, 2, 60000); // 2 requests per minute

    if (!rateLimit.allowed) {
      SecurityAuditor.logRateLimit(rateLimitKey, {
        operation: 'video_generation',
        userId,
        resetTime: rateLimit.resetTime
      });
      return ResponseHandler.errorWithCode(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded. Please wait before generating more videos.'
      );
    }

    // Parse request body
    const requestBody: VideoRequest = await req.json();
    const { segment_id: segmentId, story_id, image_url, prompt, wait_for_completion = false } = requestBody;
    segment_id = segmentId;

    // Validate required fields
    if (!segment_id || !story_id || !image_url) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INVALID_REQUEST,
        'Missing required fields: segment_id, story_id, image_url'
      );
    }

    // Validate credits (1 credit for video generation)
    creditsRequired = 1;
    const creditCheck = await validateCredits(creditService, userId, 'videoGeneration', creditsRequired);
    if (!creditCheck.success) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INSUFFICIENT_CREDITS,
        creditCheck.error || 'Insufficient credits',
        { required: creditsRequired, available: creditCheck.available }
      );
    }

    logger.info('Credits validated for video generation', {
      creditsRequired,
      availableCredits: creditCheck.available,
      operation: 'credit-validation'
    });

    // Verify segment belongs to user's story
    const supabase = createSupabaseClient(false, authHeader);
    const { data: segment, error: segmentError } = await supabase
      .from('story_segments')
      .select('id, story_id, image_url')
      .eq('id', segment_id)
      .single();

    if (segmentError || !segment) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.NOT_FOUND,
        'Story segment not found'
      );
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, author_id')
      .eq('id', story_id)
      .single();

    if (storyError || !story) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.NOT_FOUND,
        'Story not found'
      );
    }

    if (story.user_id !== userId && story.author_id !== userId) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to generate videos for this story'
      );
    }

    // Generate video
    logger.info('Initiating video generation', { requestId, segment_id, image_url, operation: 'video-generation' });

    const videoResult = await videoService.generateVideo({
      imageUrl: image_url,
      prompt: prompt || undefined
    });

    logger.info('Video generation initiated', { 
      requestId, 
      taskId: videoResult.taskId, 
      provider: videoResult.provider,
      operation: 'video-generation' 
    });

    // Update segment with task ID and status
    const { error: updateError } = await supabase
      .from('story_segments')
      .update({
        video_task_id: videoResult.taskId,
        video_provider: videoResult.provider,
        animation_status: 'processing'
      })
      .eq('id', segment_id);

    if (updateError) {
      logger.error('Failed to update segment with video task ID', updateError, { requestId });
    }

    // If wait_for_completion is true, poll until video is ready
    if (wait_for_completion) {
      logger.info('Polling for video completion', { requestId, taskId: videoResult.taskId });

      const completedResult = await videoService.pollVideoStatus(
        videoResult.taskId,
        videoResult.provider,
        60, // max 60 attempts
        5000 // 5 seconds between attempts
      );

      if (completedResult.status === 'completed' && completedResult.videoUrl) {
        // Deduct credits for successful video generation
        await deductCreditsAfterSuccess(creditService, userId, 'videoGeneration', creditsRequired);

        // Update segment with final video URL
        const { error: finalUpdateError } = await supabase
          .from('story_segments')
          .update({
            video_url: completedResult.videoUrl,
            animation_status: 'ready'
          })
          .eq('id', segment_id);

        if (finalUpdateError) {
          logger.error('Failed to update segment with video URL', finalUpdateError, { requestId });
        }

        logger.info('Video generation completed', {
          requestId,
          videoUrl: completedResult.videoUrl,
          creditsDeducted: creditsRequired,
          operation: 'video-generation-success'
        });

        return ResponseHandler.success({
          video_url: completedResult.videoUrl,
          task_id: completedResult.taskId,
          provider: completedResult.provider,
          resolution: completedResult.resolution,
          status: 'completed',
          creditsDeducted: creditsRequired
        });
      } else {
        // Refund credits if video generation failed
        await refundCredits(creditService, userId, 'videoGeneration', creditsRequired);

        // Video generation failed
        const { error: failUpdateError } = await supabase
          .from('story_segments')
          .update({
            animation_status: 'failed'
          })
          .eq('id', segment_id);

        if (failUpdateError) {
          logger.error('Failed to update segment status to failed', failUpdateError, { requestId });
        }

        return ResponseHandler.errorWithCode(
          ERROR_CODES.GENERATION_FAILED,
          completedResult.error || 'Video generation failed',
          { taskId: completedResult.taskId }
        );
      }
    }

    // Deduct credits for initiated video generation (async)
    await deductCreditsAfterSuccess(creditService, userId, 'videoGeneration', creditsRequired);

    // Return immediately with task ID (client can poll separately)
    return ResponseHandler.success({
      task_id: videoResult.taskId,
      provider: videoResult.provider,
      resolution: videoResult.resolution,
      status: 'processing',
      creditsDeducted: creditsRequired,
      message: 'Video generation initiated. Use task_id to check status.'
    }, 202); // 202 Accepted

  } catch (error) {
    const errorMessage = (error as Error)?.message || 'Unknown error';
    logger.error('Video generation failed', error, { requestId, segment_id, userId, operation: 'video-generation-error' });

    // Refund credits on error
    if (userId && creditsRequired > 0) {
      try {
        await refundCredits(new CreditService(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        ), userId, 'videoGeneration', creditsRequired);
      } catch (refundError) {
        logger.error('Failed to refund credits', refundError, { userId, operation: 'credit-refund' });
      }
    }

    // Update segment status to failed if we have segment_id
    if (segment_id) {
      try {
        const supabase = createSupabaseClient(true);
        await supabase
          .from('story_segments')
          .update({ animation_status: 'failed' })
          .eq('id', segment_id);
      } catch (updateError) {
        logger.error('Failed to update segment status after error', updateError, { requestId });
      }
    }

    return ResponseHandler.errorWithCode(
      ERROR_CODES.INTERNAL_ERROR,
      errorMessage,
      { requestId }
    );
  }
});

