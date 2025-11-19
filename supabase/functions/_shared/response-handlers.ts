/**
 * Standardized Response Handling
 * 
 * This module provides consistent response handling, validation, and error management
 * across all AI operations. It ensures type safety and proper error reporting.
 */

import { logger } from './logger.ts';

// ============= TYPES & INTERFACES =============

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  } | string; // Support legacy string errors
  model_used?: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    fallbackUsed?: boolean;
    creditsUsed?: number;
    creditsRemaining?: number;
    provider?: string;
    [key: string]: any;
  };
}

// Standard error codes for consistent client handling
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  PROVIDER_RESPONSE_ERROR: 'PROVIDER_RESPONSE_ERROR',
  PROVIDER_LIMIT: 'PROVIDER_LIMIT',
  API_FORMAT_ERROR: 'API_FORMAT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'TIMEOUT',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============= CORS HEADERS =============

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

// ============= RESPONSE HANDLERS =============

export class ResponseHandler {
  
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    model?: string,
    metadata?: any
  ): Response {
    const response: StandardResponse<T> = {
      success: true,
      data,
      ...(model && { model_used: model }),
      ...(metadata && { metadata })
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  /**
   * Create an error response (legacy)
   */
  static error(
    message: string,
    status: number = 500,
    details?: any
  ): Response {
    const response: StandardResponse = {
      success: false,
      error: message,
      ...(details && { metadata: { details } })
    };

    logger.error('API Error', { message, details }, { operation: 'response-handler' });

    return new Response(JSON.stringify(response), {
      status,
      headers: CORS_HEADERS
    });
  }

  /**
   * Create an error response with error code
   */
  static errorWithCode(
    code: ErrorCode,
    message: string,
    details?: any,
    context?: any
  ): Response {
    const response: StandardResponse = {
      success: false,
      error: {
        code,
        message,
        details
      },
      ...(context && { metadata: { context } })
    };

    logger.error(`${code}`, { message, context, details, timestamp: new Date().toISOString() }, { operation: 'response-handler' });

    // Use 200 status for known errors to avoid browser network error handling
    const status = this.isClientError(code) ? 200 : 500;

    return new Response(JSON.stringify(response), {
      status,
      headers: CORS_HEADERS
    });
  }

  /**
   * Map common errors to standard error codes
   */
  static mapError(error: any): { code: ErrorCode; message: string; details?: any } {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Check for specific error patterns
    if (error.code === 'INSUFFICIENT_CREDITS') {
      return {
        code: ERROR_CODES.INSUFFICIENT_CREDITS,
        message: errorMessage,
        details: {
          required: error.required,
          available: error.available
        }
      };
    }

    if (errorMessage.includes('billing_hard_limit_reached') || 
        errorMessage.includes('rate_limit_exceeded')) {
      return {
        code: ERROR_CODES.PROVIDER_LIMIT,
        message: 'AI provider limit reached. Please try again later.',
        details: { originalError: errorMessage }
      };
    }

    if (errorMessage.includes('API error') || 
        errorMessage.includes('failed to fetch')) {
      return {
        code: ERROR_CODES.PROVIDER_ERROR,
        message: 'AI provider temporarily unavailable',
        details: { originalError: errorMessage }
      };
    }

    if (errorMessage.includes('timeout') || 
        errorMessage.includes('timed out')) {
      return {
        code: ERROR_CODES.TIMEOUT,
        message: 'Operation timed out. Please try again.',
        details: { originalError: errorMessage }
      };
    }

    if (errorMessage.includes('authentication') || 
        errorMessage.includes('unauthorized')) {
      return {
        code: ERROR_CODES.AUTHENTICATION_FAILED,
        message: 'Authentication failed',
        details: { originalError: errorMessage }
      };
    }

    // Default to internal error
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: { originalError: errorMessage }
    };
  }

  /**
   * Handle errors with automatic mapping and response
   */
  static handleError(error: any, context?: any): Response {
    const mapped = this.mapError(error);
    return this.errorWithCode(mapped.code, mapped.message, mapped.details, context);
  }

  /**
   * Check if error code represents a client error (use 200 status)
   */
  private static isClientError(code: ErrorCode): boolean {
    return [
      ERROR_CODES.INSUFFICIENT_CREDITS,
      ERROR_CODES.PROVIDER_LIMIT,
      ERROR_CODES.INVALID_REQUEST,
      ERROR_CODES.AUTHENTICATION_FAILED,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_CODES.PROVIDER_ERROR,
      ERROR_CODES.PROVIDER_RESPONSE_ERROR,
      ERROR_CODES.API_FORMAT_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      ERROR_CODES.RATE_LIMITED,
      ERROR_CODES.TIMEOUT,
      ERROR_CODES.CIRCUIT_BREAKER_OPEN
    ].includes(code);
  }

  /**
   * Handle CORS preflight requests
   */
  static corsOptions(): Response {
    return new Response(null, {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  /**
   * Validate and normalize AI response
   */
  static validateAndNormalize<T>(
    response: any,
    validator: ResponseValidator<T>,
    fallbackGenerator?: () => T
  ): T {
    const validation = validator.validate(response);
    
    if (validation.isValid) {
      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn('Response validation warnings', { warnings: validation.warnings, operation: 'response-validation' });
      }
      return validator.normalize(response);
    }

    logger.error('Response validation failed', { errors: validation.errors }, { operation: 'response-validation' });

    if (fallbackGenerator) {
      logger.info('Using fallback response generator', { operation: 'response-validation' });
      return fallbackGenerator();
    }

    throw new Error(`Invalid response format: ${validation.errors.join(', ')}`);
  }
}

// ============= RESPONSE VALIDATORS =============

export abstract class ResponseValidator<T> {
  abstract validate(response: any): ValidationResult;
  abstract normalize(response: any): T;
}

/**
 * Story Seeds Response Validator
 */
export class StorySeedsValidator extends ResponseValidator<{
  seeds: Array<{ id: string; title: string; description: string }>;
}> {
  
  validate(response: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!response) {
      errors.push('Response is null or undefined');
      return { isValid: false, errors, warnings };
    }

    if (!response.seeds) {
      errors.push('Missing seeds array');
      return { isValid: false, errors, warnings };
    }

    if (!Array.isArray(response.seeds)) {
      errors.push('Seeds is not an array');
      return { isValid: false, errors, warnings };
    }

    if (response.seeds.length === 0) {
      errors.push('Seeds array is empty');
      return { isValid: false, errors, warnings };
    }

    if (response.seeds.length !== 3) {
      warnings.push(`Expected 3 seeds, got ${response.seeds.length}`);
    }

    response.seeds.forEach((seed: any, index: number) => {
      if (!seed.id) errors.push(`Seed ${index}: missing id`);
      if (!seed.title) errors.push(`Seed ${index}: missing title`);
      if (!seed.description) errors.push(`Seed ${index}: missing description`);
      
      if (typeof seed.id !== 'string') warnings.push(`Seed ${index}: id should be string`);
      if (typeof seed.title !== 'string') warnings.push(`Seed ${index}: title should be string`);
      if (typeof seed.description !== 'string') warnings.push(`Seed ${index}: description should be string`);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  normalize(response: any) {
    return {
      seeds: response.seeds.map((seed: any, index: number) => ({
        id: String(seed.id || `seed-${index + 1}`),
        title: String(seed.title || 'Untitled Adventure'),
        description: String(seed.description || 'An exciting adventure awaits!')
      }))
    };
  }
}

/**
 * Story Segment Response Validator
 */
export class StorySegmentValidator extends ResponseValidator<{
  content: string;
  choices: Array<{ id: number; text: string; impact: string }>;
  is_ending?: boolean;
}> {
  
  private coerceContent(resp: any): string | undefined {
    const candidates = [
      resp?.content,
      resp?.content_text,
      resp?.story,
      resp?.narrative,
      resp?.segment,
      resp?.text,
      resp?.body,
      resp?.opening  // Add 'opening' field for Cydonia model
    ];

    // First, try to find a direct string value
    const c = candidates.find(v => typeof v === 'string' && v.trim().length > 0);
    if (c) return String(c);

    // If not found, check if any candidate is an object with nested text fields
    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object') {
        // Try common nested text fields
        const nestedCandidates = [
          candidate.opening,  // Cydonia model uses 'opening' field
          candidate.text,
          candidate.content,
          candidate.story,
          candidate.narrative,
          candidate.value,
          candidate.body
        ];
        const nested = nestedCandidates.find(v => typeof v === 'string' && v.trim().length > 0);
        if (nested) return String(nested);

        // If it's an array, try to join it
        if (Array.isArray(candidate)) {
          const joined = candidate
            .filter(item => typeof item === 'string')
            .join('\n\n');
          if (joined.trim().length > 0) return joined;
        }
      }
    }

    return undefined;
  }

  private extractChoiceText(choice: any): string | undefined {
    if (typeof choice === 'string') return choice;
    const candidates = [
      choice?.text,
      choice?.choice_text,
      choice?.label,
      choice?.option,
      choice?.description
    ];
    const t = candidates.find(v => typeof v === 'string' && v.trim().length > 0);
    return t ? String(t) : undefined;
  }

  validate(response: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!response) {
      errors.push('Response is null or undefined');
      return { isValid: false, errors, warnings };
    }

    const content = this.coerceContent(response);
    if (!content) {
      errors.push('Missing content field');
    } else {
      // Validate character references - look for capitalized character names
      const capitalizedCharacters = content.match(/\b[A-Z][a-z]+\s+[Cc]at\b|\b[A-Z][a-z]+\s+[Dd]og\b|\b[A-Z][a-z]+\s+[Bb]ear\b|\b[A-Z][a-z]+\s+[Bb]ird\b|\b[A-Z][a-z]+\s+[Rr]abbit\b|\b[A-Z][a-z]+\s+[Ff]ox\b|\b[A-Z][a-z]+\s+[Mm]ouse\b|\b[A-Z][a-z]+\s+[Ww]olf\b|\b[A-Z][a-z]+\s+[Bb]utterfly\b|\b[A-Z][a-z]+\s+[Oo]wl\b/g);
      if (capitalizedCharacters && capitalizedCharacters.length > 0) {
        warnings.push(`Content contains capitalized character names: ${capitalizedCharacters.join(', ')}. Will auto-correct to lowercase references.`);
      }
    }

    const choices = response?.choices;
    if (!choices) {
      errors.push('Missing choices array');
    } else if (!Array.isArray(choices)) {
      errors.push('Choices must be an array');
    } else {
      if (choices.length === 0) {
        warnings.push('No choices provided');
      }

      choices.forEach((choice: any, index: number) => {
        const text = this.extractChoiceText(choice);
        if (!text) {
          errors.push(`Choice ${index}: missing text`);
        }
        // id missing becomes a warning; we'll auto-assign
        const id = typeof choice === 'object' ? choice?.id : undefined;
        if (id === undefined) warnings.push(`Choice ${index}: missing id (will auto-assign)`);
        
        // Check impact description - warn if missing/inadequate, normalize will provide default
        const impact = typeof choice === 'object' ? (choice?.impact || choice?.implications) : undefined;
        if (!impact || impact.trim() === '' || impact.toLowerCase().includes('unknown')) {
          warnings.push(`Choice ${index}: missing or inadequate impact description. Will use default consequence description.`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  normalize(response: any) {
    let content = this.coerceContent(response) || '';
    const choicesArr = Array.isArray(response?.choices) ? response.choices : [];

    // Safety check: if content is still an object, try to extract text from it
    if (typeof content === 'object' && content !== null) {
      logger.warn('[CONTENT-FIX] Content is still an object after coercion, attempting deep extraction', {
        contentType: typeof content,
        contentKeys: Object.keys(content),
        operation: 'content-normalization'
      });

      // Try to extract text from the object
      const textValue = content.text || content.content || content.story || content.narrative || content.value;
      if (typeof textValue === 'string') {
        content = textValue;
      } else {
        // Last resort: stringify the object and log a warning
        logger.error('[CONTENT-FIX] Failed to extract text from object, using JSON.stringify', {
          contentSample: JSON.stringify(content).substring(0, 200),
          operation: 'content-normalization'
        });
        content = JSON.stringify(content);
      }
    }

    // Auto-correct character references in content
    content = String(content)
      .replace(/\b([A-Z][a-z]+)\s+(cat|dog|bear|bird|rabbit|fox|mouse|wolf|butterfly|owl)\b/gi,
               (match, adjective, animal) => `the ${adjective.toLowerCase()} ${animal.toLowerCase()}`)
      .replace(/\b(Curious|Brave|Wise|Friendly|Clever|Bold|Gentle|Swift|Playful|Kind)\s+(Cat|Dog|Bear|Bird|Rabbit|Fox|Mouse|Wolf|Butterfly|Owl)\b/g,
               (match, adjective, animal) => `the ${adjective.toLowerCase()} ${animal.toLowerCase()}`);

    const normalizedChoices = choicesArr.map((choice: any, index: number) => {
      const text = this.extractChoiceText(choice) || `Choice ${index + 1}`;
      const idRaw = typeof choice === 'object' ? choice?.id : undefined;
      const id = Number.isFinite(Number(idRaw)) ? Number(idRaw) : index + 1;
      const impact = typeof choice === 'object'
        ? (choice?.impact || choice?.implications || 'This leads to new adventures')
        : 'This leads to new adventures';
      return { id, text: String(text), impact: String(impact) };
    });

    // Derive is_ending from multiple hints
    const isEndingRaw = response?.is_ending ?? response?.isEnding ?? response?.ending ?? response?.final;
    const is_ending = Boolean(isEndingRaw);

    // Final safety check: ensure content is never "[object Object]"
    const finalContent = String(content).trim();
    if (finalContent === '[object Object]' || finalContent === '') {
      logger.error('[CONTENT-FIX] Content is "[object Object]" or empty after normalization', {
        originalResponse: JSON.stringify(response).substring(0, 500),
        operation: 'content-normalization'
      });
      throw new Error('Failed to extract valid content from AI response');
    }

    return {
      content: finalContent,
      choices: normalizedChoices,
      is_ending
    };
  }
}


/**
 * Story Titles Response Validator
 */
export class StoryTitlesValidator extends ResponseValidator<{
  titles: string[];
  recommended: string;
}> {
  
  validate(response: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!response) {
      errors.push('Response is null or undefined');
      return { isValid: false, errors, warnings };
    }

    if (!response.titles) {
      errors.push('Missing titles array');
    } else if (!Array.isArray(response.titles)) {
      errors.push('Titles must be an array');
    } else {
      if (response.titles.length < 3) {
        errors.push('Need at least 3 titles');
      }
      if (response.titles.length > 5) {
        warnings.push('More than 5 titles provided, will be truncated');
      }
    }

    if (!response.recommended) {
      warnings.push('No recommended title specified');
    } else if (!response.titles?.includes(response.recommended)) {
      warnings.push('Recommended title not in titles array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  normalize(response: any) {
    const titles = (response.titles || [])
      .map((title: any) => String(title))
      .filter((title: string) => title.trim().length > 0)
      .slice(0, 5);

    // Ensure we have at least 3 titles
    while (titles.length < 3) {
      titles.push(`Adventure Story ${titles.length + 1}`);
    }

    const recommended = response.recommended && titles.includes(response.recommended)
      ? response.recommended
      : titles[0];

    return {
      titles,
      recommended
    };
  }
}

// ============= UTILITY FUNCTIONS =============

/**
 * Measure processing time for operations
 */
export function withTiming<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  return operation().then(result => ({
    result,
    duration: Date.now() - start
  }));
}

/**
 * Create validator instances
 */
export const Validators = {
  storySeeds: new StorySeedsValidator(),
  storySegment: new StorySegmentValidator(),
  storyTitles: new StoryTitlesValidator()
};

// ============= WORD COUNT UTILITIES =============

/**
 * Parse a word range string like "80-110 words" into { min, max }
 */
export function parseWordRange(range: string): { min: number; max: number } {
  const m = range.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return { min: 0, max: Number.MAX_SAFE_INTEGER };
  const min = parseInt(m[1], 10);
  const max = parseInt(m[2], 10);
  return { min, max };
}

/** Count words in a string (tokens split on whitespace) */
export function countWords(text: string): number {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

/** Trim content to a maximum number of words */
export function trimToMaxWords(text: string, max: number): string {
  const words = (text || '').trim().split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(' ');
}
