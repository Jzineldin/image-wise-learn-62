import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, CREDIT_COSTS, validateCredits, deductCreditsAfterSuccess } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { createImageService } from '../_shared/image-service.ts';
import { AGE_GUIDELINES, PromptTemplateManager } from '../_shared/prompt-templates.ts';
import { EnhancedPromptTemplateManager } from '../_shared/prompt-templates-enhanced.ts';
import { parseWordRange, countWords, trimToMaxWords } from '../_shared/response-handlers.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { InputValidator, InputSanitizer, RateLimiter, SecurityAuditor } from '../_shared/validation.ts';
import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { PromptTemplateManager as PromptMgr } from '../_shared/prompt-templates.ts';
import { FEATURE_FLAGS, shouldUseEnhancedPrompts, logFeatureFlags } from '../_shared/feature-flags.ts';


interface SegmentRequest {
  story_id?: string;
  storyId?: string;
  choice?: string;
  choiceText?: string;
  segment_number?: number;
  segmentNumber?: number;
}

/**
 * Text validation and correction function
 * Fixes common grammar errors in AI-generated text
 * OPTIMIZED: Eliminates duplicate regex execution
 */
function validateAndCorrectText(text: string, ageGroup?: string): string {
  if (!text) return text;

  let corrected = text;

  // Pre-check for issues (single pass)
  const duplicatePattern = /\b(\w+)\s+\1\b/gi;
  const capitalizationPattern = /(^|[.!?]\s+)([a-z])/;
  const hadDuplicates = duplicatePattern.test(text);
  const hadCapitalizationIssues = capitalizationPattern.test(text);

  // 1. Fix duplicate words (e.g., "the the" → "the")
  if (hadDuplicates) {
    corrected = corrected.replace(/\b(\w+)\s+\1\b/gi, '$1');
  }

  // 2. Fix sentence capitalization
  if (hadCapitalizationIssues) {
    corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
      return separator + letter.toUpperCase();
    });
  }

  // 3. Fix multiple spaces
  corrected = corrected.replace(/\s{2,}/g, ' ');

  // 4. Fix space before punctuation
  corrected = corrected.replace(/\s+([.!?,;:])/g, '$1');

  // 5. Ensure space after punctuation (except at end)
  corrected = corrected.replace(/([.!?,;:])([A-Za-z])/g, '$1 $2');

  // 6. Trim whitespace
  corrected = corrected.trim();

  // Log if corrections were made (reuse pre-check results)
  if (corrected !== text) {
    logger.info('Text corrections applied', {
      operation: 'text-validation',
      originalLength: text.length,
      correctedLength: corrected.length,
      hadDuplicates,
      hadCapitalizationIssues
    });
  }

  return corrected;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.storySegmentGeneration('unknown', 1, requestId);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401);
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    console.log('🔑 USER ID FROM JWT:', userId);
    logger.info('Story segment generation started', { requestId, userId, operation: 'story-segment-generation' });

    // Check chapter limits (free users only)
    // Call use_free_chapter RPC which checks and decrements if possible
    const supabaseAdmin = createSupabaseClient(true);
    const { data: chapterCheckData, error: chapterCheckError } = await supabaseAdmin.rpc('use_free_chapter', {
      user_uuid: userId
    });

    if (chapterCheckError) {
      logger.error('Failed to check chapter limits', { 
        requestId, 
        userId, 
        error: chapterCheckError.message,
        operation: 'chapter-limit-check'
      });
      // Continue anyway for paid users (they might not have the columns set up yet)
      // But log the error for monitoring
    } else if (chapterCheckData && !chapterCheckData.success) {
      // Free user hit their daily limit
      logger.warn('Daily chapter limit reached', {
        requestId,
        userId,
        used: chapterCheckData.used,
        limit: chapterCheckData.limit,
        operation: 'chapter-limit-check'
      });
      
      return ResponseHandler.error(
        'Daily chapter limit reached. Upgrade for unlimited chapters!',
        429, // Too Many Requests
        { 
          requestId,
          error: 'daily_limit_reached',
          used: chapterCheckData.used,
          limit: chapterCheckData.limit,
          remaining: chapterCheckData.remaining || 0,
          resetAt: chapterCheckData.reset_at,
          upgradeUrl: '/pricing'
        }
      );
    }

    logger.info('Chapter limit check passed', {
      requestId,
      userId,
      isPaid: chapterCheckData?.is_paid || false,
      remaining: chapterCheckData?.remaining || 'unlimited'
    });

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `segment_generation_${userId}_${clientIp}`;
    const rateLimit = RateLimiter.checkLimit(rateLimitKey, 10, 60000); // 10 requests per minute
    
    if (!rateLimit.allowed) {
      SecurityAuditor.logRateLimit(rateLimitKey, { 
        operation: 'segment_generation', 
        userId, 
        resetTime: rateLimit.resetTime 
      });
      return ResponseHandler.error('Rate limit exceeded. Try again later.', 429, { 
        requestId, 
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Parse and validate request body
    const body: SegmentRequest = await req.json();
    
    // Input validation
    const segmentValidation = InputValidator.validateSegmentRequest(body);
    if (!segmentValidation.success) {
      SecurityAuditor.logValidationError(segmentValidation.errors || [segmentValidation.error!], req);
      return ResponseHandler.error('Invalid request data', 400, { 
        requestId, 
        errors: segmentValidation.errors || [segmentValidation.error!] 
      });
    }

    // Sanitize inputs
    const story_id = body.story_id || body.storyId;
    const choice = body.choice || body.choiceText ? InputSanitizer.sanitizeText(body.choice || body.choiceText) : undefined;
    const segment_number = body.segment_number || body.segmentNumber;

    // Validate credits first (no deduction yet)
    const creditValidation = await validateCredits(creditService, userId, 'storySegment');
    logger.info('Credits validation completed', { requestId, userId, creditsRequired: creditValidation.creditsRequired });

    // Get story details
    const supabase = createSupabaseClient(true); // Use service role to bypass RLS

    // First, try to get the story without user_id filter to see if it exists
    const { data: storyCheck, error: storyCheckError } = await supabase
      .from('stories')
      .select('id, user_id, title')
      .eq('id', story_id)
      .single();

    console.log('🔍 STORY OWNERSHIP CHECK:');
    console.log('  Story ID:', story_id);
    console.log('  Request User ID:', userId);
    console.log('  Story Exists:', !!storyCheck);
    console.log('  Story User ID:', storyCheck?.user_id);
    console.log('  Story Title:', storyCheck?.title);
    console.log('  User Match:', storyCheck?.user_id === userId);

    logger.info('🔍 Story ownership check', {
      requestId,
      storyId: story_id,
      requestUserId: userId,
      storyExists: !!storyCheck,
      storyUserId: storyCheck?.user_id,
      storyTitle: storyCheck?.title,
      userMatch: storyCheck?.user_id === userId,
      error: storyCheckError?.message
    });

    // Check if story exists but belongs to different user
    if (storyCheck && storyCheck.user_id !== userId) {
      logger.error('❌ User ID mismatch - story belongs to different user', {
        requestId,
        storyId: story_id,
        storyTitle: storyCheck.title,
        requestUserId: userId,
        storyOwnerId: storyCheck.user_id,
        message: 'The logged-in user does not own this story'
      });
      throw new Error('Story not found or access denied');
    }

    // Now get the full story details with user_id filter for security
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('title, genre, age_group, language_code, metadata, user_id')
      .eq('id', story_id)
      .eq('user_id', userId)
      .single();

    if (storyError) {
      logger.error('Failed to fetch story', {
        requestId,
        storyId: story_id,
        userId,
        error: storyError.message,
        code: storyError.code,
        hint: storyCheck ? `Story exists but belongs to user ${storyCheck.user_id}` : 'Story does not exist'
      });
      throw new Error('Story not found or access denied');
    }

    logger.info('✅ Story fetched successfully', {
      requestId,
      storyId: story_id,
      storyTitle: story.title,
      userId: story.user_id
    });

    // Get previous segments for context
    const { data: segments } = await supabase
      .from('story_segments')
      .select('content, choices')
      .eq('story_id', story_id)
      .order('segment_number');

    let previousContent = segments?.map(s => s.content).join('\n\n') || '';

    // Lightweight narrative memory summary (risk-free, no extra AI calls)
    try {
      const recentSegments = (segments || []).slice(-2);
      const recentText = recentSegments.map(s => s.content || '').join(' ').trim();
      const recentSummary = recentText ? trimToMaxWords(recentText, 60) : '';

      // Attempt to find the impact of the selected choice from the last segment
      let lastChoiceImpact: string | undefined = undefined;
      const lastSeg = (segments || [])[(segments || []).length - 1];
      if (lastSeg && Array.isArray(lastSeg.choices) && (choice || '').trim()) {
        const normalizedChoice = (choice || '').trim().toLowerCase();
        const matched = lastSeg.choices.find((c: any) => String(c?.text || '').trim().toLowerCase() === normalizedChoice);
        if (matched?.impact) lastChoiceImpact = String(matched.impact);
      }

      const memoryLines = [
        recentSummary ? `- Recent events: ${recentSummary}` : undefined,
        lastChoiceImpact ? `- Last choice consequence to reflect: ${lastChoiceImpact}` : undefined,
      ].filter(Boolean);

      if (memoryLines.length > 0) {
        const memoryBlock = `NARRATIVE MEMORY SUMMARY:\n${memoryLines.join('\n')}\n`;
        previousContent = `${memoryBlock}\n${previousContent}`.trim();
      }
    } catch (_e) {
      // best-effort; ignore summarization errors
    }

    // Generate continuation using AI service (OpenRouter Sonoma Dusk Alpha)
    const aiService = createAIService();

    const ageGuide = AGE_GUIDELINES[story.age_group as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];
    const wordRange = ageGuide.wordCount; // e.g., "80-110 words"

    // Log feature flags on first use
    if (segment_number === 1) {
      logFeatureFlags();
    }

    // Extract child name from metadata if using personalization
    const childName = shouldUseEnhancedPrompts() && story.metadata?.childName
      ? String(story.metadata.childName)
      : undefined;

    // Build structured prompt using centralized template (JSON schema enforced)
    // Detect if this should be an ending segment (when choice is "THE_END")
    const isEndingSegment = choice?.toUpperCase() === 'THE_END';

    // Use enhanced prompts if feature flag is enabled
    const tmpl = shouldUseEnhancedPrompts()
      ? EnhancedPromptTemplateManager.generateStorySegment({
          ageGroup: story.age_group,
          genre: story.genre,
          language: story.language_code,
          characters: story.metadata?.characters || [],
          previousContent,
          choiceText: choice || '',
          segmentNumber: segment_number || ((segments?.length || 0) + 1),
          shouldBeEnding: isEndingSegment,
          childName,
        })
      : PromptTemplateManager.generateStorySegment({
          ageGroup: story.age_group,
          genre: story.genre,
          language: story.language_code,
          previousContent,
          choiceText: choice || '',
          segmentNumber: segment_number || ((segments?.length || 0) + 1),
          shouldBeEnding: isEndingSegment,
        });

    logger.info('Using prompt system', {
      enhanced: shouldUseEnhancedPrompts(),
      personalized: !!childName,
      isEnding: isEndingSegment,
      requestId
    });


    const aiResponse = await aiService.generate('story-segments', {
      messages: [
        { role: 'system', content: tmpl.system },
        { role: 'user', content: tmpl.user }
      ],
      responseFormat: 'json',
      schema: tmpl.schema,
      temperature: 0.6
    }, story.language_code);  // Pass language code for model selection

    const parsed: any = aiResponse.content;
    let segmentContent = '';
    let choices: Array<{ id: number; text: string; impact?: string }> = [];

    try {
      if (parsed && typeof parsed === 'object' && parsed.content) {
        segmentContent = String(parsed.content || '').trim();
        const rawChoices = Array.isArray(parsed.choices) ? parsed.choices : [];
        choices = rawChoices.map((choice: any, i: number) => ({ id: Number(choice.id ?? i + 1), text: String(choice.text || '').trim(), impact: choice.impact ? String(choice.impact) : undefined }))
          .filter((choice: any) => choice.text);
      } else {
        throw new Error('Missing structured fields');
      }
    } catch (e) {
      // Fallback to previous text parsing path
      logger.warn('Structured parse failed, falling back to text parsing', { requestId, operation: 'story-segment-generation' });
      const fallbackText = typeof aiResponse.content === 'string' ? aiResponse.content : '';
      segmentContent = fallbackText;
      const choiceMatches = fallbackText.match(/(?:^|\n)\s*(?:Choice\s*\d+:|Option\s*\d+:|\d+\.)[^\n]*/g) || [];
      choices = choiceMatches.map((match, index) => ({
        id: index + 1,
        text: match.replace(/^(?:\s*|\n)?\s*(?:Choice\s*\d+:|Option\s*\d+:|\d+\.)/, '').trim()
      }));
      const contentMatch = fallbackText.match(/CONTENT:\s*([\s\S]*?)(?=CHOICES:|$)/i);
      if (contentMatch) segmentContent = contentMatch[1].trim();
    }

    // ========== TEXT VALIDATION & CORRECTION ==========
    // Apply post-processing to fix common grammar errors
    segmentContent = validateAndCorrectText(segmentContent, story.age_group);
    choices = choices.map(choice => ({
      ...choice,
      text: validateAndCorrectText(choice.text, story.age_group),
      impact: choice.impact ? validateAndCorrectText(choice.impact, story.age_group) : undefined
    }));

    logger.info('Story segment generated successfully', {
      requestId,
      provider: aiResponse.provider,
      model: aiResponse.model,
      choicesCount: choices.length,
      isEnding: choices.length === 0,
      operation: 'ai-generation'
    });

    // Enforce word limits on cleaned content
    {
      const { min, max } = parseWordRange(wordRange);
      const wc = countWords(segmentContent);
      if (wc > max) {
        logger.warn('Segment exceeds max words, trimming', {
          requestId,
          wordCount: wc,
          maxWords: max,
          operation: 'word-count-validation'
        });
        segmentContent = trimToMaxWords(segmentContent, max);
      }
      logger.info('Segment word count validated', {
        requestId,
        segmentNumber: segment_number,
        wordCount: wc,
        targetRange: `${min}-${max}`,
        ageGroup: story.age_group
      });
    }

    // ========== IMAGE GENERATION ==========
    // Generate image for the story segment
    const imageService = createImageService();
    let imageUrl = '';
    let imagePrompt = '';

    try {
      // Build image prompt from segment content using centralized prompt (Nano-banana optimized)
      // Extract characters from metadata JSONB field
      const characters = story.metadata?.characters || [];

      // Use enhanced image prompts if feature flag is enabled
      imagePrompt = FEATURE_FLAGS.USE_ENHANCED_IMAGE_PROMPTS
        ? EnhancedPromptTemplateManager.generateImagePrompt({
            ageGroup: story.age_group || '7-9',
            genre: story.genre || 'Adventure',
            storySegment: segmentContent,
            characters: Array.isArray(characters) ? characters : [],
            style: 'digital_storybook'
          })
        : PromptTemplateManager.generateImagePrompt({
            ageGroup: story.age_group || '7-9',
            genre: story.genre || 'Adventure',
            storySegment: segmentContent,
            characters: Array.isArray(characters) ? characters : [],
            style: 'digital_storybook'
          });

      logger.info('Using image prompt system', {
        enhanced: FEATURE_FLAGS.USE_ENHANCED_IMAGE_PROMPTS,
        requestId
      });

      // Derive a stable seed from story/segment for consistency
      const hashToSeed = (input: string) => {
        let h = 2166136261;
        for (let i = 0; i < input.length; i++) {
          h ^= input.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return Math.abs(h >>> 0) % 2147483647;
      };
      const seed = hashToSeed(`${story_id}|${segment_number || 1}`);

      const negativePrompt = [
        'low quality', 'worst quality', 'blurry', 'pixelated', 'jpeg artifacts', 'noise',
        'deformed', 'distorted', 'extra limbs', 'mutated hands', 'bad anatomy', 'crooked eyes',
        'text', 'caption', 'logo', 'watermark', 'signature', 'nsfw', 'gore', 'scary', 'violent',
        'blood', 'weapons', 'nudity', 'disfigured', 'overexposed', 'underexposed'
      ].join(', ');

      logger.info('Generating image for story segment', { requestId, segmentNumber: segment_number });

      const imageResult = await imageService.generateImage({
        prompt: imagePrompt,
        style: 'digital_storybook',
        width: 1024,
        height: 1024,
        steps: 35,
        guidance: 7.0,
        seed,
        negativePrompt
      });

      logger.info('Image generated successfully', { provider: imageResult.provider, operation: 'ai-generation' });

      // Handle image storage
      let finalImageUrl = imageResult.imageUrl;

      // If it's a data URL (base64), upload to Supabase Storage
      if (imageResult.imageUrl.startsWith('data:')) {
        try {
          const response = await fetch(imageResult.imageUrl);
          const blob = await response.blob();
          const fileName = `${story_id}_segment_${segment_number || 1}_${Date.now()}.png`;

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

      imageUrl = finalImageUrl;

      // Update story cover image if needed
      if (story_id && imageUrl) {
        const supabase = createSupabaseClient(true);
        const { data: storyData } = await supabase
          .from('stories')
          .select('cover_image')
          .eq('id', story_id)
          .single();

        if (!storyData?.cover_image) {
          const supabase = createSupabaseClient(true);
          await supabase
            .from('stories')
            .update({ cover_image: imageUrl })
            .eq('id', story_id);
        }
      }

    } catch (imageError) {
      logger.error('Image generation failed, continuing without image', imageError, { requestId, operation: 'image-generation-failed' });
      // Continue without image - don't fail the entire operation
    }

    // Create story segment
    const { data: segment, error: segmentError } = await supabase
      .from('story_segments')
      .insert({
        story_id,
        segment_number,
        content: segmentContent,
        segment_text: segmentContent,
        choices: choices,
        is_ending: choices.length === 0,
        image_url: imageUrl || null,
        image_prompt: imagePrompt || null,
        image_generation_status: imageUrl ? 'completed' : 'failed',
      })
      .select()
      .single();

    if (segmentError) {
      logger.error('Failed to create segment', segmentError, { requestId, storyId: story_id, segmentNumber: segment_number });
      throw new Error('Failed to save story segment');
    }

    // Deduct credits AFTER successful generation/persistence, with idempotent reference
    const creditResult = await deductCreditsAfterSuccess(
      creditService,
      userId,
      'storySegment',
      creditValidation.creditsRequired,
      segment.id,
      { story_id, segment_number }
    );

    // Update story credits used (legacy behavior)
    if (story_id) {
      await creditService.updateStoryCreditsUsed(story_id, creditValidation.creditsRequired);
    }

    logger.info('Story segment created successfully', { 
      requestId, 
      segmentId: segment.id, 
      storyId: story_id, 
      creditsUsed: creditValidation.creditsRequired,
      operation: 'segment-creation'
    });

    return ResponseHandler.success(
      {
        segment: {
          id: segment.id,
          content: segmentContent,
          choices,
          is_ending: choices.length === 0,
          image_url: imageUrl,
          image_prompt: imagePrompt,
          image_generation_status: imageUrl ? 'completed' : 'failed'
        },
        credits_used: creditValidation.creditsRequired,
        credits_remaining: creditResult.newBalance
      },
      aiResponse.model,
      { requestId, tokensUsed: aiResponse.tokensUsed, processingTime: Date.now() }
    );

  } catch (error) {
    logger.error('Story segment generation failed', error, { requestId, operation: 'story-segment-generation' });

    // Handle insufficient credits error
    if ((error as any)?.message?.includes('Insufficient credits')) {
      return ResponseHandler.error(
        (error as any)?.message,
        400,
        { error_code: 'INSUFFICIENT_CREDITS', operation: 'story-segment', requestId }
      );
    }

    return ResponseHandler.error(
      (error as any)?.message || 'Failed to generate story segment',
      500,
      { operation: 'story-segment', requestId, timestamp: Date.now() }
    );
  }
});