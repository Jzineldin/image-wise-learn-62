import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createVideoService } from '../_shared/freepik-video-service.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';

interface StatusRequest {
  task_id: string;
  provider: string;
  segment_id?: string;
  update_database?: boolean; // If true, update segment with result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

    logger.info('Checking video status', { requestId, operation: 'video-status-check' });

    // Parse request body
    const requestBody: StatusRequest = await req.json();
    const { task_id, provider, segment_id, update_database = true } = requestBody;

    // Validate required fields
    if (!task_id || !provider) {
      return ResponseHandler.badRequest('Missing required fields: task_id, provider');
    }

    // Initialize video service
    const videoService = createVideoService();

    // Check video status
    const statusResult = await videoService.getVideoStatus(task_id, provider);

    logger.info('Video status retrieved', { 
      requestId, 
      taskId: task_id,
      status: statusResult.status,
      operation: 'video-status-check' 
    });

    // Update database if requested and segment_id provided
    if (update_database && segment_id) {
      if (statusResult.status === 'completed' && statusResult.videoUrl) {
        const { error: updateError } = await supabase
          .from('story_segments')
          .update({
            video_url: statusResult.videoUrl,
            video_generation_status: 'completed'
          })
          .eq('id', segment_id);

        if (updateError) {
          logger.error('Failed to update segment with video URL', updateError, { requestId });
        } else {
          logger.info('Segment updated with video URL', { requestId, segment_id });
        }
      } else if (statusResult.status === 'failed') {
        const { error: updateError } = await supabase
          .from('story_segments')
          .update({
            video_generation_status: 'failed'
          })
          .eq('id', segment_id);

        if (updateError) {
          logger.error('Failed to update segment status to failed', updateError, { requestId });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        task_id,
        status: statusResult.status,
        video_url: statusResult.videoUrl,
        provider: statusResult.provider,
        resolution: statusResult.resolution,
        error: statusResult.error
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    logger.error('Video status check failed', error, { requestId, operation: 'video-status-error' });

    return ResponseHandler.error(
      'VIDEO_STATUS_CHECK_FAILED',
      (error as Error)?.message || 'Failed to check video status',
      { requestId }
    );
  }
});

