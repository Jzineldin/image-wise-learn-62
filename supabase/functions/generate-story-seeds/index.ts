import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateStorySeedsRequest {
  ageGroup: string;
  genres: string[];
  characters: Array<{
    id: string;
    name: string;
    description: string;
    character_type: string;
    personality_traits: string[];
  }>;
}

interface StorySeed {
  id: string;
  title: string;
  description: string;
}

// AI Service for seeds generation
class SeedsAIService {
  private openAIKey: string;
  private ovhToken: string;

  constructor(openAIKey: string, ovhToken: string) {
    this.openAIKey = openAIKey;
    this.ovhToken = ovhToken;
  }

  async generateSeeds(messages: any[]): Promise<{ seeds: StorySeed[]; model: string }> {
    console.log('Attempting gpt-4o-mini seeds generation...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`gpt-4o-mini failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsedResponse = JSON.parse(content);
      
      if (!parsedResponse.seeds || !Array.isArray(parsedResponse.seeds)) {
        throw new Error('Invalid seeds structure from gpt-4o-mini');
      }
      
      return { seeds: parsedResponse.seeds, model: 'gpt-4o-mini' };
    } catch (error) {
      console.error('gpt-4o-mini failed, trying OVH Llama fallback:', error.message);
      
      try {
        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
        const userPrompt = messages.find(m => m.role === 'user')?.content || '';
        
        const response = await fetch('https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.ovhToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'Meta-Llama-3_3-70B-Instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt + '\n\nReturn only valid JSON with exactly 3 story seeds.' }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OVH Llama API error:', response.status, errorText);
          throw new Error(`OVH Llama failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          if (!parsedResponse.seeds || !Array.isArray(parsedResponse.seeds)) {
            throw new Error('Invalid seeds structure from OVH Llama');
          }
          return { seeds: parsedResponse.seeds, model: 'Meta-Llama-3_3-70B-Instruct' };
        }
        
        throw new Error('No valid JSON found in OVH response');
      } catch (fallbackError) {
        console.error('OVH Llama fallback failed:', fallbackError.message);
        throw new Error(`All AI services failed: ${error.message}, ${fallbackError.message}`);
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const ovhToken = Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN');
    
    if (!openAIApiKey || !ovhToken) {
      throw new Error('AI API keys not configured');
    }

    const { ageGroup, genres, characters }: GenerateStorySeedsRequest = await req.json();

    console.log('Generating story seeds for:', { ageGroup, genres, characters: characters.length });

    // Create character context
    const characterContext = characters.length > 0 
      ? `Characters to include:
${characters.map(char => `- ${char.name}: ${char.description} (${char.character_type}, traits: ${char.personality_traits.join(', ')})`).join('\n')}`
      : 'No specific characters selected - create generic but engaging characters for the stories.';

    // Create genre context
    const genreContext = genres.join(', ');

    // Age-appropriate instructions
    const ageInstructions = {
      '4-6': 'Simple vocabulary, gentle themes, focus on friendship and basic emotions. Stories should be 3-5 sentences for the seed.',
      '7-9': 'Elementary vocabulary, mild adventure themes, problem-solving. Stories should be 4-6 sentences for the seed.',
      '10-12': 'Intermediate vocabulary, more complex adventures, character development. Stories should be 5-7 sentences for the seed.',
      '13+': 'Advanced vocabulary, complex themes, deeper character relationships. Stories should be 6-8 sentences for the seed.'
    };

    const systemPrompt = `You are a creative storytelling AI that generates personalized story seeds for interactive children's stories. 

Your task is to create exactly 3 unique, engaging story seeds that:
1. Are appropriate for ${ageGroup} age group: ${ageInstructions[ageGroup as keyof typeof ageInstructions]}
2. Incorporate the selected genres: ${genreContext}
3. ${characters.length > 0 ? `Feature the provided characters prominently by name and personality` : 'Create engaging characters appropriate for the age group'}
4. Set up an interesting premise that can lead to an interactive, choice-driven story
5. End with a situation that naturally leads to meaningful choices

Each seed should be completely different in plot, setting, and approach. Make them creative and inspiring!

${characterContext}

IMPORTANT: Always reference characters by their actual names if provided. Make the seeds feel personalized to these specific characters.`;

    const userPrompt = `Generate 3 unique story seeds for ${ageGroup} readers in the ${genreContext} genre(s). ${characters.length > 0 ? `Make sure to feature these characters: ${characters.map(c => c.name).join(', ')}` : ''}

Each seed should:
- Have a compelling title (max 6 words)
- Include a brief description that sets up the story premise
- End with a situation that naturally leads to player choices
- Be completely different from the others in terms of plot and setting

Return as a JSON array of exactly 3 seeds with this structure:
{
  "seeds": [
    {
      "id": "seed-1",
      "title": "Adventure Title Here",
      "description": "Story description that ends with a choice-worthy situation..."
    }
  ]
}`;

    const aiService = new SeedsAIService(openAIApiKey, ovhToken);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const { seeds, model } = await aiService.generateSeeds(messages);

    console.log('Successfully generated story seeds:', seeds.length, 'using', model);

    return new Response(JSON.stringify({ 
      seeds,
      model_used: model 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-seeds function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate story seeds'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});