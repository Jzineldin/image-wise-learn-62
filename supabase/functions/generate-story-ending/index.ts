import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, CREDIT_COSTS, validateCredits, deductCreditsAfterSuccess } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { AGE_GUIDELINES } from '../_shared/prompt-templates.ts';
import { ResponseHandler, ERROR_CODES, parseWordRange, countWords, trimToMaxWords } from '../_shared/response-handlers.ts';

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

    // Validate credits first (no deduction yet)
    const validation = await validateCredits(creditService, userId, 'storySegment');
    console.log(`Credits validated: ${validation.creditsRequired}`);

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

    // Lightweight narrative memory summary (last 2 segments)
    let memoryBlock = '';
    try {
      const recent = (segments || []).slice(-2).map(s => s.content || '').join(' ').trim();
      const summary = recent ? trimToMaxWords(recent, 80) : '';
      if (summary) {
        memoryBlock = `NARRATIVE MEMORY SUMMARY:\n- Recent events: ${summary}\n\n`;
      }
    } catch (_e) {
      // best-effort only
    }

    // Generate ending using AI service (OpenRouter Grok 4 Fast)
    const aiService = createAIService();

    const ageGuide = AGE_GUIDELINES[story.age_group as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    const wordRange = ageGuide.wordCount;

    const systemPrompt = `You are creating a satisfying, age-appropriate ending for a children's story. Keep clarity and concrete imagery over abstract metaphors.

STYLE GUARDRAILS (MANDATORY):
- Avoid overly metaphorical or purple prose; prefer clear, concrete language
- Use active voice; keep sentence length within ${ageGuide.sentence}
- Vocabulary: ${ageGuide.vocabulary}; Themes: ${ageGuide.themes}; Complexity: ${ageGuide.complexity}
- Maintain continuity with prior segments and reflect the reader's most recent decisions
- Character references must stay lowercase for descriptive types (e.g., "the curious cat"), never capitalized descriptive names
`;


    const userPrompt = `Write a ${ending_type} ending for this children's story (age ${story.age_group}, ${story.genre} genre):

Story so far:
${memoryBlock}${storyContent}

Requirements:
- Vocabulary: ${ageGuide.vocabulary}
- Sentence structure: ${ageGuide.sentence}
- Themes: ${ageGuide.themes}
- Length: between ${wordRange} (aim for the midpoint)
- Ensure closure consistent with ${ageGuide.complexity}
- Return ONLY the ending content, no formatting`;

    const aiResponse = await aiService.generate('story-segments', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.5
    });

    let endingContent = aiResponse.content;
    const { min, max } = parseWordRange(wordRange);
    const wc = countWords(endingContent);
    if (wc > max) {
      console.warn(`Ending exceeds max words (${wc} > ${max}). Trimming to max.`);
      endingContent = trimToMaxWords(endingContent, max);
    } else if (wc < min) {
      console.warn(`Ending below min words (${wc} < ${min}). Proceeding without modification.`);
    }
    console.log(`Story ending generated using ${aiResponse.provider} - ${aiResponse.model} with ~${wc} words (target ${wordRange})`);

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

    // Deduct credits AFTER success with idempotent reference
    const creditResult = await deductCreditsAfterSuccess(
      creditService,
      userId,
      'storySegment',
      validation.creditsRequired,
      segment.id,
      { story_id, ending_type }
    );

    // Update story credits used (legacy behavior)
    await creditService.updateStoryCreditsUsed(story_id, validation.creditsRequired);

    console.log(`Story ending created successfully: ${segment.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        segment_id: segment.id,
        content: endingContent,
        ending_type,
        credits_used: validation.creditsRequired,
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