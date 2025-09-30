import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';
import { CreditService } from '../_shared/credit-system.ts';
import { logger } from '../_shared/logger.ts';
import { PromptTemplateManager } from '../_shared/prompt-templates.ts';

interface SeedsRequest {
  genre?: string;
  ageGroup?: string;
  language?: string;
  count?: number; // Currently the template returns exactly 3; we normalize to that for now
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
    let requestBody: SeedsRequest;
    try {
      requestBody = await req.json();
    } catch {
      return ResponseHandler.error('Invalid JSON in request body', 400);
    }

    const {
      genre = 'Fantasy',
      ageGroup = '7-9',
      language = 'en',
      count = 3
    } = requestBody;

    // Build centralized prompt using PromptTemplateManager
    const tmpl = PromptTemplateManager.generateStorySeeds({
      ageGroup,
      genre,
      language
    });

    // Generate story seeds using AI service with timing
    const { result: aiResponse, duration } = await withTiming(async () => {
      const aiService = createAIService();
      return await aiService.generate('story-seeds', {
        messages: [
          { role: 'system', content: tmpl.system },
          { role: 'user', content: tmpl.user }
        ],
        responseFormat: 'json',
        schema: tmpl.schema,
        temperature: 0.6
      }, language);  // Pass language code for model selection
    });

    logger.info('Story seeds generated successfully', {
      provider: aiResponse.provider,
      model: aiResponse.model,
      duration,
      operation: 'ai-generation'
    });

    // Validate and normalize AI response
    const validatedResponse = ResponseHandler.validateAndNormalize(
      aiResponse.content,
      Validators.storySeeds,
      () => ({
        seeds: Array.from({ length: 3 }, (_, i) => ({
          id: `seed-${i + 1}`,
          title: `${genre} Adventure ${i + 1}`,
          description: `An exciting ${genre} adventure perfect for ${ageGroup}.`
        }))
      })
    );

    return ResponseHandler.success(
      {
        ...validatedResponse,
        genre,
        age_group: ageGroup,
        language,
        count: validatedResponse.seeds.length
      },
      aiResponse.model,
      { processingTime: duration, tokensUsed: aiResponse.tokensUsed }
    );

  } catch (error) {
    logger.error('Story seeds generation failed', error, { operation: 'story-seeds-generation' });
    return ResponseHandler.handleError(error, { endpoint: 'generate-story-seeds' });
  }
});