import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { CreditService, validateCredits, deductCreditsAfterSuccess } from '../_shared/credit-system.ts';
import { createAIService } from '../_shared/ai-service.ts';
import { ResponseHandler, parseWordRange, countWords, trimToMaxWords, withTiming, Validators } from '../_shared/response-handlers.ts';
import { PromptTemplateManager, AGE_GUIDELINES } from '../_shared/prompt-templates.ts';
import { logger } from '../_shared/logger.ts';
import { InputValidator, InputSanitizer, RateLimiter, SecurityAuditor } from '../_shared/validation.ts';

interface StoryRequest {
  storyId: string;
  prompt: string;
  genre: string;
  ageGroup: string;
  languageCode?: string;
  isInitialGeneration?: boolean;
  characters?: Array<{
    name: string;
    description: string;
    personality: string;
  }>;
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return ResponseHandler.corsOptions();
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.info('Story generation request started', { requestId, operation: 'story-generation' });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return ResponseHandler.error('No authorization header', 401, { requestId });
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const creditService = new CreditService(supabaseUrl, supabaseKey, authHeader);

    // Get user ID
    const userId = await creditService.getUserId();
    logger.info('Processing story generation', { requestId, userId, operation: 'story-generation' });

    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `story_generation_${userId}_${clientIp}`;
    const rateLimit = RateLimiter.checkLimit(rateLimitKey, 5, 60000); // 5 requests per minute
    
    if (!rateLimit.allowed) {
      SecurityAuditor.logRateLimit(rateLimitKey, { 
        operation: 'story_generation', 
        userId, 
        resetTime: rateLimit.resetTime 
      });
      return ResponseHandler.error('Rate limit exceeded. Try again later.', 429, { 
        requestId, 
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Parse and validate request body
    const body = await req.json();
    
    // Basic validation - only check critical fields for story generation
    if (!body.storyId || !InputValidator.validateUUID(body.storyId)) {
      return ResponseHandler.error('Invalid story ID format', 400, { requestId });
    }
    
    // Log validation issues but don't block story generation
    const requestValidation = InputValidator.validateStoryRequest(body);
    if (!requestValidation.success) {
      SecurityAuditor.logValidationError(requestValidation.errors || [requestValidation.error!], req);
      logger.warn('Validation issues detected but proceeding with generation', { 
        requestId, 
        errors: requestValidation.errors || [requestValidation.error!] 
      });
    }

    // Sanitize inputs
    const { 
      storyId, 
      prompt: rawPrompt, 
      genre, 
      ageGroup, 
      languageCode = 'en', 
      isInitialGeneration = true,
      characters = []
    }: StoryRequest = body;

    const prompt = InputSanitizer.sanitizeText(rawPrompt);
    const sanitizedCharacters = characters.map(char => ({
      name: InputSanitizer.sanitizeText(char.name),
      description: InputSanitizer.sanitizeText(char.description),
      personality: InputSanitizer.sanitizeText(char.personality || '')
    }));

    logger.info('Request validated successfully', { 
      requestId, 
      storyId, 
      genre, 
      ageGroup, 
      languageCode, 
      hasCharacters: characters.length > 0,
      operation: 'request-validation'
    });

    // Validate credits first (no deduction yet)
    const creditValidation = await validateCredits(creditService, userId, 'storyGeneration');
    logger.info('Credits validation completed', { requestId, userId, creditsRequired: creditValidation.creditsRequired });

    // Get the existing story to update
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: existingStory, error: fetchError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingStory) {
      logger.error('Story not found or access denied', fetchError, { requestId, storyId, userId });
      throw new Error('Story not found or access denied');
    }

    // Generate story using AI service
    const timings: Record<string, number> = {};
    const startTotal = Date.now();

    logger.info('[PERF] Story generation started', {
      requestId,
      userId,
      languageCode,
      genre,
      ageGroup,
      operation: 'perf-tracking'
    });

    const aiService = createAIService();

    // Feature flag to guard JSON opening rollout
    // Feature flag can be overridden via header for dev/test
    const headerOverride = (req.headers.get('x-feature-json-opening') || '').toLowerCase() === 'true';
    const USE_JSON_OPENING = headerOverride || (Deno.env.get('FEATURE_JSON_OPENING') || '').toLowerCase() === 'true';

    // Process character references and build concise protagonist instructions
    const processedCharacters = (characters || []).map(c => ({
      ...c,
      reference: PromptTemplateManager.getCharacterReference({ name: c.name, description: c.description })
    }));

    const protagonistsList = processedCharacters.length > 0
      ? processedCharacters.map(c => `- ${c.reference}: ${c.description}${c.personality ? ` (personality: ${c.personality})` : ''}`).join('\n')
      : '';

    const ageGuide = AGE_GUIDELINES[ageGroup as keyof typeof AGE_GUIDELINES] || AGE_GUIDELINES['10-12'];

    // Additional guardrails
    const safetyRule = 'Safety: no violence beyond mild peril; always kind and inclusive.';
    const kidsFluencyRule = ageGroup === '7-9'
      ? 'Fluency (7-9): use simple, concrete words; short sentences (≈8–12 words); avoid archaic phrasing.'
      : undefined;

    // Short, consolidated instructions
    const systemPrompt = [
      `You write engaging openings for ${ageGroup} readers in ${genre}.`,
      processedCharacters.length > 0 ? `Protagonists: ${processedCharacters.map(c => c.reference).join(', ')} (use exact references; if descriptive, keep lowercase).` : undefined,
      `Language: ${languageCode}.` ,
      `Style: vocab ${ageGuide.vocabulary}; sentences ${ageGuide.sentence}; themes ${ageGuide.themes}; complexity ${ageGuide.complexity}.`,
      `Length: ${ageGuide.wordCount} (aim midpoint).`,
      safetyRule,
      kidsFluencyRule
    ].filter(Boolean).join('\n- ');

    const userPrompt = [
      `Create an opening for an interactive ${existingStory.story_type || 'short'} story.`,
      `Context: ${prompt}`,
      processedCharacters.length > 0 ? `Make these the clear focus: ${processedCharacters.map(c => c.reference).join(', ')}` : undefined,
      USE_JSON_OPENING
        ? `CRITICAL: Return ONLY valid JSON with this EXACT structure:\n{\n  "content": "story narrative text WITHOUT any choices mentioned",\n  "choices": [\n    {"id": 1, "text": "choice 1 text", "impact": "what happens if chosen"},\n    {"id": 2, "text": "choice 2 text", "impact": "what happens if chosen"}\n  ],\n  "is_ending": false\n}\n\nThe "content" field must contain ONLY the story narrative. Do NOT include choice text in the content field. Choices go ONLY in the "choices" array.`
        : `End with 2–3 meaningful choices; each choice includes a brief, concrete consequence (impact). Impacts must be short, distinct, and non-duplicative.`,
      languageCode === 'sv' ? `🚨 CRITICAL SWEDISH LANGUAGE REQUIREMENTS - MANDATORY:
1. Write EVERYTHING in Swedish (Svenska) - story content, choices, and impacts
2. Use natural, fluent Swedish that sounds like a native Swedish children's book author wrote it
3. Translate ALL character descriptions to Swedish (e.g., "the friendly dragon" → "den vänliga draken")
4. Use Swedish idioms, expressions, and sentence structures
5. NO English words mixed into Swedish sentences - this is absolutely forbidden
6. Character names/descriptions must be in Swedish: "the brave knight" → "den modiga riddaren", "the curious cat" → "den nyfikna katten"
7. Double-check: Every single word must be Swedish, including character references

EXAMPLES OF CORRECT SWEDISH:
✅ "Den vänliga draken leker hemma."
✅ "De hittar en skattkarta tillsammans."
❌ "När the friendly dragon leker hemma." ← NEVER MIX LANGUAGES LIKE THIS` : undefined
    ].filter(Boolean).join('\n');

    timings.promptBuilding = Date.now() - startTotal;

    logger.info('[PERF] Prompt built', {
      requestId,
      storyId,
      charactersCount: processedCharacters.length,
      promptBuildingMs: timings.promptBuilding,
      operation: 'perf-tracking'
    });

    // Prepare JSON schema if feature flag is enabled
    const jsonSchema = {
      type: 'object',
      properties: {
        content: { type: 'string' },
        choices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              text: { type: 'string' },
              impact: { type: 'string' }
            },
            required: ['text']
          },
          minItems: 2,
          maxItems: 3
        },
        is_ending: { type: 'boolean' }
      },
      required: ['content', 'choices']
    };

    const aiStartTime = Date.now();
    const { result: aiResponse, duration } = await withTiming(async () => {
      return await aiService.generate('story-generation', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        responseFormat: USE_JSON_OPENING ? 'json' : 'text',
        ...(USE_JSON_OPENING ? { schema: jsonSchema } : {}),
        temperature: 0.7
      }, languageCode);  // Pass language code for model selection
    });
    timings.aiGeneration = Date.now() - aiStartTime;

    logger.info('[PERF] AI generation completed', {
      requestId,
      provider: aiResponse.provider,
      model: aiResponse.model,
      aiGenerationMs: timings.aiGeneration,
      withTimingDuration: duration,
      tokensUsed: aiResponse.tokensUsed,
      operation: 'perf-tracking'
    });

    // [DEBUG] Log raw AI response to diagnose content format issue
    logger.info('[DEBUG] Raw AI response', {
      requestId,
      contentType: typeof aiResponse.content,
      contentKeys: typeof aiResponse.content === 'object' ? Object.keys(aiResponse.content) : undefined,
      contentSample: typeof aiResponse.content === 'string'
        ? aiResponse.content.substring(0, 200)
        : JSON.stringify(aiResponse.content).substring(0, 500),
      operation: 'debug-ai-response'
    });

    const parseStartTime = Date.now();
    let storyContent = '';
    let choices: any[] = [];

    if (USE_JSON_OPENING) {
      // Normalize AI response: some models return {opening: "...", choices: [...]} instead of {content: "...", choices: [...]}
      let normalizedResponse = aiResponse.content;
      if (normalizedResponse && typeof normalizedResponse === 'object') {
        if (normalizedResponse.opening && !normalizedResponse.content) {
          normalizedResponse = {
            content: normalizedResponse.opening,
            choices: normalizedResponse.choices || [],
            is_ending: normalizedResponse.is_ending || false
          };
          logger.info('[NORMALIZE] Converted "opening" field to "content"', {
            requestId,
            choicesCount: normalizedResponse.choices?.length,
            operation: 'response-normalization'
          });
        }
      }

      // Validate/normalize JSON response
      const validated = ResponseHandler.validateAndNormalize(
        normalizedResponse,
        Validators.storySegment,
        () => {
          // Fallback: try to extract content from the raw response
          let fallbackContent = '';
          if (typeof normalizedResponse === 'string') {
            fallbackContent = normalizedResponse;
          } else if (normalizedResponse && typeof normalizedResponse === 'object') {
            // Try to extract text from common fields
            fallbackContent = normalizedResponse.content ||
                            normalizedResponse.opening ||
                            normalizedResponse.text ||
                            normalizedResponse.story ||
                            normalizedResponse.narrative ||
                            JSON.stringify(normalizedResponse);
          }
          return { content: String(fallbackContent || ''), choices: [] };
        }
      );

      // [DEBUG] Log validated content
      logger.info('[DEBUG] Validated content', {
        requestId,
        contentType: typeof validated.content,
        contentLength: validated.content?.length,
        contentSample: validated.content?.substring(0, 200),
        choicesCount: validated.choices?.length,
        operation: 'debug-validated-content'
      });

      storyContent = validated.content;
      choices = validated.choices || [];
    } else {
      // Legacy text parsing fallback
      const rawContent = aiResponse.content;
      const contentMatch = rawContent.match(/CONTENT:\s*([\s\S]*?)(?=CHOICES:|$)/);
      const choicesMatch = rawContent.match(/CHOICES:\s*([\s\S]*)/);
      storyContent = contentMatch?.[1]?.trim() || rawContent;

      if (choicesMatch) {
        const choiceLines = choicesMatch[1].split('\n').filter((line: string) => line.trim());
        choices = choiceLines.map((line: string, index: number) => {
          const cleaned = line.replace(/^\d+\.\s*/, '').trim();
          const match = cleaned.match(/^(.*?)(?:\s*[—\-–]\s*Impact:\s*(.*))?$/i);
          const text = (match?.[1] || '').trim();
          const impact = (match?.[2] || '').trim();
          return { id: index + 1, text, impact: impact || undefined };
        }).filter((choice: any) => choice.text);
      }

      if (choices.length === 0) {
        choices = [
          { id: 1, text: 'Continue the adventure', consequences: null },
          { id: 2, text: 'Explore a different path', consequences: null },
          { id: 3, text: 'Take a moment to think', consequences: null }
        ];
      }
    }

    // ========== TEXT VALIDATION & CORRECTION ==========
    // Apply post-processing to fix common grammar errors
    storyContent = validateAndCorrectText(storyContent, ageGroup);
    choices = choices.map((choice: any) => ({
      ...choice,
      text: validateAndCorrectText(choice.text, ageGroup),
      impact: choice.impact ? validateAndCorrectText(choice.impact, ageGroup) : undefined
    }));

    // Enforce word range for opening CONTENT portion (choices handled separately)
    {
      const { min, max } = parseWordRange(AGE_GUIDELINES[ageGroup as keyof typeof AGE_GUIDELINES].wordCount);
      const wc = countWords(storyContent);
      if (wc > max) {
        logger.warn('Opening exceeds max words, trimming', { requestId, wordCount: wc, maxWords: max, operation: 'word-count-validation' });
        storyContent = trimToMaxWords(storyContent, max);
      }
      logger.info('Opening segment word count validated', { requestId, wordCount: wc, targetRange: `${min}-${max}`, ageGroup });
    }

    timings.responseParsing = Date.now() - parseStartTime;

    logger.info('[PERF] Response parsed and validated', {
      requestId,
      responseParsingMs: timings.responseParsing,
      contentLength: storyContent.length,
      choicesCount: choices.length,
      operation: 'perf-tracking'
    });

    // Update story status (in progress, not completed yet)
    const dbStartTime = Date.now();
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update({
        status: 'in_progress',
        credits_used: (existingStory.credits_used || 0) + creditValidation.creditsRequired,
      })
      .eq('id', storyId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update story status', updateError, { requestId, storyId });
      throw new Error('Failed to update story');
    }

    timings.dbUpdateStory = Date.now() - dbStartTime;

    // [DEBUG] Log content before saving to database
    logger.info('[DEBUG] Content before DB save', {
      requestId,
      contentType: typeof storyContent,
      contentLength: storyContent?.length,
      contentSample: typeof storyContent === 'string' ? storyContent.substring(0, 200) : JSON.stringify(storyContent).substring(0, 200),
      isObjectObject: storyContent === '[object Object]',
      operation: 'debug-db-save'
    });

    // Safety check: prevent saving "[object Object]"
    if (storyContent === '[object Object]' || !storyContent || storyContent.trim() === '') {
      logger.error('[CRITICAL] Story content is invalid', {
        requestId,
        storyContent,
        aiResponseType: typeof aiResponse.content,
        aiResponseSample: JSON.stringify(aiResponse.content).substring(0, 500),
        operation: 'content-validation'
      });
      throw new Error('Failed to extract valid story content from AI response');
    }

    // Create or replace opening segment (segment_number=1) with content and choices
    const segmentStartTime = Date.now();
    const { error: segmentError } = await supabase
      .from('story_segments')
      .upsert({
        story_id: storyId,
        segment_number: 1,
        content: storyContent,
        segment_text: storyContent,
        is_ending: choices.length === 0,
        choices: choices
      }, { onConflict: 'story_id,segment_number' });

    if (segmentError) {
      logger.error('Failed to save story segment', segmentError, { requestId, storyId });
      throw new Error('Failed to save story content');
    }

    timings.dbSaveSegment = Date.now() - segmentStartTime;

    logger.info('[PERF] Database operations completed', {
      requestId,
      dbUpdateStoryMs: timings.dbUpdateStory,
      dbSaveSegmentMs: timings.dbSaveSegment,
      operation: 'perf-tracking'
    });

    // Deduct credits AFTER successful generation and persistence
    const creditResult = await deductCreditsAfterSuccess(
      creditService,
      userId,
      'storyGeneration',
      creditValidation.creditsRequired,
      storyId,
      { requestId }
    );
    logger.info('Credits deducted after successful story generation', { 
      requestId, 
      creditsUsed: creditValidation.creditsRequired, 
      newBalance: creditResult.newBalance 
    });

    timings.total = Date.now() - startTotal;

    logger.info('[PERF] Story generation completed - FULL BREAKDOWN', {
      requestId,
      storyId,
      language: languageCode,
      model: aiResponse.model,
      provider: aiResponse.provider,
      timings: {
        promptBuilding: timings.promptBuilding,
        aiGeneration: timings.aiGeneration,
        responseParsing: timings.responseParsing,
        dbUpdateStory: timings.dbUpdateStory,
        dbSaveSegment: timings.dbSaveSegment,
        total: timings.total
      },
      percentages: {
        promptBuilding: `${((timings.promptBuilding / timings.total) * 100).toFixed(1)}%`,
        aiGeneration: `${((timings.aiGeneration / timings.total) * 100).toFixed(1)}%`,
        responseParsing: `${((timings.responseParsing / timings.total) * 100).toFixed(1)}%`,
        dbOperations: `${(((timings.dbUpdateStory + timings.dbSaveSegment) / timings.total) * 100).toFixed(1)}%`
      },
      operation: 'perf-summary'
    });

    // Construct segments array for frontend compatibility
    // Frontend expects data.segments array to avoid fallback DB fetch
    const segments = [];

    // Validate segment data before constructing response
    if (storyContent && storyContent.trim().length > 0) {
      segments.push({
        segment_number: 1,
        content: storyContent,
        choices: Array.isArray(choices) ? choices : [],
        is_ending: !choices || choices.length === 0
      });
      logger.info('Segment constructed for response', {
        requestId,
        segmentNumber: 1,
        contentLength: storyContent.length,
        choicesCount: choices.length
      });
    } else {
      logger.warn('Story content is empty, returning empty segments array', { requestId });
    }

    return ResponseHandler.success({
      story_id: storyId,
      content: storyContent,
      segments: segments,  // Add segments array for frontend compatibility
      credits_used: creditValidation.creditsRequired,
      credits_remaining: creditResult.newBalance,
    }, aiResponse.model, { requestId, processingTime: duration });

  } catch (error) {
    logger.error('Story generation failed', error, { requestId, operation: 'story-generation' });
    
    // Handle insufficient credits error
    if ((error as any)?.message?.includes('Insufficient credits')) {
      return ResponseHandler.error('Insufficient credits', 400, { 
        error_code: 'INSUFFICIENT_CREDITS',
        requestId 
      });
    }

    return ResponseHandler.error(
      (error as any)?.message || 'Failed to generate story', 
      500, 
      { requestId }
    );
  }
});