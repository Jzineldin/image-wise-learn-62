import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';
import { PromptTemplateManager } from '../_shared/prompt-templates.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { CreditService, validateAndDeductCredits, CREDIT_COSTS } from '../_shared/credit-system.ts';

// ============= TYPES =============

interface GenerateSegmentRequest {
  storyId: string;
  choiceId: number;
  choiceText: string;
  previousSegmentContent: string;
  storyContext: {
    title: string;
    description: string;
    ageGroup: string;
    genre: string;
    languageCode?: string;
    characters: Array<{
      name: string;
      description: string;
      role: string;
    }>;
  };
  segmentNumber: number;
  requestId?: string;
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const {
      storyId,
      choiceId,
      choiceText,
      previousSegmentContent,
      storyContext,
      segmentNumber,
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }: GenerateSegmentRequest = await req.json();

    // Initialize credit service and validate credits
    const creditService = new CreditService(supabaseUrl, supabaseKey);
    const userId = await creditService.getUserId();

    // Validate and deduct credits for story segment generation
    const creditResult = await validateAndDeductCredits(
      creditService,
      userId,
      'storySegment'
    );

    console.log(`Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    logger.storySegmentGeneration(storyId, segmentNumber || 1, requestId);

    // Validate input
    if (!storyId || !choiceText || !previousSegmentContent || !storyContext) {
      logger.error('Validation failed: Missing required fields', new Error('Missing required fields'), {
        requestId,
        hasStoryId: !!storyId,
        hasChoiceText: !!choiceText,
        hasPreviousContent: !!previousSegmentContent,
        hasStoryContext: !!storyContext
      });
      return ResponseHandler.error('Missing required fields', 400);
    }

    // Create AI service
    const aiService = createAIService();

    // Determine if this should be an ending segment
    const shouldBeEnding = segmentNumber >= 4 && Math.random() > 0.4;

    // Prepare context for prompt generation
    const context = {
      ageGroup: storyContext.ageGroup,
      genre: storyContext.genre,
      language: storyContext.languageCode || 'en',
      characters: storyContext.characters,
      previousContent: previousSegmentContent,
      choiceText,
      segmentNumber,
      shouldBeEnding
    };

    // Generate prompt using template
    const promptTemplate = PromptTemplateManager.generateStorySegment(context);

    // Measure processing time
    const { result, duration } = await withTiming(async () => {
      // Call AI service
      const aiResponse = await aiService.generate('story-segments', {
        messages: [
          { role: 'system', content: promptTemplate.system },
          { role: 'user', content: promptTemplate.user }
        ],
        responseFormat: 'json',
        schema: promptTemplate.schema
      });

      // Validate and normalize response
      const normalizedData = ResponseHandler.validateAndNormalize(
        aiResponse.content,
        Validators.storySegment
        // No fallback for segments - should fail if AI doesn't work
      );

      return {
        segmentData: normalizedData,
        model_used: aiResponse.model,
        provider: aiResponse.provider,
        tokensUsed: aiResponse.tokensUsed
      };
    });

    logger.info('AI generation completed', {
      requestId,
      contentLength: result.segmentData.content.length,
      choicesCount: result.segmentData.choices.length,
      isEnding: result.segmentData.is_ending,
      model: result.model_used,
      provider: result.provider,
      duration: `${duration}ms`,
      tokensUsed: result.tokensUsed
    });

    // Create the segment in the database
    const { data: newSegment, error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id: storyId,
        segment_number: segmentNumber,
        content: result.segmentData.content,
        choices: result.segmentData.choices,
        is_ending: result.segmentData.is_ending || false,
        metadata: {
          generated_from_choice: {
            id: choiceId,
            text: choiceText
          },
          model_used: result.model_used,
          provider: result.provider,
          generation_timestamp: new Date().toISOString(),
          processing_time_ms: duration
        }
      })
      .select()
      .single();

    if (segmentError) {
      logger.error('Database error creating segment', segmentError, {
        requestId,
        storyId,
        segmentNumber
      });
      return ResponseHandler.error('Failed to save segment to database', 500, segmentError);
    }

    // If this is an ending, update the story status
    if (result.segmentData.is_ending) {
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          status: 'completed',
          is_completed: true,
          is_complete: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', storyId);

      if (updateError) {
        logger.warn('Failed to update story completion status', updateError, {
          requestId,
          storyId
        });
      } else {
        logger.info('Story marked as completed', {
          requestId,
          storyId
        });
      }
    }

    logger.info('Story segment created successfully', {
      requestId,
      segmentId: newSegment.id,
      storyId,
      segmentNumber: newSegment.segment_number,
      isEnding: result.segmentData.is_ending || false
    });

    return ResponseHandler.success({
      segment: newSegment,
      is_ending: result.segmentData.is_ending || false,
      requestId
    }, result.model_used, {
      tokensUsed: result.tokensUsed,
      processingTime: duration,
      provider: result.provider,
      requestId
    });

  } catch (error) {
    const requestId = (req as any).requestId || 'unknown';
    logger.error('Story segment generation failed', error, {
      requestId,
      timestamp: new Date().toISOString()
    });

    // Return appropriate error response
    if (error.message.includes('API keys not configured')) {
      return ResponseHandler.error('AI services not configured', 503, { requestId });
    }

    if (error.message.includes('Invalid response format')) {
      return ResponseHandler.error('AI generated invalid content format', 502, { requestId });
    }

    return ResponseHandler.error(
      error.message || 'Segment generation failed',
      500,
      { 
        stack: error.stack,
        requestId,
        timestamp: new Date().toISOString()
      }
    );
  }
});