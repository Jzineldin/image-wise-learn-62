import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeedsRequest {
  genre?: string;
  ageGroup?: string;
  language?: string;
  count?: number;
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
    const { 
      genre = 'fantasy', 
      ageGroup = '7-9', 
      language = 'en',
      count = 5 
    }: SeedsRequest = await req.json();

    // Generate story seeds using AI service (OpenRouter Sonoma Dusk Alpha) - free operation
    const aiService = createAIService();
    
    const systemPrompt = `You are a creative children's story idea generator. Create engaging, age-appropriate story concepts that spark imagination.`;
    
    const userPrompt = `Generate ${count} creative story ideas for children's books with these parameters:
Genre: ${genre}
Age Group: ${ageGroup}
Language: ${language}

Requirements:
- Age-appropriate for ${ageGroup} year olds
- Engaging and imaginative concepts
- Suitable for the ${genre} genre
- Each idea should be 1-2 sentences
- Include diverse characters and settings
- Focus on themes of friendship, adventure, learning, and growth
- Return only the story ideas, one per line, no numbering`;

    const aiResponse = await aiService.generate('story-seeds', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.9
    });

    const seedsContent = aiResponse.content;
    console.log(`Story seeds generated using ${aiResponse.provider} - ${aiResponse.model}`);

    // Parse seeds from response
    const seeds = seedsContent
      .split('\n')
      .map(seed => seed.trim())
      .filter(seed => seed.length > 0)
      .slice(0, count); // Ensure only requested count

    console.log(`Generated ${seeds.length} story seeds for ${genre}/${ageGroup}`);

    return new Response(
      JSON.stringify({
        success: true,
        seeds,
        genre,
        age_group: ageGroup,
        language,
        count: seeds.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Story seeds generation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate story seeds',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});