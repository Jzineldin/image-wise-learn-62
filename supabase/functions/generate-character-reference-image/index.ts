import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CreditService, validateCredits, deductCreditsAfterSuccess } from '../_shared/credit-system.ts';
import { createImageService } from '../_shared/image-service.ts';
import { ResponseHandler, ERROR_CODES } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { InputValidator, InputSanitizer, RateLimiter, SecurityAuditor } from '../_shared/validation.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { PromptTemplateManager } from '../_shared/prompt-templates.ts';

interface CharacterImageRequest {
  character_id: string;
  character_name: string;
  character_description: string;
  character_type: string;
  age_group?: string;
  backstory?: string;
  personality_traits?: string[];
}

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  let userId: string | null = null;
  let creditsRequired = 0;

  try {
    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.AUTHENTICATION_FAILED,
        'Authorization header required'
      );
    }

    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);
    const imageService = createImageService();

    // Get user ID
    userId = await creditService.getUserId();
    logger.info('Processing character reference image generation', { userId, operation: 'character-image-generation' });

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `character_image_${userId}_${clientIp}`;
    const rateLimit = RateLimiter.checkLimit(rateLimitKey, 5, 60000); // 5 requests per minute
    
    if (!rateLimit.allowed) {
      SecurityAuditor.logRateLimit(rateLimitKey, { 
        operation: 'character_image_generation', 
        userId, 
        resetTime: rateLimit.resetTime 
      });
      return ResponseHandler.errorWithCode(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded. Please wait before generating more character images.'
      );
    }

    // Parse and validate request body
    const body: CharacterImageRequest = await req.json();
    
    const {
      character_id,
      character_name: rawName,
      character_description: rawDescription,
      character_type: rawType,
      age_group,
      backstory: rawBackstory,
      personality_traits
    } = body;

    if (!character_id || !rawName || !rawDescription || !rawType) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INVALID_REQUEST,
        'Character ID, name, description, and type are required'
      );
    }

    // Sanitize inputs
    const character_name = InputSanitizer.sanitizeText(rawName);
    const character_description = InputSanitizer.sanitizeText(rawDescription);
    const character_type = InputSanitizer.sanitizeText(rawType);
    const backstory = rawBackstory ? InputSanitizer.sanitizeText(rawBackstory) : undefined;

    // Validate credits (1 credit for character image generation)
    creditsRequired = 1;
    const creditCheck = await validateCredits(creditService, userId, 'characterImageGeneration', creditsRequired);
    if (!creditCheck.success) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INSUFFICIENT_CREDITS,
        creditCheck.error || 'Insufficient credits',
        { required: creditsRequired, available: creditCheck.available }
      );
    }

    logger.info('Generating character reference image', {
      characterId: character_id,
      characterName: character_name,
      characterType: character_type,
      operation: 'character-image-generation'
    });

    // Generate character reference prompt using centralized method (Nano-banana optimized)
    const characterPrompt = PromptTemplateManager.generateCharacterReferencePrompt({
      ageGroup: age_group || '7-9',
      genre: 'Character Reference',
      characterName: character_name,
      characterDescription: character_description,
      characterType: character_type,
      backstory: backstory,
      personalityTraits: personality_traits
    });

    logger.info('Character prompt created', {
      promptLength: characterPrompt.length,
      operation: 'prompt-generation'
    });

    // Generate the character reference image
    const imageResult = await imageService.generateImage({
      prompt: characterPrompt,
      style: 'children_book',
      width: 864,   // 3:4 portrait aspect ratio
      height: 1184,
      steps: 35,
      guidance: 7.0,
      negativePrompt: 'photorealistic, photo, photograph, realistic photography, 3d render, CGI, hyperrealistic, scary, horror, violent, nsfw, inappropriate',
      referenceImages: [] // No reference images for initial character generation
    });

    if (!imageResult.success || !imageResult.imageUrl) {
      throw new Error(imageResult.error || 'Failed to generate character image');
    }

    logger.info('Character image generated successfully', { 
      provider: imageResult.provider,
      operation: 'ai-generation' 
    });

    // Upload image to Supabase Storage
    let finalImageUrl = imageResult.imageUrl;

    // If it's a data URL (base64), upload to Supabase Storage
    if (imageResult.imageUrl.startsWith('data:')) {
      try {
        const response = await fetch(imageResult.imageUrl);
        const blob = await response.blob();
        const fileName = `${character_id}_${Date.now()}.png`;

        const supabase = createSupabaseClient(true);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('character-images')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          logger.error('Storage upload failed', uploadError, { operation: 'storage-upload' });
        } else {
          const { data: urlData } = supabase.storage
            .from('character-images')
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            finalImageUrl = urlData.publicUrl;
            logger.info('Image uploaded to storage', { 
              fileName, 
              publicUrl: finalImageUrl,
              operation: 'storage-upload' 
            });
          }
        }
      } catch (uploadError) {
        logger.error('Failed to upload to storage', uploadError, { operation: 'storage-upload' });
        // Continue with data URL if upload fails
      }
    }

    // Update user_characters table with image URL
    const supabase = createSupabaseClient(true);
    const { error: updateError } = await supabase
      .from('user_characters')
      .update({ image_url: finalImageUrl })
      .eq('id', character_id)
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Failed to update character with image URL', updateError, {
        characterId: character_id,
        operation: 'database-update'
      });
      throw new Error('Failed to save character image URL');
    }

    logger.info('Character image URL saved to database', {
      characterId: character_id,
      operation: 'database-update'
    });

    // Only deduct credits AFTER successful generation and storage
    const creditResult = await deductCreditsAfterSuccess(
      creditService,
      userId,
      'characterImageGeneration',
      creditsRequired,
      character_id,
      {
        provider: imageResult.provider,
        model: imageResult.model,
        characterName: character_name
      }
    );

    logger.info('Credits deducted successfully', {
      creditsUsed: creditsRequired,
      newBalance: creditResult.newBalance,
      operation: 'credit-deduction'
    });

    // Return success response
    return ResponseHandler.success(
      {
        imageUrl: finalImageUrl,
        characterId: character_id,
        characterName: character_name,
        provider: imageResult.provider,
        model: imageResult.model
      },
      undefined,
      {
        processingTime: Date.now() - startTime,
        provider: imageResult.provider,
        creditsUsed: creditsRequired,
        creditsRemaining: creditResult.newBalance
      }
    );

  } catch (error) {
    logger.error('Character image generation failed', error, {
      userId,
      operation: 'character-image-generation'
    });

    // Refund credits if they were deducted
    if (userId && creditsRequired > 0) {
      try {
        const creditService = new CreditService(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          req.headers.get('Authorization')!
        );
        await creditService.refundCredits(userId, creditsRequired, 'characterImageGeneration', 'Generation failed');
        logger.info('Credits refunded', { userId, amount: creditsRequired });
      } catch (refundError) {
        logger.error('Failed to refund credits', refundError);
      }
    }

    return ResponseHandler.handleError(error);
  }
});

