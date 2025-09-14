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
  private openRouterKey: string;
  private openAIKey: string;
  private ovhToken: string;

  constructor(openRouterKey: string, openAIKey: string, ovhToken: string) {
    this.openRouterKey = openRouterKey;
    this.openAIKey = openAIKey;
    this.ovhToken = ovhToken;
  }

  async generateSeeds(messages: any[]): Promise<{ seeds: StorySeed[]; model: string }> {
    console.log('Attempting OpenRouter Sonoma Dusk Alpha seeds generation...');
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://taleforge.app',
          'X-Title': 'Tale Forge - AI Story Generator'
        },
        body: JSON.stringify({
          model: 'openrouter/sonoma-dusk-alpha',
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON from OpenRouter response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in OpenRouter response');
        }
      }
      
      if (!parsedResponse.seeds || !Array.isArray(parsedResponse.seeds)) {
        throw new Error('Invalid seeds structure from OpenRouter');
      }
      
      return { seeds: parsedResponse.seeds, model: 'openrouter/sonoma-dusk-alpha' };
    } catch (error) {
      console.error('OpenRouter failed, trying OpenAI fallback:', error.message);
      
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
          throw new Error(`OpenAI failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsedResponse = JSON.parse(content);
        
        if (!parsedResponse.seeds || !Array.isArray(parsedResponse.seeds)) {
          throw new Error('Invalid seeds structure from OpenAI');
        }
        
        return { seeds: parsedResponse.seeds, model: 'gpt-4o-mini' };
      } catch (openAIError) {
        console.error('OpenAI failed, trying OVH Llama fallback:', openAIError.message);
        
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
          throw new Error(`All AI services failed: ${error.message}, ${openAIError.message}, ${fallbackError.message}`);
        }
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
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const ovhToken = Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN');
    
    if (!openRouterApiKey || !openAIApiKey || !ovhToken) {
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

    // Age-appropriate instructions for concise seeds (1-2 sentences max)
    const ageInstructions = {
      '4-6': 'Very simple words, gentle themes, familiar settings. Seeds must be exactly 1 sentence, maximum 15 words.',
      '7-9': 'Elementary vocabulary, mild adventure themes. Seeds must be 1-2 sentences, maximum 25 words total.',
      '10-12': 'Intermediate vocabulary, adventure themes. Seeds must be 1-2 sentences, maximum 30 words total.',
      '13+': 'Advanced vocabulary, complex themes. Seeds must be 1-2 sentences, maximum 35 words total.'
    };

    // Age-specific vocabulary and themes
    const ageGuidelines = {
      '4-6': {
        vocabulary: 'simple, familiar words like "friend," "play," "help," "happy"',
        themes: 'friendship, family, pets, playgrounds, home',
        complexity: 'one clear problem or adventure'
      },
      '7-9': {
        vocabulary: 'elementary words like "discover," "adventure," "mystery," "brave"', 
        themes: 'school, nature, mild mysteries, teamwork',
        complexity: 'simple problems with clear solutions'
      },
      '10-12': {
        vocabulary: 'intermediate words like "challenge," "quest," "courage," "friendship"',
        themes: 'friendship challenges, adventures, self-discovery',
        complexity: 'meaningful choices and consequences'
      },
      '13+': {
        vocabulary: 'advanced words like "destiny," "conflict," "transformation," "dilemma"',
        themes: 'identity, complex relationships, moral choices',
        complexity: 'nuanced problems with multiple solutions'
      }
    };

    const ageGuide = ageGuidelines[ageGroup as keyof typeof ageGuidelines] || ageGuidelines['10-12'];

    const systemPrompt = `You are a creative storytelling AI that generates ultra-concise story seeds for interactive children's stories.

CRITICAL REQUIREMENTS:
1. Each seed description must be ${ageInstructions[ageGroup as keyof typeof ageInstructions]}
2. Use ${ageGuide.vocabulary} appropriate for ${ageGroup} readers
3. Focus on ${ageGuide.themes} and ${ageGuide.complexity}
4. Incorporate the selected genres: ${genreContext}
5. ${characters.length > 0 ? `Feature these characters prominently: ${characters.map(c => c.name).join(', ')}` : 'Create engaging characters appropriate for the age group'}
6. Set up ONE clear premise that leads to choices
7. NO detailed explanations - just the core exciting premise
8. Each seed must be completely different in plot and setting

${characterContext}

WORD COUNT IS CRITICAL: Count every word in each description. Do not exceed the limits.

GOOD EXAMPLES:
- 4-6: "${characters.length > 0 ? characters[0].name : 'Maya'} finds a talking rabbit in her backyard."
- 7-9: "${characters.length > 0 ? characters[0].name : 'Alex'} discovers a secret door behind the school library that glows with mysterious light."
- 10-12: "${characters.length > 0 ? characters[0].name : 'Sam'} receives a cryptic message from the future. Time is running out to prevent disaster."
- 13+: "${characters.length > 0 ? characters[0].name : 'Jordan'} inherits a mansion with rooms that change based on the visitor's deepest fears and desires."`;

    const userPrompt = `Generate 3 unique story seeds for ${ageGroup} readers in the ${genreContext} genre(s). ${characters.length > 0 ? `Feature these characters: ${characters.map(c => c.name).join(', ')}` : ''}

CRITICAL REQUIREMENTS:
- Title: Maximum 4 words, exciting and age-appropriate
- Description: ${ageInstructions[ageGroup as keyof typeof ageInstructions]}
- Use ${ageGuide.vocabulary} and focus on ${ageGuide.themes}
- Each description sets up ${ageGuide.complexity}
- NO extra details, explanations, or setup - just the core premise
- Be completely different from each other in plot and setting

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

    const aiService = new SeedsAIService(openRouterApiKey, openAIApiKey, ovhToken);

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