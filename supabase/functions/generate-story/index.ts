import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, CREDIT_COSTS, validateAndDeductCredits } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoryRequest {
  title: string;
  genre: string;
  ageGroup: string;
  prompt: string;
  language?: string;
  storyType?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    console.log(`Processing story generation for user: ${userId}`);

    // Parse request body
    const { title, genre, ageGroup, prompt, language = 'en', storyType = 'short' }: StoryRequest = await req.json();

    // Validate and deduct credits
    const creditResult = await validateAndDeductCredits(creditService, userId, 'storyGeneration');
    console.log(`Credits deducted: ${creditResult.creditsUsed}, New balance: ${creditResult.newBalance}`);

    // Generate story using AI service (OpenRouter Sonoma Dusk Alpha)
    const aiService = createAIService();
    
    const systemPrompt = `You are a skilled children's story writer. Create engaging, age-appropriate stories that capture imagination while teaching valuable lessons.`;
    
    const userPrompt = `Create a ${storyType} story for children aged ${ageGroup} in the ${genre} genre.
Title: ${title}
Story prompt: ${prompt}
Language: ${language}

Requirements:
- Age-appropriate content for ${ageGroup} year olds
- Engaging narrative with clear beginning, middle, and end
- Include dialogue and descriptive scenes
- Length: 3-5 paragraphs for short stories
- Return only the story content, no additional formatting`;

    const aiResponse = await aiService.generate('story-generation', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.8
    });

    const storyContent = aiResponse.content;
    console.log(`Story generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Create story record
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        title,
        prompt,
        genre,
        age_group: ageGroup,
        language_code: language,
        story_type: storyType,
        user_id: userId,
        author_id: userId,
        status: 'completed',
        visibility: 'private',
        credits_used: creditResult.creditsUsed,
      })
      .select()
      .single();

    if (storyError) {
      console.error('Error creating story:', storyError);
      throw new Error('Failed to save story');
    }

    // Create story segment with content
    const { error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id: story.id,
        segment_number: 1,
        content: storyContent,
        segment_text: storyContent,
        is_ending: true,
      });

    if (segmentError) {
      console.error('Error creating story segment:', segmentError);
      throw new Error('Failed to save story content');
    }

    console.log(`Story created successfully: ${story.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        story_id: story.id,
        content: storyContent,
        credits_used: creditResult.creditsUsed,
        credits_remaining: creditResult.newBalance,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Story generation error:', error);
    
    // Handle insufficient credits error
    if (error.message?.includes('Insufficient credits')) {
      return new Response(
        JSON.stringify({
          success: false,
          error_code: 'INSUFFICIENT_CREDITS',
          error: error.message,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate story',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});