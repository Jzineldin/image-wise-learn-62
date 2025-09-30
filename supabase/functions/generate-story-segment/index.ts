import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { CreditService, CREDIT_COSTS, validateCredits, deductCreditsAfterSuccess } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { AGE_GUIDELINES, PromptTemplateManager } from '../_shared/prompt-templates.ts';
import { parseWordRange, countWords, trimToMaxWords } from '../_shared/response-handlers.ts';
import { ResponseHandler, Validators, withTiming } from '../_shared/response-handlers.ts';
import { logger } from '../_shared/logger.ts';
import { InputValidator, InputSanitizer, RateLimiter, SecurityAuditor } from '../_shared/validation.ts';


interface SegmentRequest {
  story_id?: string;
  storyId?: string;
  choice?: string;
  choiceText?: string;
  segment_number?: number;
  segmentNumber?: number;
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
    logger.info('Story segment generation started', { requestId, userId, operation: 'story-segment-generation' });

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
    const choice = body.choice ? InputSanitizer.sanitizeText(body.choice) : undefined;
    const segment_number = body.segment_number || body.segmentNumber;

    // Validate credits first (no deduction yet)
    const creditValidation = await validateCredits(creditService, userId, 'storySegment');
    logger.info('Credits validation completed', { requestId, userId, creditsRequired: creditValidation.creditsRequired });

    // Get story details
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('title, genre, age_group, language_code')
      .eq('id', story_id)
      .eq('user_id', userId)
      .single();

    if (storyError) {
      throw new Error('Story not found or access denied');
    }

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

    // Build structured prompt using centralized template (JSON schema enforced)
    const tmpl = PromptTemplateManager.generateStorySegment({
      ageGroup: story.age_group,
      genre: story.genre,
      language: story.language_code,
      previousContent,
      choiceText: choice || '',
      segmentNumber: segment_number || ((segments?.length || 0) + 1),
      shouldBeEnding: false,
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

    let parsed: any = aiResponse.content;
    let segmentContent = '';
    let choices: Array<{ id: number; text: string; impact?: string }> = [];

    try {
      if (parsed && typeof parsed === 'object' && parsed.content) {
        segmentContent = String(parsed.content || '').trim();
        const rawChoices = Array.isArray(parsed.choices) ? parsed.choices : [];
        choices = rawChoices.map((c: any, i: number) => ({ id: Number(c.id ?? i + 1), text: String(c.text || '').trim(), impact: c.impact ? String(c.impact) : undefined }))
          .filter((c: any) => c.text);
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

    logger.info('Story segment generated successfully', { 
      requestId, 
      provider: aiResponse.provider, 
      model: aiResponse.model,
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
          is_ending: choices.length === 0
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