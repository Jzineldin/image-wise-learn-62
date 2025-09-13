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
  private openAIKey: string;
  private ovhToken: string;

  constructor(openAIKey: string, ovhToken: string) {
    this.openAIKey = openAIKey;
    this.ovhToken = ovhToken;
  }

  async generateSegment(messages: any[]): Promise<{ data: StorySegment; model: string }> {
    console.log('Attempting GPT-4o segment generation...');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          max_completion_tokens: 1000,
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
        throw new Error(`GPT-4o failed: ${response.status}`);
      }

      const data = await response.json();
      const segmentData = JSON.parse(data.choices[0].message.content);
      return { data: segmentData, model: 'gpt-4o' };
    } catch (error) {
      console.error('GPT-4o failed, trying OVH Llama fallback:', error.message);
      
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
        throw new Error(`All AI services failed: ${error.message}, ${fallbackError.message}`);
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

    const aiService = new SegmentAIService(openAIApiKey, ovhToken);

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
7. Maintain story consistency and character development`;

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