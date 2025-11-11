/**
 * AI Client - moved from lib/ai-client.ts for better organization
 * 
 * Unified AI Client for Frontend
 * Provides consistent interface for calling edge functions with proper error handling,
 * validation, and response parsing.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logger";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

export interface AIClientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
  model_used?: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    fallbackUsed?: boolean;
  };
}

export interface CreditError {
  code: 'INSUFFICIENT_CREDITS';
  required: number;
  available: number;
  message: string;
}

export class AIClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

export class InsufficientCreditsError extends AIClientError {
  public creditsRequired: number;
  public creditsAvailable: number;
  
  constructor(
    public required: number,
    public available: number
  ) {
    super(`Insufficient credits. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_CREDITS', 400);
    this.creditsRequired = required;
    this.creditsAvailable = available;
  }
}

/**
 * Unified AI client for making edge function calls
 */
export class AIClient {
  private static failureCount = new Map<string, number>();
  private static lastFailureTime = new Map<string, number>();
  private static readonly MAX_FAILURES = 3;
  private static readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  /**
   * Call an edge function with unified error handling and circuit breaker
   */
  static async invoke<T = any>(
    functionName: string,
    body: any,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<AIClientResponse<T>> {
    const { timeout = 30000, retries = 0 } = options; // No retries for credit operations to prevent double charges
    
    // Check circuit breaker
    const failures = this.failureCount.get(functionName) || 0;
    const lastFailure = this.lastFailureTime.get(functionName) || 0;
    const now = Date.now();
    
    if (failures >= this.MAX_FAILURES && now - lastFailure < this.CIRCUIT_BREAKER_TIMEOUT) {
      throw new AIClientError(
        `Circuit breaker open for ${functionName}. Too many failures.`,
        'CIRCUIT_BREAKER_OPEN',
        503
      );
    }
    
    // Reset circuit breaker if timeout passed
    if (now - lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
      this.failureCount.set(functionName, 0);
    }
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const shouldLog = attempt === 0 || this.shouldLogRetry(functionName, attempt);
        if (shouldLog) {
          logger.apiCall(functionName, { attempt: attempt + 1, retries: retries + 1 });
        }
        
        // Get fresh session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new AIClientError('Authentication required', 'AUTH_REQUIRED', 401);
        }

        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          // Optional dev flag to enable JSON opening path in Edge Function
          const featureHdr = ((import.meta as any)?.env?.VITE_FEATURE_JSON_OPENING === 'true')
            ? { 'x-feature-json-opening': 'true' }
            : {};

          const { data, error } = await supabase.functions.invoke(functionName, {
            body,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              ...featureHdr,
            }
          });

          clearTimeout(timeoutId);

          // Handle supabase-js errors using Context7 patterns
          if (error) {
            logger.error(`${functionName} supabase error`, error);

            // Context7 Pattern: Distinguish between error types
            if (error instanceof FunctionsHttpError) {
              // Function returned an error response
              const errorMessage = await error.context.json().catch(() => ({
                error: 'Function returned an error',
                message: error.message
              }));

              logger.warn('Function returned an error', { errorMessage, functionName });

              // Check for insufficient credits in function response
              if (errorMessage.error?.includes('Insufficient credits') ||
                  errorMessage.message?.includes('Insufficient credits')) {
                const match = (errorMessage.error || errorMessage.message || '').match(/Required: (\d+), Available: (\d+)/);
                if (match) {
                  throw new InsufficientCreditsError(
                    parseInt(match[1]),
                    parseInt(match[2])
                  );
                }
              }

              throw new AIClientError(
                errorMessage.error || errorMessage.message || 'Function execution failed',
                'FUNCTION_ERROR',
                error.context.status || 500,
                error
              );

            } else if (error instanceof FunctionsRelayError) {
              // Network/relay error - retry might help
              logger.warn('Relay error', { error: error.message, functionName });
              throw new AIClientError(
                'Network error occurred. Please check your connection and try again.',
                'NETWORK_ERROR',
                503,
                error
              );

            } else if (error instanceof FunctionsFetchError) {
              // Function unreachable - likely server issue
              logger.warn('Fetch error', { error: error.message, functionName });
              throw new AIClientError(
                'Service temporarily unavailable. Please try again in a moment.',
                'SERVICE_UNAVAILABLE',
                503,
                error
              );

            } else {
              // Fallback for other error types
              const errorMessage = this.parseSupabaseError(error);
              const errorCode = this.classifyError(error, errorMessage);

              throw new AIClientError(
                errorMessage,
                errorCode,
                (error as any).status || 500,
                error
              );
            }
          }

          if (shouldLog) {
            logger.apiResponse(functionName, true, { 
              success: data?.success,
              hasData: !!data?.data,
              errorCode: data?.error_code
            });
          }

          // Handle structured error responses from edge functions
          if (data && !data.success) {
            if (data.error_code === 'INSUFFICIENT_CREDITS') {
              throw new InsufficientCreditsError(
                data.metadata?.required || 1,
                data.metadata?.available || 0
              );
            }

            // Convert error to string if it's an object
            let errorMessage = 'Edge function returned error';
            if (data.error) {
              errorMessage = typeof data.error === 'string'
                ? data.error
                : JSON.stringify(data.error);
            }

            throw new AIClientError(
              errorMessage,
              data.error_code,
              400,
              data
            );
          }

          // Validate response structure
          if (!data) {
            throw new AIClientError('No response data received', 'NO_DATA', 500);
          }

          // Reset failure count on success
          this.failureCount.set(functionName, 0);

          return {
            success: true,
            data: data.data || data, // Handle both wrapped and unwrapped responses
            model_used: data.model_used,
            metadata: data.metadata
          };

        } finally {
          clearTimeout(timeoutId);
        }

      } catch (error) {
        const shouldLogError = attempt === 0 || this.shouldLogRetry(functionName, attempt);
        if (shouldLogError) {
          logger.error(`${functionName} attempt ${attempt + 1} failed`, error, { functionName, attempt: attempt + 1 });
        }
        lastError = error as Error;
        
        // Update failure tracking
        if (error instanceof AIClientError) {
          this.failureCount.set(functionName, failures + 1);
          this.lastFailureTime.set(functionName, now);
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(error as AIClientError)) {
          throw error;
        }
        
        // Wait before retry with exponential backoff + jitter
        if (attempt < retries) {
          const baseDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          if (shouldLogError) {
            logger.info(`Retrying ${functionName} in ${Math.round(delay)}ms`, { functionName, delay, attempt });
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError!;
  }

  /**
   * Determine if an error is retryable (Context7 Pattern)
   */
  private static isRetryableError(error: AIClientError): boolean {
    if (!error.code) return true; // Unknown errors are retryable

    // Context7 Pattern: Only retry network/relay errors
    const retryableCodes = [
      'NETWORK_ERROR',      // FunctionsRelayError
      'SERVICE_UNAVAILABLE', // FunctionsFetchError
      'TIMEOUT'             // Request timeout
    ];

    const nonRetryableCodes = [
      'AUTH_REQUIRED',
      'INSUFFICIENT_CREDITS',
      'VALIDATION_ERROR',
      'PROVIDER_RESPONSE_ERROR',
      'API_FORMAT_ERROR',
      'CIRCUIT_BREAKER_OPEN',
      'FUNCTION_ERROR'      // FunctionsHttpError - don't retry function logic errors
    ];

    // Context7 Pattern: Explicit retry logic
    if (retryableCodes.includes(error.code)) return true;
    if (nonRetryableCodes.includes(error.code)) return false;

    // Don't retry 4xx errors except for specific cases
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return error.statusCode === 408 || error.statusCode === 429; // Timeout or rate limit
    }

    return true;
  }

  /**
   * Classify error type for better handling
   */
  private static classifyError(error: any, message: string): string {
    if (message.includes('Insufficient credits')) return 'INSUFFICIENT_CREDITS';
    if (message.includes('Authentication') || message.includes('Unauthorized')) return 'AUTH_REQUIRED';
    if (message.includes('not valid JSON') || message.includes('unexpected token')) return 'API_FORMAT_ERROR';
    if (message.includes('Rate limit') || message.includes('429')) return 'RATE_LIMITED';
    if (message.includes('timeout') || message.includes('aborted')) return 'TIMEOUT';
    
    return 'EDGE_FUNCTION_ERROR';
  }

  /**
   * Determine if retry attempts should be logged (reduce noise)
   */
  private static shouldLogRetry(functionName: string, attempt: number): boolean {
    // Always log first attempt and final attempt
    if (attempt === 0) return true;
    
    // Log every retry for critical functions
    const criticalFunctions = ['generate-story', 'generate-story-segment'];
    if (criticalFunctions.includes(functionName)) return true;
    
    // For other functions, only log final retry attempt
    return attempt >= 2;
  }

  /**
   * Parse supabase-js error objects for better error messages
   */
  private static parseSupabaseError(error: any): string {
    if (error?.context?.message) {
      return error.context.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Unknown edge function error';
  }

  /**
   * Generate story segment with proper error handling
   */
  static async generateStorySegment(params: {
    storyId: string;
    choiceId: number;
    choiceText: string;
    previousSegmentContent: string;
    storyContext: any;
    segmentNumber: number;
    requestId: string;
  }) {
    return this.invoke('generate-story-segment', params, { timeout: 45000, retries: 1 });
  }

  /**
   * Generate story seeds with proper error handling
   */
  static async generateStorySeeds(params: {
    genre?: string;
    ageGroup?: string;
    language?: string;
    count?: number;
  }) {
    return this.invoke('generate-story-seeds', params, { timeout: 30000, retries: 1 });
  }

  /**
   * Generate character reference image with proper error handling
   */
  static async generateCharacterReferenceImage(params: {
    characterId: string;
    characterName: string;
    characterDescription: string;
    characterType: string;
    ageGroup?: string;
    backstory?: string;
    personalityTraits?: string[];
  }) {
    const body = {
      character_id: params.characterId,
      character_name: params.characterName,
      character_description: params.characterDescription,
      character_type: params.characterType,
      age_group: params.ageGroup,
      backstory: params.backstory,
      personality_traits: params.personalityTraits
    };

    return this.invoke('generate-character-reference-image', body, { timeout: 60000, retries: 2 });
  }

  /**
   * Generate story image with proper error handling
   * Note: Prompt building is now handled by the Edge Function with age-appropriate styles
   */
  static async generateStoryImage(params: {
    storyContent: string;
    storyTitle: string;
    ageGroup: string;
    genre: string;
    segmentNumber: number;
    storyId: string;
    segmentId: string;
    characters?: any[];
    requestId: string;
  }) {
    // Map camelCase IDs to snake_case expected by the Edge Function
    // The Edge Function will build the narrative prompt with age-appropriate styles
    const { storyId, segmentId, ...rest } = params as any;
    const body = { ...rest, story_id: storyId, segment_id: segmentId };

    return this.invoke('generate-story-image', body, { timeout: 60000, retries: 2 });
  }

  /**
   * Generate initial story with proper error handling
   */
  static async generateStory(params: {
    prompt: string;
    genre: string;
    ageGroup: string;
    storyId: string;
    languageCode: string;
    isInitialGeneration: boolean;
    characters: any[];
  }) {
    return this.invoke('generate-story', params, { timeout: 45000, retries: 1 });
  }

  /**
   * Generate audio narration for story segment with proper error handling
   */
  static async generateStoryAudio(params: {
    segmentId: string;
    text: string;
    voiceId?: string;
    requestId?: string;
  }) {
    const { segmentId, text, voiceId, requestId } = params;
    const body = {
      segment_id: segmentId,
      text,
      voice_id: voiceId || 'default',
      request_id: requestId,
    };

    return this.invoke('generate-story-audio', body, { timeout: 30000, retries: 1 });
  }

  /**
   * Generate video for story segment using v2 endpoint with subscription check
   */
  static async generateStoryVideo(params: {
    segmentId: string;
    storyId: string;
    imageUrl: string;
    prompt?: string;
    waitForCompletion?: boolean;
  }) {
    // Map to v2 endpoint parameters
    const { segmentId, imageUrl, prompt } = params;
    const body = {
      segment_id: segmentId,
      imageUrl: imageUrl,
      prompt: prompt || '',
      includeNarration: false
    };

    // V2 endpoint handles video generation synchronously
    return this.invoke('generate-video-v2', body, { timeout: 180000, retries: 1 });
  }

  /**
   * Check video generation status with proper error handling
   */
  static async checkVideoStatus(params: {
    taskId: string;
    provider: string;
    segmentId?: string;
    updateDatabase?: boolean;
  }) {
    const { taskId, segmentId, updateDatabase, ...rest } = params;
    const body = {
      ...rest,
      task_id: taskId,
      segment_id: segmentId,
      update_database: updateDatabase !== false // Default to true
    };

    return this.invoke('check-video-status', body, { timeout: 15000, retries: 2 });
  }

  /**
   * ============================================================================
   * V2 METHODS - Google AI Studio Integration with Master Storyteller Prompts
   * ============================================================================
   * These methods use the proven prompts from the working Google app for
   * significantly better quality at lower cost.
   */

  /**
   * Generate story page with V2 (Google AI Studio - Master Storyteller)
   *
   * Uses proven "master storyteller" persona and age-appropriate prompts
   * from the working Google app. Generates both text + image in one call.
   *
   * Cost: 2 credits (1 for text, 1 for image)
   * Quality: ⭐⭐⭐⭐⭐ (vs ⭐⭐⭐ for old system)
   */
  static async generateStoryPageV2(params: {
    childName: string;
    ageGroup: '4-6 years old' | '7-9 years old' | '10-12 years old' | '13+ years old';
    theme: string;
    character: string;
    traits?: string;
    prompt: string;
    storyId?: string;
    segmentNumber?: number;
  }) {
    logger.info('V2 Story Page Generation (Google AI Studio)', {
      ageGroup: params.ageGroup,
      theme: params.theme,
      character: params.character,
      method: 'generate-story-page-v2'
    });

    // Map camelCase to snake_case expected by the Edge Function
    const { storyId, segmentNumber, ...rest } = params as any;
    const body = { ...rest, story_id: storyId, segment_number: segmentNumber };

    return this.invoke('generate-story-page-v2', body, {
      timeout: 60000,
      retries: 1
    });
  }

  /**
   * Generate audio with V2 (Gemini TTS - FREE!)
   *
   * Uses Gemini TTS for narration - completely FREE during preview period.
   * Replaces expensive ElevenLabs ($11-99/month).
   *
   * Available voices:
   * - Kore: Friendly Narrator (default)
   * - Puck: Adventurous Hero
   * - Charon: Wise Owl
   * - Fenrir: Gentle Giant
   * - Zephyr: Mystical Sprite
   *
   * Cost: 0 credits (FREE!)
   * Quality: High-quality, natural-sounding voices
   */
  static async generateAudioV2(params: {
    text: string;
    voiceId?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  }) {
    logger.info('V2 Audio Generation (Gemini TTS - FREE)', {
      voiceId: params.voiceId || 'Kore',
      textLength: params.text.length,
      method: 'generate-audio-v2'
    });

    return this.invoke('generate-audio-v2', {
      text: params.text,
      voiceId: params.voiceId || 'Kore'
    }, {
      timeout: 30000,
      retries: 1
    });
  }

  /**
   * Generate video with V2 (Veo 3.1)
   *
   * Uses Veo 3.1 for high-quality video animation from static images.
   * Much better quality than Freepik at lower cost (~$0.10 vs $0.50-2).
   *
   * Note: Requires Google AI Studio API quota for video generation.
   *
   * Cost: 2 credits
   * Quality: ⭐⭐⭐⭐⭐ (cinematic, smooth animation)
   */
  static async generateVideoV2(params: {
    segmentId: string;
    imageUrl?: string;
    imageBase64?: string;
    prompt: string;
    includeNarration?: boolean;
  }) {
    const body = {
      segment_id: params.segmentId,
      imageUrl: params.imageUrl,
      imageBase64: params.imageBase64,
      prompt: params.prompt,
      includeNarration: params.includeNarration || false
    };

    logger.info('V2 Video Generation (Veo 3.1)', {
      segmentId: params.segmentId,
      includeNarration: body.includeNarration,
      hasImageUrl: !!params.imageUrl,
      hasImageBase64: !!params.imageBase64,
      method: 'generate-video-v2'
    });

    return this.invoke('generate-video-v2', body, {
      timeout: 300000, // 5 minutes for video generation + polling
      retries: 0 // Don't retry video (expensive operation)
    });
  }

  /**
   * Generate video async with V2 (Veo 3.1) - Background Processing
   *
   * Starts video generation in background and returns immediately with job_id.
   * Frontend can subscribe to job status updates via Supabase Realtime.
   * User can navigate away and video will continue generating.
   *
   * Cost: 2 credits
   * Time: Returns immediately (~1 second), video generates in ~55 seconds
   * Quality: ⭐⭐⭐⭐⭐ (same as generateVideoV2)
   */
  static async generateVideoAsync(params: {
    segmentId: string;
    imageUrl?: string;
    imageBase64?: string;
    prompt: string;
    includeNarration?: boolean;
  }) {
    const body = {
      segment_id: params.segmentId,
      imageUrl: params.imageUrl,
      imageBase64: params.imageBase64,
      prompt: params.prompt,
      includeNarration: params.includeNarration || false
    };

    logger.info('V2 Async Video Generation (Veo 3.1)', {
      segmentId: params.segmentId,
      includeNarration: body.includeNarration,
      hasImageUrl: !!params.imageUrl,
      hasImageBase64: !!params.imageBase64,
      method: 'generate-video-async'
    });

    return this.invoke('generate-video-async', body, {
      timeout: 30000, // 30 seconds - just to create job
      retries: 1 // Can retry job creation
    });
  }

  /**
   * ============================================================================
   * CIRCUIT BREAKER UTILITIES
   * ============================================================================
   */

  /**
   * Get circuit breaker status for a specific function
   */
  static getCircuitBreakerStatus(functionName: string): {
    isOpen: boolean;
    failures: number;
    timeUntilReset: number;
  } {
    const failures = this.failureCount.get(functionName) || 0;
    const lastFailure = this.lastFailureTime.get(functionName) || 0;
    const now = Date.now();
    const isOpen = failures >= this.MAX_FAILURES && now - lastFailure < this.CIRCUIT_BREAKER_TIMEOUT;
    const timeUntilReset = isOpen ? Math.max(0, this.CIRCUIT_BREAKER_TIMEOUT - (now - lastFailure)) : 0;

    return {
      isOpen,
      failures,
      timeUntilReset,
    };
  }

  /**
   * Manually reset circuit breaker for a specific function
   */
  static resetCircuitBreaker(functionName: string): void {
    this.failureCount.set(functionName, 0);
    this.lastFailureTime.set(functionName, 0);
    logger.info('Circuit breaker manually reset', { functionName });
  }

  /**
   * Get all circuit breaker statuses
   */
  static getAllCircuitBreakerStatuses(): Record<string, {
    isOpen: boolean;
    failures: number;
    timeUntilReset: number;
  }> {
    const statuses: Record<string, any> = {};

    // Get all tracked functions
    const allFunctions = new Set([
      ...Array.from(this.failureCount.keys()),
      ...Array.from(this.lastFailureTime.keys()),
    ]);

    for (const functionName of allFunctions) {
      statuses[functionName] = this.getCircuitBreakerStatus(functionName);
    }

    return statuses;
  }
}