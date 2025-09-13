import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  content: string;
  fromLanguage: string;
  toLanguage: string;
  contentType: 'story' | 'segment' | 'title' | 'description';
  storyId?: string;
  segmentId?: string;
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
      content, 
      fromLanguage, 
      toLanguage, 
      contentType,
      storyId,
      segmentId
    }: TranslateRequest = await req.json();

    console.log('Translation request:', { 
      fromLanguage, 
      toLanguage, 
      contentType, 
      contentLength: content.length 
    });

    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for translation');
    }

    // Get target language configuration
    const { data: targetLang, error: langError } = await supabase
      .from('languages')
      .select('ai_model_config, native_name')
      .eq('code', toLanguage)
      .eq('is_active', true)
      .single();

    if (langError) {
      console.error('Target language error:', langError);
      throw new Error(`Target language ${toLanguage} not supported`);
    }

    const langConfig = targetLang.ai_model_config as any;
    const languageName = targetLang.native_name;

    // Build translation prompt based on content type
    let translationPrompt = '';
    
    switch (contentType) {
      case 'story':
        translationPrompt = `Translate this children's story from ${fromLanguage} to ${languageName}. Maintain the storytelling style, age-appropriate language, and emotional tone. Preserve all character names and story structure.\n\nStory:\n${content}`;
        break;
      case 'segment':
        translationPrompt = `Translate this story segment from ${fromLanguage} to ${languageName}. Keep the narrative flow and child-friendly language.\n\nSegment:\n${content}`;
        break;
      case 'title':
        translationPrompt = `Translate this story title from ${fromLanguage} to ${languageName}. Keep it engaging and appropriate for children.\n\nTitle: ${content}`;
        break;
      case 'description':
        translationPrompt = `Translate this story description from ${fromLanguage} to ${languageName}. Maintain the appealing and descriptive nature.\n\nDescription:\n${content}`;
        break;
      default:
        translationPrompt = `Translate the following text from ${fromLanguage} to ${languageName}:\n\n${content}`;
    }

    // Prepare OpenAI request
    const messages = [
      {
        role: 'system',
        content: `You are a professional translator specializing in children's literature. Translate accurately while preserving the storytelling magic, emotional impact, and age-appropriate language. Always respond with ONLY the translated text, no explanations or additional content.`
      },
      {
        role: 'user',
        content: translationPrompt
      }
    ];

    console.log('Calling OpenAI for translation with model:', langConfig.primary_model);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: langConfig.primary_model || 'gpt-4o-mini',
        messages: messages,
        max_completion_tokens: Math.min(2000, content.length * 2), // Allow for language expansion
        temperature: 0.3, // Lower temperature for more consistent translations
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI translation error:', errorText);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    const translatedContent = data.choices[0].message.content.trim();

    console.log('Translation completed successfully');

    // Store translation in database if storyId provided
    if (storyId) {
      if (segmentId) {
        // Store segment translation
        await supabase
          .from('story_segments_i18n')
          .upsert({
            segment_id: segmentId,
            language_code: toLanguage,
            content: translatedContent,
          });
      } else {
        // Store story translation
        if (contentType === 'story') {
          await supabase
            .from('story_content_i18n')
            .upsert({
              story_id: storyId,
              language_code: toLanguage,
              content: { full_text: translatedContent },
            });
        } else if (contentType === 'title' || contentType === 'description') {
          // Update or insert story metadata translation
          const updateData: any = {};
          if (contentType === 'title') updateData.title = translatedContent;
          if (contentType === 'description') updateData.description = translatedContent;
          
          await supabase
            .from('story_content_i18n')
            .upsert({
              story_id: storyId,
              language_code: toLanguage,
              ...updateData,
            });
        }
      }
    }

    return new Response(JSON.stringify({ 
      translatedContent,
      fromLanguage,
      toLanguage,
      contentType,
      originalLength: content.length,
      translatedLength: translatedContent.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Translation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});