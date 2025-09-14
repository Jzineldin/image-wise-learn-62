/**
 * Standardized Response Handling
 * 
 * This module provides consistent response handling, validation, and error management
 * across all AI operations. It ensures type safety and proper error reporting.
 */

// ============= TYPES & INTERFACES =============

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  model_used?: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    fallbackUsed?: boolean;
    [key: string]: any;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============= CORS HEADERS =============

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
   * Create an error response
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

    console.error('API Error:', message, details);

    return new Response(JSON.stringify(response), {
      status,
      headers: CORS_HEADERS
    });
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
        console.warn('Response validation warnings:', validation.warnings);
      }
      return validator.normalize(response);
    }

    console.error('Response validation failed:', validation.errors);

    if (fallbackGenerator) {
      console.log('Using fallback response generator');
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
  
  validate(response: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!response) {
      errors.push('Response is null or undefined');
      return { isValid: false, errors, warnings };
    }

    // Validate content
    if (!response.content) {
      errors.push('Missing content field');
    } else if (typeof response.content !== 'string') {
      errors.push('Content must be a string');
    } else if (response.content.trim().length === 0) {
      errors.push('Content cannot be empty');
    }

    // Validate choices
    if (!response.choices) {
      errors.push('Missing choices array');
    } else if (!Array.isArray(response.choices)) {
      errors.push('Choices must be an array');
    } else {
      if (response.choices.length === 0) {
        warnings.push('No choices provided');
      }

      response.choices.forEach((choice: any, index: number) => {
        if (choice.id === undefined) errors.push(`Choice ${index}: missing id`);
        if (!choice.text) errors.push(`Choice ${index}: missing text`);
        if (!choice.impact) warnings.push(`Choice ${index}: missing impact`);
        
        // Handle legacy formats
        if (choice.choice_text && !choice.text) {
          warnings.push(`Choice ${index}: using legacy 'choice_text' field`);
        }
        if (choice.implications && !choice.impact) {
          warnings.push(`Choice ${index}: using legacy 'implications' field`);
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
    return {
      content: String(response.content || '').trim(),
      choices: (response.choices || []).map((choice: any, index: number) => ({
        id: Number(choice.id ?? index),
        text: String(choice.text || choice.choice_text || `Choice ${index + 1}`),
        impact: String(choice.impact || choice.implications || 'Unknown consequence')
      })),
      is_ending: Boolean(response.is_ending)
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