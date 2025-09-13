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
}

interface LanguageConfig {
  primary_model: string;
  fallback_model: string;
  temperature: number;
  system_prompt?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      prompt, 
      ageGroup, 
      genre, 
      characters, 
      languageCode = 'en',
      storyLength = 'medium'
    }: GenerateStoryRequest = await req.json();

    console.log('Story generation request:', { prompt, ageGroup, genre, languageCode, storyLength });

    // Get language configuration
    const { data: language, error: langError } = await supabase
      .from('languages')
      .select('ai_model_config')
      .eq('code', languageCode)
      .eq('is_active', true)
      .single();

    if (langError) {
      console.error('Language config error:', langError);
      throw new Error(`Language ${languageCode} not supported`);
    }

    const langConfig = language.ai_model_config as LanguageConfig;

    // Get prompt template
    const { data: template, error: templateError } = await supabase
      .rpc('get_prompt_template', { 
        template_key: 'story_generation',
        language_code: languageCode 
      });

    if (templateError) {
      console.error('Template error:', templateError);
      throw new Error('Failed to get prompt template');
    }

    // Build the prompt
    let storyPrompt = template || `Create an engaging story for ${ageGroup} age group in the ${genre} genre. The story should be about: ${prompt}. Make it creative, age-appropriate, and include vivid descriptions.`;
    
    // Replace template variables
    storyPrompt = storyPrompt
      .replace(/{age_group}/g, ageGroup)
      .replace(/{genre}/g, genre)
      .replace(/{prompt}/g, prompt);

    // Add character information
    if (characters && characters.length > 0) {
      const characterDesc = characters.map(char => 
        `${char.name} (${char.role}): ${char.description}`
      ).join('\n');
      storyPrompt += `\n\nCharacters to include:\n${characterDesc}`;
    }

    // Add length specification
    const lengthGuide = {
      short: '200-400 words',
      medium: '400-800 words', 
      long: '800-1200 words'
    };
    storyPrompt += `\n\nTarget length: ${lengthGuide[storyLength]}`;

    // Prepare OpenAI request
    const messages = [
      {
        role: 'system',
        content: langConfig.system_prompt || 'You are a creative storyteller who writes engaging, age-appropriate stories for children.'
      },
      {
        role: 'user',
        content: storyPrompt
      }
    ];

    console.log('Calling OpenAI with model:', langConfig.primary_model);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: langConfig.primary_model,
        messages: messages,
        max_completion_tokens: storyLength === 'long' ? 1500 : storyLength === 'medium' ? 1000 : 600,
        temperature: langConfig.temperature || 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      
      // Try fallback model if primary fails
      if (langConfig.fallback_model !== langConfig.primary_model) {
        console.log('Trying fallback model:', langConfig.fallback_model);
        
        const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: langConfig.fallback_model,
            messages: messages,
            max_tokens: storyLength === 'long' ? 1500 : storyLength === 'medium' ? 1000 : 600,
            temperature: langConfig.temperature || 0.8,
          }),
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Both primary and fallback models failed`);
        }

        const fallbackData = await fallbackResponse.json();
        const generatedStory = fallbackData.choices[0].message.content;

        return new Response(JSON.stringify({ 
          story: generatedStory,
          model_used: langConfig.fallback_model,
          language: languageCode 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }
    }

    const data = await response.json();
    const generatedStory = data.choices[0].message.content;

    console.log('Story generated successfully');

    return new Response(JSON.stringify({ 
      story: generatedStory,
      model_used: langConfig.primary_model,
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