import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CreditService, validateCredits, deductCreditsAfterSuccess, refundCredits } from '../_shared/credit-system.ts';
import { createImageService } from '../_shared/image-service.ts';
import { ResponseHandler, ERROR_CODES } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { InputValidator, InputSanitizer, RateLimiter, SecurityAuditor } from '../_shared/validation.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';

interface ImageRequest {
  prompt?: string;
  storyContent?: string;
  storyTitle?: string;
  ageGroup?: string;
  genre?: string;
  characters?: any[];
  story_id?: string;
  segment_id?: string;
  style?: string;
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
    logger.info('Processing image generation for user', { userId, operation: 'image-generation' });

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `image_generation_${userId}_${clientIp}`;
    const rateLimit = RateLimiter.checkLimit(rateLimitKey, 3, 60000); // 3 requests per minute
    
    if (!rateLimit.allowed) {
      SecurityAuditor.logRateLimit(rateLimitKey, { 
        operation: 'image_generation', 
        userId, 
        resetTime: rateLimit.resetTime 
      });
      return ResponseHandler.errorWithCode(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded. Please wait before generating more images.'
      );
    }

    // Parse and validate request body
    const body: ImageRequest = await req.json();
    
    // Input validation
    const inputValidation = InputValidator.validateImageRequest(body);
    if (!inputValidation.success) {
      SecurityAuditor.logValidationError(inputValidation.errors || [inputValidation.error!], req);
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INVALID_REQUEST,
        `Invalid request: ${inputValidation.errors?.join(', ') || inputValidation.error}`
      );
    }

    // Sanitize inputs
    const {
      prompt: rawPrompt,
      storyContent: rawStoryContent,
      storyTitle: rawStoryTitle,
      ageGroup,
      genre,
      characters,
      story_id,
      segment_id,
      style = 'children_book'
    } = body;

    const prompt = rawPrompt ? InputSanitizer.sanitizeText(rawPrompt) : undefined;
    const storyContent = rawStoryContent ? InputSanitizer.sanitizeText(rawStoryContent) : undefined;
    const storyTitle = rawStoryTitle ? InputSanitizer.sanitizeText(rawStoryTitle) : undefined;

    // Build prompt if not provided (enhanced for SDXL quality)
    let finalPrompt = prompt;
    if (!finalPrompt && storyContent) {
      const charSnippets = (characters || [])
        .slice(0, 3)
        .map((c: any) => {
          const name = c?.name ? String(c.name) : '';
          const desc = c?.description ? String(c.description) : '';
          const brief = (desc || '').slice(0, 60).trim();
          return brief ? `${name} (${brief})` : name;
        })
        .filter(Boolean)
        .join(', ');
      const charText = charSnippets ? ` featuring ${charSnippets}` : '';
      const scene = storyContent.slice(0, 280).replace(/\s+/g, ' ').trim();
      finalPrompt = `A storybook scene for "${storyTitle || 'story'}" in the ${genre || 'adventure'} genre, suitable for ${ageGroup || 'children'} readers. Depict: ${scene}${charText}.`;
    }

    if (!finalPrompt) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INVALID_REQUEST,
        'Either prompt or story content must be provided for image generation'
      );
    }

    // Derive a stable seed from story/segment for consistency
    const hashToSeed = (input: string) => {
      let h = 2166136261;
      for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      // Force positive 32-bit and clamp to SDXL range
      return Math.abs(h >>> 0) % 2147483647;
    };
    const seed = hashToSeed(`${story_id || ''}|${segment_id || ''}|${style || 'children_book'}`);

    const negativePrompt = [
      'low quality', 'worst quality', 'blurry', 'pixelated', 'jpeg artifacts', 'noise',
      'deformed', 'distorted', 'extra limbs', 'mutated hands', 'bad anatomy', 'crooked eyes',
      'text', 'caption', 'logo', 'watermark', 'signature', 'nsfw', 'gore', 'scary', 'violent',
      'blood', 'weapons', 'nudity', 'disfigured', 'overexposed', 'underexposed'
    ].join(', ');


    // Validate credits (don't deduct yet)
    const creditsValidation = await validateCredits(creditService, userId, 'imageGeneration');
    creditsRequired = creditsValidation.creditsRequired;

    logger.info('Credits validated for image generation', { 
      creditsRequired, 
      availableCredits: creditsValidation.currentCredits, 
      operation: 'credit-validation' 
    });

    // Generate image using new service
    const imageResult = await imageService.generateImage({
      prompt: finalPrompt,
      style,
      width: 1024,
      height: 1024,
      steps: 40,            // SDXL: better detail at 35-50 steps
      guidance: 6.5,        // SDXL sweet spot to avoid oversaturation
      seed,
      negativePrompt
    });

    logger.info('Image generated successfully', { provider: imageResult.provider, operation: 'ai-generation' });

    // Only deduct credits AFTER successful generation
    const creditResult = await deductCreditsAfterSuccess(
      creditService,
      userId,
      'imageGeneration',
      creditsRequired,
      segment_id || story_id,
      {
        provider: imageResult.provider,
        model: imageResult.model,
        prompt: finalPrompt
      }
    );

    logger.info('Credits deducted successfully', { 
      creditsUsed: creditsRequired, 
      newBalance: creditResult.newBalance, 
      operation: 'credit-deduction' 
    });

    // Store image URL in database
    let finalImageUrl = imageResult.imageUrl;

    // If it's a data URL (base64), we should upload to Supabase Storage
    if (imageResult.imageUrl.startsWith('data:')) {
      try {
        // Convert data URL to blob and upload to storage
        const response = await fetch(imageResult.imageUrl);
        const blob = await response.blob();
        const fileName = `${segment_id || story_id || 'image'}_${Date.now()}.png`;

        const supabase = createSupabaseClient(true);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('story-images')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          logger.error('Storage upload failed', uploadError, { operation: 'storage-upload' });
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('story-images')
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            finalImageUrl = urlData.publicUrl;
          }
        }
      } catch (storageError) {
        logger.error('Storage handling failed', storageError, { operation: 'storage-upload' });
        // Continue with data URL if storage fails
      }
    }

    // Update story segment with image URL
    if (segment_id) {
      const supabase = createSupabaseClient(true);
      const { error: updateError } = await supabase
        .from('story_segments')
        .update({
          image_url: finalImageUrl,
          image_prompt: finalPrompt,
          image_generation_status: 'completed',
        })
        .eq('id', segment_id);

      if (updateError) {
        logger.error('Failed to update story segment', updateError, { segmentId: segment_id, operation: 'database-update' });
      }
    }

    // Update story cover image if needed
    if (story_id) {
      const supabase = createSupabaseClient(true);
      const { data: story } = await supabase
        .from('stories')
        .select('cover_image')
        .eq('id', story_id)
        .single();

      if (!story?.cover_image) {
        const supabase = createSupabaseClient(true);
        await supabase
          .from('stories')
          .update({ cover_image: finalImageUrl })
          .eq('id', story_id);
      }
    }

    // Return success response
    return ResponseHandler.success(
      {
        imageUrl: finalImageUrl,
        originalPrompt: finalPrompt,
        provider: imageResult.provider,
        model: imageResult.model,
        seed: imageResult.seed
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
    logger.error('Image generation failed', error, { userId, creditsRequired, operation: 'image-generation' });

    // Refund credits if they were deducted but operation failed
    if (userId && creditsRequired > 0 && (error as any)?.message?.includes('after deduction')) {
      try {
        await refundCredits(
          new CreditService(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          ),
          userId,
          creditsRequired,
          'Image generation failed after credit deduction'
        );
        logger.info('Credits refunded due to failure', { refundedCredits: creditsRequired, operation: 'credit-refund' });
      } catch (refundError) {
        logger.error('Failed to refund credits', refundError, { operation: 'credit-refund' });
      }
    }

    return ResponseHandler.handleError(error, {
      operation: 'generate-story-image',
      userId,
      creditsRequired
    });
  }
});