import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { CreditService, validateCredits, deductCreditsAfterSuccess, refundCredits } from '../_shared/credit-system.ts';
import { createImageService } from '../_shared/image-service.ts';
import { ResponseHandler, ERROR_CODES } from '../_shared/response-handlers.ts';

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
    console.log(`Processing image generation for user: ${userId}`);

    // Parse request body
    const {
      prompt,
      storyContent,
      storyTitle,
      ageGroup,
      genre,
      characters,
      story_id,
      segment_id,
      style = 'children_book'
    }: ImageRequest = await req.json();

    // Build prompt if not provided
    let finalPrompt = prompt;
    if (!finalPrompt && storyContent) {
      const characterNames = characters?.map((c: any) => c.name).filter(Boolean).join(', ') || '';
      const characterDesc = characterNames ? ` featuring characters ${characterNames}` : '';
      finalPrompt = `A children's book illustration for "${storyTitle || 'story'}" (${ageGroup || 'children'} age group, ${genre || 'adventure'} genre). Scene: ${storyContent.slice(0, 200)}...${characterDesc}. Style: colorful, friendly, safe for children, high quality digital art.`;
    }

    if (!finalPrompt) {
      return ResponseHandler.errorWithCode(
        ERROR_CODES.INVALID_REQUEST,
        'Either prompt or story content must be provided for image generation'
      );
    }

    // Validate credits (don't deduct yet)
    const validation = await validateCredits(creditService, userId, 'imageGeneration');
    creditsRequired = validation.creditsRequired;

    console.log(`Credits validated: ${creditsRequired} required, ${validation.currentCredits} available`);

    // Generate image using new service
    const imageResult = await imageService.generateImage({
      prompt: finalPrompt,
      style,
      width: 1024,
      height: 1024,
      steps: 25,
      guidance: 7.5
    });

    console.log(`Image generated successfully with ${imageResult.provider}`);

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

    console.log(`Credits deducted: ${creditsRequired}, New balance: ${creditResult.newBalance}`);

    // Store image URL in database
    let finalImageUrl = imageResult.imageUrl;

    // If it's a data URL (base64), we should upload to Supabase Storage
    if (imageResult.imageUrl.startsWith('data:')) {
      try {
        // Convert data URL to blob and upload to storage
        const response = await fetch(imageResult.imageUrl);
        const blob = await response.blob();
        const fileName = `${segment_id || story_id || 'image'}_${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await creditService.supabase.storage
          .from('story-images')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload failed:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = creditService.supabase.storage
            .from('story-images')
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            finalImageUrl = urlData.publicUrl;
          }
        }
      } catch (storageError) {
        console.error('Storage handling failed:', storageError);
        // Continue with data URL if storage fails
      }
    }

    // Update story segment with image URL
    if (segment_id) {
      const { error: updateError } = await creditService.supabase
        .from('story_segments')
        .update({
          image_url: finalImageUrl,
          image_prompt: finalPrompt,
          image_generation_status: 'completed',
        })
        .eq('id', segment_id);

      if (updateError) {
        console.error('Failed to update story segment:', updateError);
      }
    }

    // Update story cover image if needed
    if (story_id) {
      const { data: story } = await creditService.supabase
        .from('stories')
        .select('cover_image')
        .eq('id', story_id)
        .single();

      if (!story?.cover_image) {
        await creditService.supabase
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
    console.error('Image generation error:', error);

    // Refund credits if they were deducted but operation failed
    if (userId && creditsRequired > 0 && error.message?.includes('after deduction')) {
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
        console.log(`Refunded ${creditsRequired} credits due to failure`);
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }

    return ResponseHandler.handleError(error, {
      operation: 'generate-story-image',
      userId,
      creditsRequired
    });
  }
});