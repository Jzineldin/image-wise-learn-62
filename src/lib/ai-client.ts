/**
 * Unified AI Client for Frontend
 * 
 * Provides consistent interface for calling edge functions with proper error handling,
 * validation, and response parsing.
 */

import { supabase } from '@/integrations/supabase/client';
import { generateRequestId } from '@/lib/debug';

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
  constructor(
    public required: number,
    public available: number
  ) {
    super(`Insufficient credits. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_CREDITS', 400);
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
    const { timeout = 30000, retries = 1 } = options; // Reduced default retries
    
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
          console.log(`🚀 Calling ${functionName} (attempt ${attempt + 1}/${retries + 1})`);
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
          const { data, error } = await supabase.functions.invoke(functionName, {
            body,
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });

          clearTimeout(timeoutId);

          // Handle supabase-js errors (network, auth, etc.)
          if (error) {
            console.error(`❌ ${functionName} supabase error:`, error);
            
            // Check for specific error patterns
            const errorMessage = this.parseSupabaseError(error);
            const errorCode = this.classifyError(error, errorMessage);
            
            if (errorMessage.includes('Insufficient credits')) {
              const match = errorMessage.match(/Required: (\d+), Available: (\d+)/);
              if (match) {
                throw new InsufficientCreditsError(
                  parseInt(match[1]), 
                  parseInt(match[2])
                );
              }
            }
            
            throw new AIClientError(
              errorMessage,
              errorCode,
              (error as any).status || 500,
              error
            );
          }

          if (shouldLog) {
            console.log(`✅ ${functionName} response received:`, { 
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
            
            throw new AIClientError(
              data.error || 'Edge function returned error',
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
          console.error(`❌ ${functionName} attempt ${attempt + 1} failed:`, error);
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
            console.log(`⏳ Retrying ${functionName} in ${Math.round(delay)}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError!;
  }

  /**
   * Determine if an error is retryable
   */
  private static isRetryableError(error: AIClientError): boolean {
    if (!error.code) return true; // Unknown errors are retryable
    
    const nonRetryableCodes = [
      'AUTH_REQUIRED',
      'INSUFFICIENT_CREDITS', 
      'VALIDATION_ERROR',
      'PROVIDER_RESPONSE_ERROR',
      'API_FORMAT_ERROR',
      'CIRCUIT_BREAKER_OPEN'
    ];
    
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
   * Generate story image with proper error handling
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
    // Build comprehensive prompt from story details
    const characterNames = params.characters?.map(c => c.name).filter(Boolean).join(', ') || '';
    const characterDesc = characterNames ? ` featuring characters ${characterNames}` : '';
    
    const prompt = `A children's book illustration for "${params.storyTitle}" (${params.ageGroup} age group, ${params.genre} genre). Scene: ${params.storyContent.slice(0, 200)}...${characterDesc}. Style: colorful, friendly, safe for children, high quality digital art.`;
    
    return this.invoke('generate-story-image', { ...params, prompt }, { timeout: 60000, retries: 2 });
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
}