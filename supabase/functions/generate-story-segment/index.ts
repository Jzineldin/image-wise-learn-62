import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, CREDIT_COSTS, validateAndDeductCredits } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';


interface SegmentRequest {
  story_id?: string;
  storyId?: string;
  choice?: string;
  choiceText?: string;
  segment_number?: number;
  segmentNumber?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Story segment generation request started`);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401);
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    console.log(`[${requestId}] Processing story segment for user: ${userId}`);

    // Parse request body
    const body: SegmentRequest = await req.json();
    const story_id = body.story_id || body.storyId;
    const choice = body.choice || body.choiceText;
    const segment_number = body.segment_number || body.segmentNumber;

    if (!story_id) {
      return ResponseHandler.error('Story ID is required', 400, { 
        operation: 'story-segment', 
        requestId, 
        timestamp: Date.now(),
        receivedParams: Object.keys(body)
      });
    }

    // Validate and deduct credits
    const creditResult = await validateAndDeductCredits(creditService, userId, 'storySegment');
    console.log(`[${requestId}] Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    // Get story details
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

    // Get previous segments for context
    const { data: segments } = await supabase
      .from('story_segments')
      .select('content, choices')
      .eq('story_id', story_id)
      .order('segment_number');

    const previousContent = segments?.map(s => s.content).join('\n\n') || '';
    
    // Generate continuation using AI service (OpenRouter Sonoma Dusk Alpha)
    const aiService = createAIService();
    
    const systemPrompt = `You are continuing an interactive children's story. Generate the next segment based on the previous content and user choice.`;
    
    let userPrompt = `Continue this story for children aged ${story.age_group} in the ${story.genre} genre.

Story so far:
${previousContent}

${choice ? `User chose: ${choice}` : 'Continue the story naturally.'}

Requirements:
- Age-appropriate content for ${story.age_group} year olds
- Continue the narrative smoothly from previous segments
- Include dialogue and descriptive scenes
- Length: 2-3 paragraphs
- End with 2-3 choices for what happens next
- Return ONLY the story continuation and choices, no formatting`;

    const aiResponse = await aiService.generate('story-segments', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.8
    });

    const segmentContent = aiResponse.content;
    console.log(`[${requestId}] Story segment generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Parse choices from content (simple implementation)
    const choiceMatches = segmentContent.match(/(?:Choice \d+:|Option \d+:|\d+\.)([^\n]+)/g) || [];
    const choices = choiceMatches.map((match, index) => ({
      id: index + 1,
      text: match.replace(/^(?:Choice \d+:|Option \d+:|\d+\.)/, '').trim()
    }));

    // Create story segment
    const { data: segment, error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id,
        segment_number,
        content: segmentContent,
        segment_text: segmentContent,
        choices: choices,
        is_ending: choices.length === 0,
      })
      .select()
      .single();

    if (segmentError) {
      console.error(`[${requestId}] Error creating segment:`, segmentError);
      throw new Error('Failed to save story segment');
    }

    // Update story credits used
    await creditService.updateStoryCreditsUsed(story_id, creditResult.creditsUsed);

    console.log(`[${requestId}] Story segment created successfully: ${segment.id}`);

    return ResponseHandler.success(
      {
        segment: {
          id: segment.id,
          content: segmentContent,
          choices,
          is_ending: choices.length === 0
        },
        credits_used: creditResult.creditsUsed,
        credits_remaining: creditResult.newBalance
      },
      aiResponse.model,
      { requestId, tokensUsed: aiResponse.tokensUsed, processingTime: Date.now() }
    );

  } catch (error) {
    console.error(`[${requestId}] Story segment generation error:`, error);
    
    // Handle insufficient credits error
    if (error.message?.includes('Insufficient credits')) {
      return ResponseHandler.error(
        error.message,
        400,
        { error_code: 'INSUFFICIENT_CREDITS', operation: 'story-segment', requestId }
      );
    }

    return ResponseHandler.error(
      error.message || 'Failed to generate story segment',
      500,
      { operation: 'story-segment', requestId, timestamp: Date.now() }
    );
  }
});