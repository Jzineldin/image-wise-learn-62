/**
 * Unified AI Client for Frontend
 * 
 * Provides consistent interface for calling edge functions with proper error handling,
 * validation, and response parsing.
 */

import { supabase } from '@/integrations/supabase/client';

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
  /**
   * Call an edge function with unified error handling
   */
  static async invoke<T = any>(
    functionName: string,
    body: any,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<AIClientResponse<T>> {
    const { timeout = 30000, retries = 0 } = options;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🚀 Calling ${functionName} (attempt ${attempt + 1}/${retries + 1})`);
        
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
              'EDGE_FUNCTION_ERROR',
              (error as any).status || 500,
              error
            );
          }

          console.log(`✅ ${functionName} response received:`, { 
            success: data?.success,
            hasData: !!data?.data,
            errorCode: data?.error_code
          });

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
        console.error(`❌ ${functionName} attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
        
        // Don't retry on authentication or credit errors
        if (error instanceof AIClientError && 
            ['AUTH_REQUIRED', 'INSUFFICIENT_CREDITS'].includes(error.code || '')) {
          throw error;
        }
        
        // Don't retry on client errors (4xx)
        if (error instanceof AIClientError && error.statusCode && error.statusCode < 500) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`⏳ Retrying ${functionName} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError!;
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