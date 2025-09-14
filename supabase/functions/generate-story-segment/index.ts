import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateSegmentRequest {
  storyId: string;
  choiceId: number;
  choiceText: string;
  previousSegmentContent: string;
  storyContext: {
    title: string;
    description: string;
    ageGroup: string;
    genre: string;
    characters: Array<{
      name: string;
      description: string;
      role: string;
    }>;
  };
  segmentNumber: number;
}

interface StorySegment {
  content: string;
  choices: Array<{
    id: number;
    text: string;
    impact: string;
  }>;
  is_ending?: boolean;
}

// AI Service for segment generation
class SegmentAIService {
  private openRouterKey: string;
  private openAIKey: string;
  private ovhToken: string;

  constructor(openRouterKey: string, openAIKey: string, ovhToken: string) {
    this.openRouterKey = openRouterKey;
    this.openAIKey = openAIKey;
    this.ovhToken = ovhToken;
  }

  async generateSegment(messages: any[]): Promise<{ data: StorySegment; model: string }> {
    console.log('Attempting OpenRouter Sonoma Dusk Alpha segment generation...');
    
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
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON from OpenRouter response
      let segmentData;
      try {
        segmentData = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          segmentData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in OpenRouter response');
        }
      }
      
      return { data: segmentData, model: 'openrouter/sonoma-dusk-alpha' };
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
            temperature: 0.8,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "story_segment",
                schema: {
                  type: "object",
                  properties: {
                    content: { type: "string", minLength: 200 },
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
                  required: ["content", "choices"]
                }
              }
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI failed: ${response.status}`);
        }

        const data = await response.json();
        const segmentData = JSON.parse(data.choices[0].message.content);
        return { data: segmentData, model: 'gpt-4o-mini' };
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
                { role: 'user', content: userPrompt + '\n\nReturn only valid JSON.' }
              ],
              max_tokens: 1000,
              temperature: 0.8,
            }),
          });

          if (!response.ok) {
            throw new Error(`OVH Llama failed: ${response.status}`);
          }

          const data = await response.json();
          const content = data.choices[0].message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            const segmentData = JSON.parse(jsonMatch[0]);
            return { data: segmentData, model: 'Meta-Llama-3_3-70B-Instruct' };
          }
          
          throw new Error('No valid JSON found in OVH response');
        } catch (fallbackError) {
          throw new Error(`All AI services failed: ${error.message}, ${openAIError.message}, ${fallbackError.message}`);
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
      storyId,
      choiceId,
      choiceText,
      previousSegmentContent,
      storyContext,
      segmentNumber
    }: GenerateSegmentRequest = await req.json();

    console.log('Segment generation request:', { 
      storyId, 
      choiceId, 
      segmentNumber,
      choiceText: choiceText.substring(0, 50) + '...'
    });

    const aiService = new SegmentAIService(openRouterApiKey, openAIApiKey, ovhToken);

    // Build character description
    const characterDesc = storyContext.characters.map(char => 
      `${char.name} (${char.role}): ${char.description}`
    ).join('\n');

    // Determine if this should be an ending segment (after 4-5 segments typically)
    const shouldBeEnding = segmentNumber >= 4 && Math.random() > 0.4;

    const systemPrompt = `You are a master storyteller continuing an interactive story. Create the next segment based on the user's choice.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON matching the exact schema
2. Content must be 250-400 words
3. Age-appropriate for ${storyContext.ageGroup} audience
4. Build naturally from the previous segment and chosen path
5. ${shouldBeEnding ? 'This should be a satisfying ending to the story' : 'Include a compelling cliffhanger'}
6. ${shouldBeEnding ? 'Set "is_ending": true and provide fewer/final choices' : 'Provide exactly 3 meaningful choices that lead to different directions'}
7. Maintain story consistency and character development
8. NEVER include questions or direct reader address in the story content - story content should be pure narrative
9. ALL questions and interactivity should only appear in the structured choices array
10. Cliffhangers should be dramatic situations or moments, not questions posed to the reader`;

    const userPrompt = `Continue this ${storyContext.genre} story for ${storyContext.ageGroup} age group:

STORY CONTEXT:
Title: ${storyContext.title}
Description: ${storyContext.description}

Characters:
${characterDesc}

PREVIOUS SEGMENT:
${previousSegmentContent}

USER'S CHOICE: ${choiceText}

Continue the story from this choice. ${shouldBeEnding ? 'Create a satisfying conclusion.' : 'Build tension and create a compelling cliffhanger.'} Maintain the story's tone and ensure smooth narrative flow.

IMPORTANT: Write pure narrative content without questions. Instead of ending with "What should they do?" create dramatic moments like "The door creaked open, revealing..." or "Suddenly, three paths appeared before them..." - let the choices provide the interactivity.

Segment Number: ${segmentNumber}
${shouldBeEnding ? 'This should be the final segment.' : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const { data: segmentData, model } = await aiService.generateSegment(messages);

    // Create the segment in the database
    const { data: newSegment, error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id: storyId,
        segment_number: segmentNumber,
        content: segmentData.content,
        choices: segmentData.choices,
        is_ending: segmentData.is_ending || false,
        metadata: {
          generated_from_choice: {
            id: choiceId,
            text: choiceText
          },
          model_used: model,
          generation_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (segmentError) {
      console.error('Database error creating segment:', segmentError);
      throw new Error('Failed to save segment to database');
    }

    // If this is an ending, update the story status
    if (segmentData.is_ending) {
      await supabase
        .from('stories')
        .update({ 
          status: 'completed',
          is_completed: true,
          is_complete: true
        })
        .eq('id', storyId);
    }

    console.log('Segment generated successfully:', newSegment.id);

    return new Response(JSON.stringify({ 
      segment: newSegment,
      model_used: model,
      is_ending: segmentData.is_ending || false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-segment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Segment generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});