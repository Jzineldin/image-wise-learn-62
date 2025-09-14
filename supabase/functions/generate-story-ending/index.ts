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
    
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const ovhToken = Deno.env.get('OVH_AI_ENDPOINTS_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openRouterApiKey || !openAIApiKey || !ovhToken || !supabaseUrl || !supabaseServiceKey) {
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

    // Age-specific word count requirements for endings
    const getEndingWordCount = (age: string) => {
      if (age === '4-6 years') return '25-50 words';
      if (age === '7-9 years') return '80-120 words';
      if (age === '10-12 years') return '120-180 words';
      return '200-350 words'; // 13+ years
    };

    // Create the AI prompt for generating an ending with enhanced age-appropriate context
    const systemPrompt = `You are a master children's story writer with deep expertise in developmental psychology and age-appropriate literature. Your task is to create a perfect ending that provides satisfying closure for ${ageGroup} readers.

CRITICAL AGE-SPECIFIC REQUIREMENTS FOR ${ageGroup}:

WORD COUNT: Content must be exactly ${getEndingWordCount(ageGroup)}
- This is NON-NEGOTIABLE for age appropriateness. Count every word carefully.
- 4-6 years: Simple, clear resolution with basic emotions
- 7-9 years: More detailed conclusion with character satisfaction
- 10-12 years: Rich ending with character growth and lesson learned
- 13+ years: Sophisticated conclusion with deeper meaning and character transformation

VOCABULARY & LANGUAGE STANDARDS FOR ${ageGroup}:
- 4-6 years: Use simple, concrete words. Short sentences (4-7 words). Present tense. Basic emotions (happy, proud, safe).
- 7-9 years: Descriptive adjectives. Medium sentences (6-10 words). Simple past/present tense. Feelings of accomplishment and friendship.
- 10-12 years: Rich vocabulary with some challenging words. Varied sentence length. Complex emotions and personal growth.
- 13+ years: Advanced vocabulary. Complex sentence structures. Sophisticated themes of identity, purpose, and transformation.

ENDING QUALITY STANDARDS:
1. Brings the story to a natural and satisfying conclusion appropriate for ${ageGroup}
2. Resolves the main conflicts or adventures at the comprehension level of ${ageGroup}
3. Matches the ${genre} genre conventions while staying age-appropriate
4. Provides emotional closure and sense of completion suitable for developmental stage
5. Is engaging and memorable for ${ageGroup} readers
6. Shows character growth appropriate for age level
7. Reinforces positive themes and values

GENRE-SPECIFIC CLOSURE FOR ${genre.toUpperCase()}:
- Adventure: Successful completion of quest/journey with sense of accomplishment
- Fantasy: Restoration of magical balance or return to normal world with new wisdom
- Mystery: Satisfying revelation of solution with characters feeling clever and proud
- Friendship: Strengthened bonds and mutual understanding between characters
- Educational: Clear demonstration of lesson learned or skill mastered

EMOTIONAL RESOLUTION BY AGE:
- 4-6 years: Simple positive emotions, safety, comfort, basic pride in achievement
- 7-9 years: Satisfaction from overcoming challenges, stronger friendships, basic life lessons
- 10-12 years: Personal growth, increased confidence, understanding of self and others
- 13+ years: Complex emotional maturity, philosophical insights, character transformation

DEVELOPMENTAL CONSIDERATIONS:
- 4-6 years: Focus on immediate, concrete outcomes and basic cause-and-effect
- 7-9 years: Include simple moral lessons and the value of perseverance/cooperation  
- 10-12 years: Address themes of responsibility, empathy, and personal capability
- 13+ years: Explore identity, purpose, and sophisticated moral/ethical growth

Write in pure narrative style without questions or choices. This is the final, conclusive segment.

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

Please write a perfect conclusion to this ${genre} story for ${ageGroup} children. The ending must:
- Be exactly ${getEndingWordCount(ageGroup)} (COUNT EVERY WORD - this is critical for age appropriateness)
- Wrap up the adventure naturally at the ${ageGroup} comprehension level
- Give the main character(s) age-appropriate achievement or growth
- Be emotionally satisfying for ${ageGroup} developmental stage
- Match the tone and style of the existing story
- Provide closure suitable for ${ageGroup} attention span and emotional maturity
- Use vocabulary and sentence structure perfect for ${ageGroup}
- Reinforce positive themes appropriate for this age group

SPECIFIC ENDING GOALS FOR ${ageGroup}:
${ageGroup === '4-6 years' ? '- Simple, happy resolution where characters feel safe and proud\n- Basic lesson about friendship, kindness, or trying your best\n- Concrete, immediate positive outcomes' : ''}${ageGroup === '7-9 years' ? '- Clear victory or positive outcome from characters\' efforts\n- Lesson about cooperation, perseverance, or being brave\n- Characters feeling accomplished and closer as friends' : ''}${ageGroup === '10-12 years' ? '- Character growth through overcoming meaningful challenges\n- Deeper understanding of self and relationships\n- Sense of increased capability and confidence' : ''}${ageGroup === '13+ years' ? '- Sophisticated character transformation and self-discovery\n- Complex emotional resolution and philosophical growth\n- Themes of identity, purpose, and mature understanding' : ''}

Create an ending that feels like the perfect natural conclusion to this adventure, precisely calibrated for ${ageGroup} readers.`;

    console.log('Sending request to OpenAI for story ending generation');

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Try OpenRouter first, then OpenAI, then OVH as fallbacks
    let response;
    let model = 'openrouter/sonoma-dusk-alpha';
    
    try {
      console.log('Trying OpenRouter Sonoma Dusk Alpha for ending generation...');
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://taleforge.app',
          'X-Title': 'Tale Forge - AI Story Generator'
        },
        body: JSON.stringify({
          model: 'openrouter/sonoma-dusk-alpha',
          messages,
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter failed: ${response.status}`);
      }
    } catch (error) {
      console.log('OpenRouter failed, trying OpenAI fallback:', error);
      model = 'gpt-4o-mini';
      
      try {
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
          throw new Error(`OpenAI failed: ${response.status}`);
        }
      } catch (openAIError) {
        console.log('OpenAI failed, trying OVH Llama fallback:', openAIError);
        model = 'Meta-Llama-3_3-70B-Instruct';
        
        const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
        const userPrompt = messages.find(m => m.role === 'user')?.content || '';
        
        response = await fetch('https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ovhToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'Meta-Llama-3_3-70B-Instruct',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt + '\n\nReturn only valid JSON.' }
            ],
            temperature: 0.8,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error(`All AI services failed. OVH error: ${response.status}`);
        }
      }
    }

    const data = await response.json();
    let endingData: StorySegment;
    
    try {
      const content = data.choices[0].message.content;
      
      // Handle different response formats based on the model used
      if (model === 'openrouter/sonoma-dusk-alpha' || model === 'Meta-Llama-3_3-70B-Instruct') {
        // For OpenRouter and OVH, try to extract JSON from the response
        try {
          endingData = JSON.parse(content);
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            endingData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      } else {
        // For OpenAI with json_object format
        endingData = JSON.parse(content);
      }
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