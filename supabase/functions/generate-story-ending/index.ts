import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEndingRequest {
  storyId: string;
  currentSegments: Array<{
    segment_number: number;
    content: string;
  }>;
  genre: string;
  ageGroup: string;
  characters?: Array<{ name: string; description: string }>;
}

interface StorySegment {
  content: string;
  choices: never[];
  is_ending: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Generate ending request received');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { storyId, currentSegments, genre, ageGroup, characters }: GenerateEndingRequest = await req.json();

    console.log('Processing story ending for:', storyId);

    // Build the story context from existing segments
    const storyContext = currentSegments
      .sort((a, b) => a.segment_number - b.segment_number)
      .map(s => s.content)
      .join('\n\n');

    // Build character descriptions
    const characterDesc = characters && characters.length > 0 
      ? characters.map(c => `${c.name}: ${c.description}`).join('\n') 
      : 'No specific characters defined';

    // Create the AI prompt for generating an ending
    const systemPrompt = `You are an expert children's story writer specializing in creating satisfying conclusions. Your task is to write a compelling ending segment that:

1. Brings the story to a natural and satisfying conclusion
2. Resolves the main conflicts or adventures presented in the story
3. Is age-appropriate for ${ageGroup} children
4. Matches the ${genre} genre
5. Provides emotional closure and a sense of completion
6. Is engaging and memorable

Write in a narrative style without questions or choices. This is the final segment that concludes the adventure.

IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "content": "The ending narrative content here...",
  "choices": [],
  "is_ending": true
}`;

    const userPrompt = `Story Context (all previous segments):
${storyContext}

Characters:
${characterDesc}

Please write a satisfying conclusion to this ${genre} story for ${ageGroup} children. The ending should:
- Wrap up the adventure naturally
- Give the main character(s) a sense of achievement or growth
- Be emotionally satisfying
- Be approximately 150-250 words
- Match the tone and style of the existing story

Create an ending that feels like a natural conclusion to this adventure.`;

    console.log('Sending request to OpenAI for story ending generation');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Try GPT-4o first, then fallback to GPT-4o-mini
    let response;
    let model = 'gpt-4o';
    
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`GPT-4o failed: ${response.status}`);
      }
    } catch (error) {
      console.log('GPT-4o failed, trying GPT-4o-mini:', error);
      model = 'gpt-4o-mini';
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`Both models failed. GPT-4o-mini error: ${response.status}`);
      }
    }

    const data = await response.json();
    let endingData: StorySegment;
    
    try {
      endingData = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON parsing failed, creating fallback ending');
      // Fallback ending if JSON parsing fails
      endingData = {
        content: data.choices[0].message.content.replace(/^```json\n?|\n?```$/g, ''),
        choices: [],
        is_ending: true
      };
    }

    // Ensure the ending has the correct structure
    if (!endingData.content) {
      throw new Error('Generated ending is missing content');
    }

    // Get the next segment number
    const maxSegmentNumber = Math.max(...currentSegments.map(s => s.segment_number));
    const nextSegmentNumber = maxSegmentNumber + 1;

    console.log('Inserting ending segment into database');

    // Insert the ending segment into the database
    const { data: insertedSegment, error: insertError } = await supabase
      .from('story_segments')
      .insert({
        story_id: storyId,
        segment_number: nextSegmentNumber,
        content: endingData.content,
        choices: [],
        is_ending: true,
        is_end: true,
        metadata: {
          generated_by: 'ai',
          model_used: model,
          generated_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Updating story status to completed');

    // Update story status to completed
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        status: 'completed',
        is_completed: true,
        is_complete: true,
        metadata: {
          completion_date: new Date().toISOString(),
          ending_generated: true,
          ending_model: model
        }
      })
      .eq('id', storyId);

    if (updateError) {
      console.error('Story update error:', updateError);
      throw updateError;
    }

    console.log('Story ending generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        endingSegment: insertedSegment,
        model: model
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-story-ending function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});