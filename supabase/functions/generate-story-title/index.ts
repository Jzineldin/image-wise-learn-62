import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';
import { CreditService } from '../_shared/credit-system.ts';
import { logger } from '../_shared/logger.ts';



interface TitleRequest {
  prompt: string;
  genre: string;
  ageGroup: string;
  language?: string;
}

Deno.serve(async (req) => {
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
    let requestBody: TitleRequest;
    try {
      requestBody = await req.json();
    } catch {
      return ResponseHandler.error('Invalid JSON in request body', 400);
    }

    const { prompt, genre, ageGroup, language = 'en' } = requestBody;

    if (!prompt?.trim()) {
      return ResponseHandler.error('Prompt is required for title generation', 400);
    }

    // Generate titles using AI service with timing
    const { result: aiResponse, duration } = await withTiming(async () => {
      const aiService = createAIService();

      const systemPrompt = `You are a creative children's book title generator. Generate structured title suggestions as JSON.`;

      const userPrompt = `Generate exactly 3 creative titles for a children's story:

Genre: ${genre}
Age Group: ${ageGroup} year olds
Story Concept: ${prompt}
Language: ${language}

Requirements:
- Age-appropriate and catchy
- 2-6 words each
- Reflects the ${genre} genre

Return as JSON: {"titles": ["Title 1", "Title 2", "Title 3"], "recommended": "Title 1"}`;

      return await aiService.generate('story-titles', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        responseFormat: 'json',
        temperature: 0.9
      }, language);  // Pass language code for model selection
    });

    logger.info('Titles generated successfully', { 
      provider: aiResponse.provider, 
      model: aiResponse.model, 
      duration, 
      operation: 'ai-generation' 
    });

    // Validate and normalize AI response
    const validatedResponse = ResponseHandler.validateAndNormalize(
      aiResponse.content,
      Validators.storyTitles,
      () => ({
        titles: [`${genre} Adventure`, `The ${ageGroup} Quest`, `Magical Journey`],
        recommended: `${genre} Adventure`
      })
    );

    return ResponseHandler.success(
      {
        ...validatedResponse,
        prompt,
        genre,
        age_group: ageGroup
      },
      aiResponse.model,
      { processingTime: duration, tokensUsed: aiResponse.tokensUsed }
    );

  } catch (error) {
    logger.error('Title generation failed', error, { operation: 'title-generation' });
    return ResponseHandler.handleError(error, { endpoint: 'generate-story-title' });
  }
});