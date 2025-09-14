import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAIService } from '../_shared/ai-service.ts';
import { PromptTemplateManager, FallbackGenerators } from '../_shared/prompt-templates.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';

// ============= TYPES =============

interface GenerateStorySeedsRequest {
  ageGroup: string;
  genres: string[];
  characters: Array<{
    id: string;
    name: string;
    description: string;
    character_type: string;
    personality_traits: string[];
  }>;
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  try {
    // Parse request
    const {
      ageGroup,
      genres,
      characters
    }: GenerateStorySeedsRequest = await req.json();

    console.log('Generating story seeds for:', {
      ageGroup,
      genres,
      charactersCount: characters.length
    });

    // Validate input
    if (!ageGroup || !genres || !Array.isArray(genres) || genres.length === 0) {
      return ResponseHandler.error('Missing required fields: ageGroup, genres', 400);
    }

    // Create AI service
    const aiService = createAIService();

    // Prepare context for prompt generation
    const context = {
      ageGroup,
      genre: genres.join(', '),
      characters: characters.map(char => ({
        name: char.name,
        description: char.description,
        role: char.character_type,
        personality_traits: char.personality_traits
      }))
    };

    // Generate prompt using template
    const promptTemplate = PromptTemplateManager.generateStorySeeds(context);

    // Measure processing time
    const { result, duration } = await withTiming(async () => {
      // Call AI service
      const aiResponse = await aiService.generate('story-seeds', {
        messages: [
          { role: 'system', content: promptTemplate.system },
          { role: 'user', content: promptTemplate.user }
        ],
        responseFormat: 'json',
        schema: promptTemplate.schema
      });

      // Validate and normalize response
      const normalizedData = ResponseHandler.validateAndNormalize(
        aiResponse.content,
        Validators.storySeeds,
        () => FallbackGenerators.generateStorySeeds(context)
      );

      return {
        seeds: normalizedData.seeds,
        model_used: aiResponse.model,
        provider: aiResponse.provider,
        tokensUsed: aiResponse.tokensUsed
      };
    });

    console.log('✅ Story seeds generated successfully:', {
      seedsCount: result.seeds.length,
      model: result.model_used,
      provider: result.provider,
      duration: `${duration}ms`
    });

    return ResponseHandler.success(result, result.model_used, {
      tokensUsed: result.tokensUsed,
      processingTime: duration,
      provider: result.provider
    });

  } catch (error) {
    console.error('❌ Story seeds generation failed:', error);
    
    // Return appropriate error response
    if (error.message.includes('API keys not configured')) {
      return ResponseHandler.error('AI services not configured', 503);
    }
    
    return ResponseHandler.error(
      error.message || 'Failed to generate story seeds',
      500,
      { stack: error.stack }
    );
  }
});