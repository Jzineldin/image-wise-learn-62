import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, validateAndDeductCredits } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';
import { PromptTemplateManager } from '../_shared/prompt-templates.ts';

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

    // Validate and deduct credits
    const creditResult = await validateAndDeductCredits(creditService, userId, 'storyGeneration');
    console.log(`[${requestId}] Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

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

    const systemPrompt = `You are a skilled children's story writer creating interactive stories for ${ageGroup} readers in the ${genre} genre. Create engaging opening segments that set up the story world and present meaningful choices for the reader to continue the adventure.
${languageInstructions}${characterRules}`;

    const userPrompt = `Create an opening segment for an interactive ${existingStory.story_type || 'short'} story.

Story prompt/context: ${prompt}
${processedCharacters.length > 0 ? `Use these MAIN PROTAGONISTS (MANDATORY): ${processedCharacters.map(c => c.reference).join(', ')}` : ''}

Requirements:
- Age-appropriate content for ${ageGroup}
- Introduce the setting and make the listed protagonists the clear focus
- End with a cliffhanger or decision point that leads to 2-3 meaningful choices
- Length: 2-3 paragraphs for the opening segment
- The story should continue based on reader choices, not end immediately
- Output language: ${languageCode}

Format your response as:
CONTENT: [story opening content]
CHOICES:
1. [choice 1 - brief description]
2. [choice 2 - brief description]
3. [choice 3 - brief description]`;

    console.log(`[${requestId}] Generating story with AI service...`);
    const aiResponse = await aiService.generate('story-generation', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.8
    });

    const rawContent = aiResponse.content;
    console.log(`[${requestId}] Story generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Parse content and choices
    const contentMatch = rawContent.match(/CONTENT:\s*([\s\S]*?)(?=CHOICES:|$)/);
    const choicesMatch = rawContent.match(/CHOICES:\s*([\s\S]*)/);
    
    const storyContent = contentMatch?.[1]?.trim() || rawContent;
    let choices = [];
    
    if (choicesMatch) {
      const choiceLines = choicesMatch[1].split('\n').filter(line => line.trim());
      choices = choiceLines.map((line, index) => {
        const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
        return {
          id: index + 1,
          text: cleanLine,
          consequences: null
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
        credits_used: (existingStory.credits_used || 0) + creditResult.creditsUsed,
      })
      .eq('id', storyId)
      .select()
      .single();

    if (updateError) {
      console.error(`[${requestId}] Error updating story:`, updateError);
      throw new Error('Failed to update story');
    }

    // Create story segment with content and choices
    const { error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id: storyId,
        segment_number: 1,
        content: storyContent,
        segment_text: storyContent,
        is_ending: choices.length === 0,
        choices: choices
      });

    if (segmentError) {
      console.error(`[${requestId}] Error creating story segment:`, segmentError);
      throw new Error('Failed to save story content');
    }

    console.log(`[${requestId}] Story completed successfully: ${storyId}`);

    return ResponseHandler.success({
      story_id: storyId,
      content: storyContent,
      credits_used: creditResult.creditsUsed,
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