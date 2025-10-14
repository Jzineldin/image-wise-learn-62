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
      style = 'digital_storybook'  // Updated default: high quality, colorful, NOT photorealistic
    } = body;

    const prompt = rawPrompt ? InputSanitizer.sanitizeText(rawPrompt) : undefined;
    const storyContent = rawStoryContent ? InputSanitizer.sanitizeText(rawStoryContent) : undefined;
    const storyTitle = rawStoryTitle ? InputSanitizer.sanitizeText(rawStoryTitle) : undefined;

    // Fetch character reference images from database if story_id is provided
    let characterReferenceImages: string[] = [];
    if (story_id) {
      try {
        const supabase = createSupabaseClient(true);

        // Get story metadata which contains character IDs
        const { data: story } = await supabase
          .from('stories')
          .select('metadata')
          .eq('id', story_id)
          .single();

        if (story?.metadata?.characters && Array.isArray(story.metadata.characters)) {
          const characterIds = story.metadata.characters
            .map((c: any) => c.id)
            .filter(Boolean)
            .slice(0, 3); // Max 3 characters for Gemini 2.5 Flash

          if (characterIds.length > 0) {
            // Fetch character images from user_characters table
            const { data: characterData } = await supabase
              .from('user_characters')
              .select('id, name, image_url')
              .in('id', characterIds);

            if (characterData) {
              characterReferenceImages = characterData
                .filter(c => c.image_url) // Only include characters with images
                .map(c => c.image_url)
                .slice(0, 3); // Ensure max 3 images

              if (characterReferenceImages.length > 0) {
                logger.info('Using character reference images', {
                  count: characterReferenceImages.length,
                  storyId: story_id,
                  operation: 'character-references'
                });
              }
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch character reference images', {
          error: (error as Error)?.message,
          storyId: story_id,
          operation: 'character-references'
        });
        // Continue without reference images
      }
    }

    // Build age-appropriate style descriptor
    const ageStyleMap: Record<string, { style: string; mood: string; composition: string }> = {
      '4-6': {
        style: 'soft, whimsical watercolor illustration with rounded shapes, gentle colors, and simple composition',
        mood: 'warm, comforting, and playful with soft lighting and gentle shadows',
        composition: 'centered, clear focal point, uncluttered background'
      },
      '7-9': {
        style: 'vibrant, detailed digital illustration with rich colors and dynamic composition',
        mood: 'adventurous, exciting, and engaging with bright lighting and colorful atmosphere',
        composition: 'dynamic angles, detailed environment, sense of depth and movement'
      },
      '10-12': {
        style: 'sophisticated, semi-realistic illustration with detailed textures and atmospheric lighting',
        mood: 'immersive, dramatic, and emotionally resonant with cinematic lighting and mood',
        composition: 'complex composition, detailed background, atmospheric perspective'
      }
    };

    const ageStyle = ageGroup && ageStyleMap[ageGroup]
      ? ageStyleMap[ageGroup]
      : {
          style: 'colorful children\'s book illustration style',
          mood: 'friendly and engaging with warm lighting',
          composition: 'clear and balanced composition'
        };

    // Build narrative-based prompt (not keyword lists)
    let finalPrompt = prompt;
    if (!finalPrompt && storyContent) {
      // Extract character information with detailed descriptions
      const charDescriptions = (characters || [])
        .slice(0, 3)
        .map((c: any) => {
          const name = c?.name ? String(c.name) : '';
          const desc = c?.description ? String(c.description) : '';
          const personality = c?.personality ? String(c.personality) : '';
          const type = c?.character_type ? String(c.character_type) : '';

          if (!name) return '';

          // Build narrative character description
          let charDesc = name;
          if (type && type !== 'human') charDesc += `, a ${type}`;
          if (desc) charDesc += `, ${desc}`;
          if (personality) charDesc += ` with a ${personality} personality`;

          return charDesc;
        })
        .filter(Boolean);

      // Extract scene from story content (narrative description)
      const scene = storyContent.slice(0, 250).replace(/\s+/g, ' ').trim();

      // Build comprehensive narrative prompt
      if (charDescriptions.length > 0) {
        // With characters - use reference images for consistency
        finalPrompt = `A children's book illustration showing ${scene}

Featuring: ${charDescriptions.join('; ')}.

The scene is rendered in a ${ageStyle.style}.
The mood is ${ageStyle.mood}.
Composition: ${ageStyle.composition}.

Camera angle: eye-level perspective, inviting and accessible for young readers.
Lighting: ${ageGroup === '4-6' ? 'soft, diffused natural light' : ageGroup === '7-9' ? 'bright, colorful lighting with clear shadows' : 'dramatic, atmospheric lighting with depth'}.

This illustration is suitable for ages ${ageGroup || '4-12'} and maintains a safe, friendly, and engaging tone appropriate for children's literature.
High quality, professional children's book illustration.`;
      } else {
        // Without characters - focus on scene
        finalPrompt = `A children's book illustration depicting ${scene}

The scene is rendered in a ${ageStyle.style}.
The mood is ${ageStyle.mood}.
Composition: ${ageStyle.composition}.

Camera angle: eye-level perspective, inviting and accessible for young readers.
Lighting: ${ageGroup === '4-6' ? 'soft, diffused natural light' : ageGroup === '7-9' ? 'bright, colorful lighting with clear shadows' : 'dramatic, atmospheric lighting with depth'}.

This illustration is suitable for ages ${ageGroup || '4-12'} and maintains a safe, friendly, and engaging tone appropriate for children's literature.
High quality, professional children's book illustration.`;
      }
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


    // Validate credits (don't deduct yet) - all images cost 1 credit
    const creditsValidation = await validateCredits(creditService, userId, 'imageGeneration');
    creditsRequired = creditsValidation.creditsRequired;

    logger.info('Credits validated for image generation', {
      creditsRequired,
      availableCredits: creditsValidation.currentCredits,
      operation: 'credit-validation'
    });

    // Generate image using new service with character reference images
    // Use 3:4 portrait aspect ratio for children's book illustrations
    const imageResult = await imageService.generateImage({
      prompt: finalPrompt,
      style,
      width: 864,           // 3:4 portrait aspect ratio (864×1152)
      height: 1152,         // Portrait orientation for children's book pages
      steps: 35,            // SDXL: 35 steps for softer, more illustrated look (vs 40 for hyperdetail)
      guidance: 7.0,        // Higher guidance (7.0 vs 6.5) to enforce illustrated style more strongly
      seed,
      negativePrompt,
      referenceImages: characterReferenceImages, // Pass character reference images for consistency
      aspectRatio: '3:4'    // Explicitly set 3:4 aspect ratio for Gemini
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