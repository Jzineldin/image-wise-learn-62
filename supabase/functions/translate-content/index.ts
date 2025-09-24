import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';
import { CreditService } from '../_shared/credit-system.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';

interface TranslationRequest {
  content: string;
  from_language: string;
  to_language: string;
  content_type?: 'story' | 'segment' | 'title' | 'description';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401);
    }

    // Validate JWT using CreditService
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);
    await creditService.getUserId();

    // Parse and validate request body
    let requestBody: TranslationRequest;
    try {
      requestBody = await req.json();
    } catch {
      return ResponseHandler.error('Invalid JSON in request body', 400);
    }

    const {
      content,
      from_language,
      to_language,
      content_type = 'story'
    } = requestBody;

    if (!content || !from_language || !to_language) {
      return ResponseHandler.error('Content, from_language, and to_language are required', 400);
    }

    if (from_language === to_language) {
      return ResponseHandler.success({
        translated_content: content,
        from_language,
        to_language,
        content_type,
      });
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
    logger.info('Translation completed successfully', { 
      provider: aiResponse.provider, 
      model: aiResponse.model,
      fromLanguage: fromLang,
      toLanguage: toLang,
      contentType: content_type,
      operation: 'ai-generation' 
    });

    return ResponseHandler.success({
      translated_content: translatedContent,
      from_language,
      to_language,
      content_type,
      original_content: content,
    }, aiResponse.model);

  } catch (error) {
    logger.error('Translation failed', error, { operation: 'translate-content' });
    return ResponseHandler.handleError(error, { endpoint: 'translate-content' });
  }
});