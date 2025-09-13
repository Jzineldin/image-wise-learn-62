import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateStoryRequest {
  prompt: string;
  ageGroup: string;
  genre: string;
  characters: Array<{
    name: string;
    description: string;
    role: string;
  }>;
  languageCode?: string;
  storyLength?: 'short' | 'medium' | 'long';
  isInitialGeneration?: boolean;
}

interface StorySegment {
  segment_number: number;
  content: string;
  choices: Array<{
    id: number;
    text: string;
    impact: string;
  }>;
  is_ending?: boolean;
}

interface StoryResponse {
  title: string;
  description: string;
  segments: StorySegment[];
  model_used: string;
  language: string;
}

// AI Service abstraction for easy vendor switching
class AIService {
  private openAIKey: string;
  private ovhToken: string;

  constructor(openAIKey: string, ovhToken: string) {
    this.openAIKey = openAIKey;
    this.ovhToken = ovhToken;
  }

  async generateWithGPT4o(messages: any[], temperature = 0.7): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_completion_tokens: 2000,
        temperature,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "story_response",
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                segments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      segment_number: { type: "integer" },
                      content: { type: "string", minLength: 150 },
                      choices: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "integer" },
                            text: { type: "string" },
                            impact: { type: "string" }
                          },
                          required: ["id", "text", "impact"]
                        }
                      },
                      is_ending: { type: "boolean" }
                    },
                    required: ["segment_number", "content", "choices"]
                  }
                }
              },
              required: ["title", "description", "segments"]
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT-4o failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async generateWithOVHLlama(messages: any[], temperature = 0.7): Promise<any> {
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
          { role: 'user', content: userPrompt + '\n\nIMPORTANT: Return only valid JSON matching the story response format.' }
        ],
        max_tokens: 2000,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OVH Llama failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Parse JSON response from OVH
    try {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { choices: [{ message: { content: JSON.parse(jsonMatch[0]) } }] };
      }
      throw new Error('No valid JSON found in response');
    } catch (parseError) {
      throw new Error(`Failed to parse OVH response: ${parseError.message}`);
    }
  }

  async generateStory(messages: any[], temperature = 0.7): Promise<{ data: StoryResponse; model: string }> {
    console.log('Attempting GPT-4o generation...');
    
    try {
      const response = await this.generateWithGPT4o(messages, temperature);
      const storyData = JSON.parse(response.choices[0].message.content);
      return { data: storyData, model: 'gpt-4o' };
    } catch (error) {
      console.error('GPT-4o failed, trying OVH Llama fallback:', error.message);
      
      try {
        const response = await this.generateWithOVHLlama(messages, temperature);
        return { data: response.choices[0].message.content, model: 'Meta-Llama-3_3-70B-Instruct' };
      } catch (fallbackError) {
        console.error('Both AI services failed:', fallbackError.message);
        throw new Error(`All AI services failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const ovhToken = Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN');
    
    if (!openAIApiKey || !ovhToken) {
      throw new Error('AI API keys not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      prompt, 
      ageGroup, 
      genre, 
      characters, 
      languageCode = 'en',
      storyLength = 'medium',
      isInitialGeneration = true
    }: GenerateStoryRequest = await req.json();

    console.log('Story generation request:', { prompt, ageGroup, genre, languageCode, storyLength });

    const aiService = new AIService(openAIApiKey, ovhToken);

    // Build enhanced prompt for structured story generation
    const characterDesc = characters?.map(char => 
      `${char.name} (${char.role}): ${char.description}`
    ).join('\n') || '';

    const lengthSpec = {
      short: '150-250 words per segment, 2-3 segments',
      medium: '250-400 words per segment, 3-4 segments', 
      long: '400-600 words per segment, 4-5 segments'
    }[storyLength];

    const systemPrompt = `You are a master storyteller who creates engaging, interactive stories for children. Create stories with multiple segments where each segment ends with meaningful choices that lead to different story paths.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON matching the exact schema
2. Each segment must be ${lengthSpec}
3. Age-appropriate for ${ageGroup} audience
4. Include vivid, descriptive language
5. Each segment must have exactly 3 choices
6. Choices should lead to meaningfully different story directions
7. Mark the final segment with "is_ending": true`;

    const userPrompt = `Create an interactive ${genre} story for ${ageGroup} age group.

Story premise: ${prompt}

Characters to include:
${characterDesc}

Requirements:
- Target length: ${lengthSpec}
- Create compelling cliffhangers between segments
- Make choices that significantly impact the story direction
- Include rich sensory details and emotional moments
- Ensure age-appropriate content and themes

Generate a complete story structure with title, description, and multiple segments with choices.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const { data: storyData, model } = await aiService.generateStory(messages, 0.8);

    console.log('Story generated successfully with model:', model);

    return new Response(JSON.stringify({ 
      ...storyData,
      model_used: model,
      language: languageCode 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Story generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});