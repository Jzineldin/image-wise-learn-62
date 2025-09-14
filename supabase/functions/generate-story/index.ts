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
  private openRouterKey: string;
  private openAIKey: string;
  private ovhToken: string;

  constructor(openRouterKey: string, openAIKey: string, ovhToken: string) {
    this.openRouterKey = openRouterKey;
    this.openAIKey = openAIKey;
    this.ovhToken = ovhToken;
  }

  async generateWithGPT4o(messages: any[], temperature = 0.7, isInitialGeneration = false): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 2000,
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
                          },
                          minItems: 3,
                          maxItems: 3
                        },
                        is_ending: { type: "boolean" }
                      },
                      required: ["segment_number", "content", "choices"]
                    },
                    minItems: 1,
                    maxItems: isInitialGeneration ? 1 : 5
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

  async generateWithOpenRouter(messages: any[], temperature = 0.7): Promise<any> {
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
        max_tokens: 2000,
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter failed: ${response.status}`);
    }

    return await response.json();
  }

  async generateStory(messages: any[], temperature = 0.7, isInitialGeneration = false): Promise<{ data: StoryResponse; model: string }> {
    console.log('Attempting OpenRouter Sonoma Dusk Alpha generation...');
    
    try {
      const response = await this.generateWithOpenRouter(messages, temperature);
      const content = response.choices[0].message.content;
      
      // Parse JSON from OpenRouter response
      let storyData;
      try {
        storyData = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          storyData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in OpenRouter response');
        }
      }
      
      return { data: storyData, model: 'openrouter/sonoma-dusk-alpha' };
    } catch (error) {
      console.error('OpenRouter failed, trying OpenAI fallback:', error.message);
      
      try {
        const response = await this.generateWithGPT4o(messages, temperature, isInitialGeneration);
        const storyData = JSON.parse(response.choices[0].message.content);
        return { data: storyData, model: 'gpt-4o-mini' };
      } catch (openAIError) {
        console.error('OpenAI failed, trying OVH Llama fallback:', openAIError.message);
        
        try {
          const response = await this.generateWithOVHLlama(messages, temperature);
          return { data: response.choices[0].message.content, model: 'Meta-Llama-3_3-70B-Instruct' };
        } catch (fallbackError) {
          console.error('All AI services failed:', fallbackError.message);
          throw new Error(`All AI services failed. OpenRouter: ${error.message}, OpenAI: ${openAIError.message}, OVH: ${fallbackError.message}`);
        }
      }
    }
  }
}

serve(async (req) => {
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

    console.log('Story generation request:', { prompt, ageGroup, genre, languageCode, storyLength, isInitialGeneration });

    const aiService = new AIService(openRouterApiKey, openAIApiKey, ovhToken);

    // Build enhanced prompt for structured story generation
    const characterDesc = characters?.map(char => 
      `${char.name} (${char.role}): ${char.description}`
    ).join('\n') || '';

    const lengthSpec = {
      short: '150-250 words per segment',
      medium: '250-400 words per segment', 
      long: '400-600 words per segment'
    }[storyLength];

    // Determine if this is initial generation (first segment only) or full story
    const segmentInstruction = isInitialGeneration 
      ? 'Generate ONLY the first segment of the story with 3 meaningful choices for how the story can continue.'
      : `Generate a complete story with ${storyLength === 'short' ? '2-3' : storyLength === 'medium' ? '3-4' : '4-5'} segments.`;

    const systemPrompt = `You are a master storyteller who creates engaging, interactive stories for children. 

${isInitialGeneration ? `
CRITICAL: You are generating ONLY the FIRST SEGMENT of an interactive story.

REQUIREMENTS FOR FIRST SEGMENT:
1. Return JSON with title, description, and EXACTLY ONE segment
2. The segment must be ${lengthSpec} and end on a compelling cliffhanger
3. Include exactly 3 meaningful choices that lead to very different story directions
4. DO NOT resolve the main conflict - this is just the beginning
5. Age-appropriate for ${ageGroup} audience
6. Include vivid, descriptive language that sets up the story world
7. Make choices that significantly impact future story direction
8. Set "is_ending": false for this segment
9. NEVER include questions or direct reader address in the story content - story content should be pure narrative
10. ALL questions and interactivity should only appear in the structured choices array
` : `
REQUIREMENTS FOR COMPLETE STORY:
1. Return JSON with title, description, and multiple segments
2. Each segment must be ${lengthSpec}
3. Each segment (except the last) must have exactly 3 choices
4. Age-appropriate for ${ageGroup} audience
5. Include vivid, descriptive language
6. Choices should lead to meaningfully different story directions
7. Mark the final segment with "is_ending": true
8. NEVER include questions or direct reader address in the story content - story content should be pure narrative
9. ALL questions and interactivity should only appear in the structured choices array
`}`;

    const userPrompt = isInitialGeneration ? `Create the opening segment of an interactive ${genre} story for ${ageGroup} age group.

Story premise: ${prompt}

Characters to include:
${characterDesc}

Requirements:
- Create an engaging opening that sets up the story world and introduces the main character(s)
- Length: ${lengthSpec}
- End with a compelling situation that requires a choice
- The 3 choices should lead to meaningfully different story paths
- Include rich sensory details and emotional setup
- Leave the main adventure/conflict unresolved - this is just the beginning
- NEVER include questions in the story content itself - only pure narrative storytelling
- Questions like "What should they do?" belong only in the choices, not in the story text

Generate the story opening with title, description, and the first segment with choices.` : `Create a complete interactive ${genre} story for ${ageGroup} age group.

Story premise: ${prompt}

Characters to include:
${characterDesc}

Requirements:
- Complete story with multiple segments
- Each segment: ${lengthSpec}
- Create compelling cliffhangers between segments
- Make choices that significantly impact the story direction
- Include rich sensory details and emotional moments
- Ensure age-appropriate content and themes
- NEVER include questions in the story content itself - only pure narrative storytelling
- Questions like "What should they do?" belong only in the choices, not in the story text

Generate a complete story structure with title, description, and multiple segments with choices.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const { data: storyData, model } = await aiService.generateStory(messages, 0.8, isInitialGeneration);

    console.log('Story generated successfully with model:', model);

    // Ensure consistent property names and structure with robust normalization
    const candidates: any[] = [];
    try {
      const sd: any = storyData || {};
      if (Array.isArray(sd.segments)) candidates.push(sd.segments);
      if (Array.isArray(sd.segment)) candidates.push(sd.segment);
      if (sd.segment && typeof sd.segment === 'object' && !Array.isArray(sd.segment)) candidates.push([sd.segment]);
      ['chapters','parts','items','entries'].forEach((k) => {
        const v = sd[k];
        if (Array.isArray(v)) candidates.push(v);
      });
      // Pick the first array that looks like segments (objects with content/text)
      let chosen: any[] | null = candidates.find((arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object' && (('content' in arr[0]) || ('text' in arr[0]) || ('segment' in arr[0])) ) || null;
      if (!chosen && sd.content) {
        chosen = [{ content: sd.content }];
      }

      const normalizedSegments = (chosen || []).map((seg: any, idx: number) => {
        const content = seg.content || seg.text || seg.segment || '';
        const rawChoices = Array.isArray(seg.choices)
          ? seg.choices
          : Array.isArray(seg.options)
            ? seg.options
            : [];
        const choices = rawChoices.map((c: any, i: number) => ({
          id: c?.id ?? (i + 1),
          text: c?.text ?? c?.label ?? '',
          impact: c?.impact ?? c?.outcome ?? ''
        }));
        const segment_number = seg.segment_number ?? seg.number ?? seg.index ?? (idx + 1);
        const is_ending = seg.is_ending ?? seg.isEnding ?? false;
        return { segment_number, content, choices, is_ending };
      });

      console.log(`Normalized segments count: ${normalizedSegments.length}`);

      const normalizedStoryData = {
        title: sd.title || 'Untitled Story',
        description: sd.description || '',
        segments: normalizedSegments,
        model_used: model,
        language: languageCode
      };

      return new Response(JSON.stringify(normalizedStoryData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (normErr) {
      console.error('Normalization error:', normErr);
      const fallback = {
        title: storyData?.title || 'Untitled Story',
        description: storyData?.description || '',
        segments: [],
        model_used: model,
        language: languageCode
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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