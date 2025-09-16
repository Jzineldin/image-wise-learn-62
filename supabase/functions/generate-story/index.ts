import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, validateAndDeductCredits } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler } from '../_shared/response-handlers.ts';

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
      throw new Error('No authorization header');
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
    
    let characterContext = '';
    if (characters.length > 0) {
      characterContext = `\n\nMain characters to include:
${characters.map(c => `- ${c.name}: ${c.description} (Personality: ${c.personality})`).join('\n')}`;
    }
    
    const systemPrompt = `You are a skilled children's story writer. Create engaging, age-appropriate stories that capture imagination while teaching valuable lessons. Write complete stories with clear beginnings, middles, and ends.`;
    
    const userPrompt = `Create a ${existingStory.story_type || 'short'} story for children aged ${ageGroup} in the ${genre} genre.

Story prompt: ${prompt}
Language: ${languageCode}${characterContext}

Requirements:
- Age-appropriate content for ${ageGroup} year olds
- Engaging narrative with clear beginning, middle, and end
- Include dialogue and descriptive scenes
- Length: 3-5 paragraphs for short stories, longer for other types
- Return only the story content, no additional formatting`;

    console.log(`[${requestId}] Generating story with AI service...`);
    const aiResponse = await aiService.generate('story-generation', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.8
    });

    const storyContent = aiResponse.content;
    console.log(`[${requestId}] Story generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Update story status and credits
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update({
        status: 'completed',
        credits_used: (existingStory.credits_used || 0) + creditResult.creditsUsed,
      })
      .eq('id', storyId)
      .select()
      .single();

    if (updateError) {
      console.error(`[${requestId}] Error updating story:`, updateError);
      throw new Error('Failed to update story');
    }

    // Create story segment with content
    const { error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id: storyId,
        segment_number: 1,
        content: storyContent,
        segment_text: storyContent,
        is_ending: true,
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