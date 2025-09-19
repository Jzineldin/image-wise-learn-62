import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';
import { CreditService } from '../_shared/credit-system.ts';



interface SeedsRequest {
  genre?: string;
  ageGroup?: string;
  language?: string;
  count?: number;
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
      genre = 'fantasy',
      ageGroup = '7-9',
      language = 'en',
      count = 3
    } = requestBody;

    // Generate story seeds using AI service with timing
    const { result: aiResponse, duration } = await withTiming(async () => {
      const aiService = createAIService();

      const systemPrompt = `You are a creative children's story idea generator. Generate structured story concepts as JSON.`;

      const userPrompt = `Generate exactly ${count} creative story ideas for children's books with these parameters:
Genre: ${genre}
Age Group: ${ageGroup} year olds
Language: ${language}

Requirements:
- Age-appropriate and engaging
- Diverse characters and settings
- Themes of friendship, adventure, learning

Return as JSON: {"seeds": [{"id": "1", "title": "Story Title", "description": "1-2 sentence description"}]}`;

      return await aiService.generate('story-seeds', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        responseFormat: 'json',
        temperature: 0.9
      });
    });

    console.log(`Story seeds generated using ${aiResponse.provider} - ${aiResponse.model} in ${duration}ms`);

    // Validate and normalize AI response
    const validatedResponse = ResponseHandler.validateAndNormalize(
      aiResponse.content,
      Validators.storySeeds,
      () => ({
        seeds: Array.from({ length: count }, (_, i) => ({
          id: `${i + 1}`,
          title: `${genre} Adventure ${i + 1}`,
          description: `An exciting ${genre} adventure perfect for ${ageGroup} year olds.`
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
    console.error('Story seeds generation error:', error);
    return ResponseHandler.handleError(error, { endpoint: 'generate-story-seeds' });
  }
});