import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createAIService, normalizeResponse } from '../_shared/ai-service.ts';
import { PromptTemplateManager, FallbackGenerators } from '../_shared/prompt-templates.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';

// ============= TYPES =============

interface GenerateTitleRequest {
  storyContent: string;
  ageGroup: string;
  genre: string;
  characters?: Array<{
    name: string;
    role: string;
  }>;
  currentTitle?: string;
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
      storyContent,
      ageGroup,
      genre,
      characters = [],
      currentTitle
    }: GenerateTitleRequest = await req.json();

    console.log('Generating story titles:', {
      contentLength: storyContent.length,
      ageGroup,
      genre,
      charactersCount: characters.length
    });

    // Validate input
    if (!storyContent || !ageGroup || !genre) {
      return ResponseHandler.error('Missing required fields: storyContent, ageGroup, genre', 400);
    }

    // Create AI service
    const aiService = createAIService();

    // Prepare context for prompt generation
    const context = {
      ageGroup,
      genre,
      storyContent,
      currentTitle,
      characters: characters.map(char => ({
        name: char.name,
        role: char.role
      }))
    };

    // Generate prompt using template
    const promptTemplate = PromptTemplateManager.generateStoryTitles(context);

    // Measure processing time
    const { result, duration } = await withTiming(async () => {
      // Call AI service
      const aiResponse = await aiService.generate('story-titles', {
        messages: [
          { role: 'system', content: promptTemplate.system },
          { role: 'user', content: promptTemplate.user }
        ],
        responseFormat: 'json',
        schema: promptTemplate.schema,
        temperature: 0.9 // Higher creativity for titles
      });

      // Validate and normalize response
      const normalizedData = normalizeResponse(
        aiResponse.content,
        Validators.storyTitles,
        () => FallbackGenerators.generateStoryTitles(context)
      );

      return {
        titles: normalizedData.titles,
        recommended: normalizedData.recommended,
        model_used: aiResponse.model,
        provider: aiResponse.provider,
        tokensUsed: aiResponse.tokensUsed
      };
    });

    console.log('✅ Story titles generated successfully:', {
      titlesCount: result.titles.length,
      recommended: result.recommended,
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
    console.error('❌ Story title generation failed:', error);

    // Return appropriate error response
    if (error.message.includes('API keys not configured')) {
      return ResponseHandler.error('AI services not configured', 503);
    }

    return ResponseHandler.error(
      error.message || 'Title generation failed',
      500,
      { stack: error.stack }
    );
  }
});