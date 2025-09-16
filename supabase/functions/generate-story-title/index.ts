import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TitleRequest {
  prompt: string;
  genre: string;
  ageGroup: string;
  language?: string;
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

    // Parse request body
    const { prompt, genre, ageGroup, language = 'en' }: TitleRequest = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required for title generation');
    }

    // Generate title using AI service (OpenRouter Sonoma Dusk Alpha) - free operation
    const aiService = createAIService();
    
    const systemPrompt = `You are a creative children's book title generator. Create engaging, age-appropriate titles that capture the essence of the story.`;
    
    const userPrompt = `Generate 3 creative titles for a children's story with these details:
Genre: ${genre}
Age Group: ${ageGroup}
Story Concept: ${prompt}
Language: ${language}

Requirements:
- Age-appropriate for ${ageGroup} year olds
- Catchy and memorable
- Reflects the ${genre} genre
- Each title should be 2-6 words
- Return only the titles, one per line, no numbering`;

    const aiResponse = await aiService.generate('story-titles', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.9
    });

    const titleContent = aiResponse.content;
    console.log(`Titles generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Parse titles from response
    const titles = titleContent
      .split('\n')
      .map(title => title.trim())
      .filter(title => title.length > 0)
      .slice(0, 3); // Ensure only 3 titles

    console.log(`Generated ${titles.length} titles for prompt: ${prompt}`);

    return new Response(
      JSON.stringify({
        success: true,
        titles,
        prompt,
        genre,
        age_group: ageGroup,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Title generation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate titles',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});