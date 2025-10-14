import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createVideoService } from '../_shared/freepik-video-service.ts';
import { ResponseHandler, ERROR_CODES } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
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

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.unauthorized('Missing authorization header');
    }

    // Initialize Supabase client
    const supabase = createSupabaseClient(false, authHeader);

    // Get user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return ResponseHandler.unauthorized('Invalid user session');
    }

    const userId = user.id;
    logger.info('Processing video generation request', { requestId, userId, operation: 'video-generation' });

    // Parse request body
    const requestBody: VideoRequest = await req.json();
    const { segment_id: segmentId, story_id, image_url, prompt, wait_for_completion = false } = requestBody;
    segment_id = segmentId;

    // Validate required fields
    if (!segment_id || !story_id || !image_url) {
      return ResponseHandler.badRequest('Missing required fields: segment_id, story_id, image_url');
    }

    // Verify segment belongs to user's story
    const { data: segment, error: segmentError } = await supabase
      .from('story_segments')
      .select('id, story_id, image_url')
      .eq('id', segment_id)
      .single();

    if (segmentError || !segment) {
      return ResponseHandler.notFound('Story segment not found');
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, user_id, author_id')
      .eq('id', story_id)
      .single();

    if (storyError || !story) {
      return ResponseHandler.notFound('Story not found');
    }

    if (story.user_id !== userId && story.author_id !== userId) {
      return ResponseHandler.forbidden('You do not have permission to generate videos for this story');
    }

    // Initialize video service
    const videoService = createVideoService();

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
        video_generation_status: 'processing'
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
        // Update segment with final video URL
        const { error: finalUpdateError } = await supabase
          .from('story_segments')
          .update({
            video_url: completedResult.videoUrl,
            video_generation_status: 'completed'
          })
          .eq('id', segment_id);

        if (finalUpdateError) {
          logger.error('Failed to update segment with video URL', finalUpdateError, { requestId });
        }

        logger.info('Video generation completed', { 
          requestId, 
          videoUrl: completedResult.videoUrl,
          operation: 'video-generation-success' 
        });

        return new Response(
          JSON.stringify({
            success: true,
            video_url: completedResult.videoUrl,
            task_id: completedResult.taskId,
            provider: completedResult.provider,
            resolution: completedResult.resolution,
            status: 'completed'
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        // Video generation failed
        const { error: failUpdateError } = await supabase
          .from('story_segments')
          .update({
            video_generation_status: 'failed'
          })
          .eq('id', segment_id);

        if (failUpdateError) {
          logger.error('Failed to update segment status to failed', failUpdateError, { requestId });
        }

        return ResponseHandler.error(
          ERROR_CODES.AI_GENERATION_FAILED,
          completedResult.error || 'Video generation failed',
          { taskId: completedResult.taskId }
        );
      }
    }

    // Return immediately with task ID (client can poll separately)
    return new Response(
      JSON.stringify({
        success: true,
        task_id: videoResult.taskId,
        provider: videoResult.provider,
        resolution: videoResult.resolution,
        status: 'processing',
        message: 'Video generation initiated. Use task_id to check status.'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 202, // Accepted
      }
    );

  } catch (error) {
    logger.error('Video generation failed', error, { requestId, segment_id, operation: 'video-generation-error' });

    // Update segment status to failed if we have segment_id
    if (segment_id) {
      try {
        const supabase = createSupabaseClient(true);
        await supabase
          .from('story_segments')
          .update({ video_generation_status: 'failed' })
          .eq('id', segment_id);
      } catch (updateError) {
        logger.error('Failed to update segment status after error', updateError, { requestId });
      }
    }

    return ResponseHandler.error(
      ERROR_CODES.AI_GENERATION_FAILED,
      (error as Error)?.message || 'Video generation failed',
      { requestId }
    );
  }
});

