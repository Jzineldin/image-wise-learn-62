import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, validateCredits, deductCreditsAfterSuccess } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler, parseWordRange, countWords, trimToMaxWords } from '../_shared/response-handlers.ts';
import { PromptTemplateManager, AGE_GUIDELINES } from '../_shared/prompt-templates.ts';

interface StoryRequest {
  storyId: string;
  prompt: string;
  genre: string;
  ageGroup: string;
  languageCode?: string;
  isInitialGeneration?: boolean;
  characters?: Array<{
    name: string;
    description: string;
    personality: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Story generation request started`);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401, { requestId });
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    console.log(`[${requestId}] Processing story generation for user: ${userId}`);

    // Parse and validate request body
    const body = await req.json();
    const { 
      storyId, 
      prompt, 
      genre, 
      ageGroup, 
      languageCode = 'en', 
      isInitialGeneration = true,
      characters = []
    }: StoryRequest = body;

    if (!storyId || !prompt || !genre || !ageGroup) {
      throw new Error('Missing required fields');
    }

    console.log(`[${requestId}] Request validated:`, { storyId, genre, ageGroup, languageCode, hasCharacters: characters.length > 0 });

    // Validate credits first (no deduction yet)
    const validation = await validateCredits(creditService, userId, 'storyGeneration');
    console.log(`[${requestId}] Credits validated: ${validation.creditsRequired}`);

    // Get the existing story to update
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: existingStory, error: fetchError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingStory) {
      console.error(`[${requestId}] Story not found:`, fetchError);
      throw new Error('Story not found or access denied');
    }

    // Generate story using AI service
    const aiService = createAIService();
    
    // Process character references and build strict protagonist instructions
    const processedCharacters = (characters || []).map(c => ({
      ...c,
      reference: PromptTemplateManager.getCharacterReference({ name: c.name, description: c.description })
    }));

    const protagonistsList = processedCharacters.length > 0
      ? processedCharacters.map(c => `- ${c.reference}: ${c.description} (personality: ${c.personality || ''})`).join('\n')
      : '';

    const languageInstructions = languageCode === 'sv' ? `
🚨 LANGUAGE REQUIREMENT: Generate ALL content in Swedish (Svenska). Use natural, fluent Swedish appropriate for ${ageGroup}.
` : (languageCode && languageCode !== 'en') ? `
🚨 LANGUAGE REQUIREMENT: Generate ALL content in ${languageCode}. Use natural, fluent language appropriate for ${ageGroup}.
` : '';

    const characterRules = processedCharacters.length > 0 ? `
🚨 CRITICAL CHARACTER RULES (MANDATORY):
- The MAIN PROTAGONISTS are:
${protagonistsList}
- ALWAYS feature these protagonists centrally in the opening segment.
- Use EXACT references like "${processedCharacters[0].reference}" (never capitalize descriptive references like "Curious Cat").
- NEVER use the original capitalized names if they are descriptive types.
- Use natural flow: first mention → pronoun → descriptive reference → pronoun.
` : '';

    const ageGuide = AGE_GUIDELINES[ageGroup as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    const systemPrompt = `You are a skilled children's story writer creating interactive stories for ${ageGroup} readers in the ${genre} genre. Create engaging opening segments that set up the story world and present meaningful choices for the reader to continue the adventure.
${languageInstructions}${characterRules}

STYLE & LENGTH REQUIREMENTS:
- Vocabulary: ${ageGuide.vocabulary}
- Sentence structure: ${ageGuide.sentence}
- Themes: ${ageGuide.themes}; Complexity: ${ageGuide.complexity}
- Length: between ${ageGuide.wordCount} (aim for the midpoint)`;

    const userPrompt = `Create an opening segment for an interactive ${existingStory.story_type || 'short'} story.

Story prompt/context: ${prompt}
${processedCharacters.length > 0 ? `Use these MAIN PROTAGONISTS (MANDATORY): ${processedCharacters.map(c => c.reference).join(', ')}` : ''}

Requirements:
- Age-appropriate content for ${ageGroup}
- Introduce the setting and make the listed protagonists the clear focus
- End with a cliffhanger or decision point that leads to 2-3 meaningful choices, each with a specific consequence (impact)
- Length: between ${ageGuide.wordCount} (aim for the midpoint) for the opening segment
- The story should continue based on reader choices, not end immediately
- Output language: ${languageCode}

Format your response as:
CONTENT: [story opening content]
CHOICES:
1. [choice 1 text] — Impact: [specific consequence]
2. [choice 2 text] — Impact: [specific consequence]
3. [choice 3 text] — Impact: [specific consequence]`;

    console.log(`[${requestId}] Generating story with AI service...`);
    const aiResponse = await aiService.generate('story-generation', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.7
    });

    const rawContent = aiResponse.content;
    console.log(`[${requestId}] Story generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Parse content and choices
    const contentMatch = rawContent.match(/CONTENT:\s*([\s\S]*?)(?=CHOICES:|$)/);
    const choicesMatch = rawContent.match(/CHOICES:\s*([\s\S]*)/);
    
    let storyContent = contentMatch?.[1]?.trim() || rawContent;

    // Enforce word range for opening CONTENT portion (choices handled separately)
    {
      const { min, max } = parseWordRange(AGE_GUIDELINES[ageGroup as keyof typeof AGE_GUIDELINES].wordCount);
      const wc = countWords(storyContent);
      if (wc > max) {
        console.warn(`[${requestId}] Opening exceeds max words (${wc} > ${max}). Trimming to max.`);
        storyContent = trimToMaxWords(storyContent, max);
      }
      console.log(`[${requestId}] Opening segment word count: ${wc} (target ${min}-${max}) for age ${ageGroup}`);
    }

    let choices = [];

    if (choicesMatch) {
      const choiceLines = choicesMatch[1].split('\n').filter(line => line.trim());
      choices = choiceLines.map((line, index) => {
        const cleaned = line.replace(/^\d+\.\s*/, '').trim();
        // Extract optional impact after a dash-like separator and 'Impact:' label
        const match = cleaned.match(/^(.*?)(?:\s*[—\-–]\s*Impact:\s*(.*))?$/i);
        const text = (match?.[1] || '').trim();
        const impact = (match?.[2] || '').trim();
        return {
          id: index + 1,
          text,
          impact: impact || undefined
        };
      }).filter(choice => choice.text);
    }

    // If no choices were parsed, create default ones
    if (choices.length === 0) {
      choices = [
        { id: 1, text: "Continue the adventure", consequences: null },
        { id: 2, text: "Explore a different path", consequences: null },
        { id: 3, text: "Take a moment to think", consequences: null }
      ];
    }

    // Update story status (in progress, not completed yet)
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update({
        status: 'in_progress',
        credits_used: (existingStory.credits_used || 0) + validation.creditsRequired,
      })
      .eq('id', storyId)
      .select()
      .single();

    if (updateError) {
      console.error(`[${requestId}] Error updating story:`, updateError);
      throw new Error('Failed to update story');
    }

    // Create or replace opening segment (segment_number=1) with content and choices
    const { error: segmentError } = await supabase
      .from('story_segments')
      .upsert({
        story_id: storyId,
        segment_number: 1,
        content: storyContent,
        segment_text: storyContent,
        is_ending: choices.length === 0,
        choices: choices
      }, { onConflict: 'story_id,segment_number' });

    if (segmentError) {
      console.error(`[${requestId}] Error upserting story segment:`, segmentError);
      throw new Error('Failed to save story content');
    }

    // Deduct credits AFTER successful generation and persistence
    const creditResult = await deductCreditsAfterSuccess(
      creditService,
      userId,
      'storyGeneration',
      validation.creditsRequired,
      storyId,
      { requestId }
    );
    console.log(`[${requestId}] Credits deducted: ${validation.creditsRequired}, New balance: ${creditResult.newBalance}`);

    console.log(`[${requestId}] Story completed successfully: ${storyId}`);

    return ResponseHandler.success({
      story_id: storyId,
      content: storyContent,
      credits_used: validation.creditsRequired,
      credits_remaining: creditResult.newBalance,
    }, aiResponse.model, { requestId });

  } catch (error) {
    console.error(`[${requestId}] Story generation error:`, error);
    
    // Handle insufficient credits error
    if (error.message?.includes('Insufficient credits')) {
      return ResponseHandler.error('Insufficient credits', 400, { 
        error_code: 'INSUFFICIENT_CREDITS',
        requestId 
      });
    }

    return ResponseHandler.error(
      error.message || 'Failed to generate story', 
      500, 
      { requestId }
    );
  }
});