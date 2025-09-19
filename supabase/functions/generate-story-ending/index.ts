import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, CREDIT_COSTS, validateAndDeductCredits } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler, ERROR_CODES } from '../_shared/response-handlers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndingRequest {
  story_id?: string;
  storyId?: string;
  ending_type?: 'happy' | 'cliffhanger' | 'lesson' | 'open';
  endingType?: 'happy' | 'cliffhanger' | 'lesson' | 'open';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401, { endpoint: 'generate-story-ending' });
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    console.log(`Processing story ending for user: ${userId}`);

    // Parse request body
    const body: EndingRequest = await req.json();
    const story_id = body.story_id || body.storyId;
    const ending_type = body.ending_type || body.endingType || 'happy';

    if (!story_id) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.VALIDATION_ERROR,
        'Story ID is required',
        { field: 'story_id' }
      );
    }

    // Validate and deduct credits
    const creditResult = await validateAndDeductCredits(creditService, userId, 'storySegment');
    console.log(`Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    // Get story details and all segments
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('title, genre, age_group, language_code')
      .eq('id', story_id)
      .eq('user_id', userId)
      .single();

    if (storyError) {
      throw new Error('Story not found or access denied');
    }

    // Get all story segments for context
    const { data: segments } = await supabase
      .from('story_segments')
      .select('content, segment_number')
      .eq('story_id', story_id)
      .order('segment_number');

    const storyContent = segments?.map(s => s.content).join('\n\n') || '';

    // Generate ending using AI service (OpenRouter Sonoma Dusk Alpha)
    const aiService = createAIService();

    const systemPrompt = `You are creating a satisfying ending for a children's story. The ending should feel natural and complete while teaching a positive lesson.`;

    const userPrompt = `Write a ${ending_type} ending for this children's story (age ${story.age_group}, ${story.genre} genre):

Story so far:
${storyContent}

Requirements:
- Age-appropriate content for ${story.age_group} year olds
- ${ending_type} ending that feels satisfying and complete
- Include a positive lesson or moral
- Wrap up the main story elements
- Length: 2-3 paragraphs
- Return ONLY the ending content, no formatting`;

    const aiResponse = await aiService.generate('story-segments', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.7
    });

    const endingContent = aiResponse.content;
    console.log(`Story ending generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Get next segment number
    const nextSegmentNumber = (segments?.length || 0) + 1;

    // Create ending segment
    const { data: segment, error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id,
        segment_number: nextSegmentNumber,
        content: endingContent,
        segment_text: endingContent,
        choices: [],
        is_ending: true,
        is_end: true,
      })
      .select()
      .single();

    if (segmentError) {
      console.error('Error creating ending segment:', segmentError);
      throw new Error('Failed to save story ending');
    }

    // Update story status to completed
    await supabase
      .from('stories')
      .update({
        status: 'completed',
        is_complete: true,
        is_completed: true
      })
      .eq('id', story_id);

    // Update story credits used
    await creditService.updateStoryCreditsUsed(story_id, creditResult.creditsUsed);

    console.log(`Story ending created successfully: ${segment.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        segment_id: segment.id,
        content: endingContent,
        ending_type,
        credits_used: creditResult.creditsUsed,
        credits_remaining: creditResult.newBalance,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Story ending generation error:', error);

    // Handle insufficient credits error
    if ((error as any)?.message?.includes('Insufficient credits')) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INSUFFICIENT_CREDITS,
        'Insufficient credits',
        { original: (error as any).message }
      );
    }

    return ResponseHandler.handleError(error, { endpoint: 'generate-story-ending' });
  }
});