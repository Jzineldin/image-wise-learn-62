import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslationRequest {
  content: string;
  from_language: string;
  to_language: string;
  content_type?: 'story' | 'segment' | 'title' | 'description';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Parse request body
    const { 
      content, 
      from_language, 
      to_language, 
      content_type = 'story' 
    }: TranslationRequest = await req.json();

    if (!content || !from_language || !to_language) {
      throw new Error('Content, from_language, and to_language are required');
    }

    if (from_language === to_language) {
      return new Response(
        JSON.stringify({
          success: true,
          translated_content: content,
          from_language,
          to_language,
          content_type,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Translate content using AI service (OpenRouter Sonoma Dusk Alpha)
    const aiService = createAIService();
    
    const languageNames = {
      'en': 'English',
      'sv': 'Swedish',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
    };

    const fromLang = languageNames[from_language as keyof typeof languageNames] || from_language;
    const toLang = languageNames[to_language as keyof typeof languageNames] || to_language;

    const systemPrompt = `You are a professional translator specializing in children's literature. Translate content while preserving the tone, style, and age-appropriateness of the original text.`;
    
    const userPrompt = `Translate this children's ${content_type} from ${fromLang} to ${toLang}:

${content}

Requirements:
- Maintain the original tone and style
- Keep age-appropriate language
- Preserve formatting and structure
- Use natural, fluent ${toLang}
- Return ONLY the translated content, no additional text`;

    // Use story-generation for translation (same model, different operation)
    const aiResponse = await aiService.generate('story-generation', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'text',
      temperature: 0.3,
      maxTokens: Math.min(4000, Math.max(500, content.length * 2))
    });

    const translatedContent = aiResponse.content;
    console.log(`Translation completed using ${aiResponse.provider} - ${aiResponse.model}`);

    console.log(`Content translated from ${fromLang} to ${toLang} (${content_type})`);

    return new Response(
      JSON.stringify({
        success: true,
        translated_content: translatedContent,
        from_language,
        to_language,
        content_type,
        original_content: content,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Translation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to translate content',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});