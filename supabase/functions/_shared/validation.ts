/**
 * Server-side validation utilities for Edge Functions
 * Provides secure input validation and sanitization
 */

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

// Validation utilities
export class InputValidator {
  
  /**
   * Validate UUID format
   */
  static validateUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Validate string length and content
   */
  static validateString(
    value: string, 
    minLength: number = 0, 
    maxLength: number = 1000,
    allowedChars?: RegExp
  ): ValidationResult<string> {
    if (typeof value !== 'string') {
      return { success: false, error: 'Value must be a string' };
    }

    const trimmed = value.trim();
    
    if (trimmed.length < minLength) {
      return { success: false, error: `Minimum length is ${minLength} characters` };
    }
    
    if (trimmed.length > maxLength) {
      return { success: false, error: `Maximum length is ${maxLength} characters` };
    }

    if (allowedChars && !allowedChars.test(trimmed)) {
      return { success: false, error: 'Contains invalid characters' };
    }

    return { success: true, data: trimmed };
  }

  /**
   * Validate age group
   */
  static validateAgeGroup(ageGroup: string): ValidationResult<string> {
    const validAgeGroups = ['4-6', '7-9', '10-12', '13+'];
    if (!validAgeGroups.includes(ageGroup)) {
      return { success: false, error: `Invalid age group. Must be one of: ${validAgeGroups.join(', ')}` };
    }
    return { success: true, data: ageGroup };
  }

  /**
   * Validate genre
   */
  static validateGenre(genre: string): ValidationResult<string> {
    const validGenres = ['Fantasy', 'Adventure', 'Mystery', 'Superhero Stories', 'Animal Stories', 'Fairy Tales'];
    if (!validGenres.includes(genre)) {
      return { success: false, error: `Invalid genre. Must be one of: ${validGenres.join(', ')}` };
    }
    return { success: true, data: genre };
  }

  /**
   * Validate language code
   */
  static validateLanguageCode(languageCode: string): ValidationResult<string> {
    const validLanguages = ['en', 'sv'];
    if (!validLanguages.includes(languageCode)) {
      return { success: false, error: `Invalid language. Must be one of: ${validLanguages.join(', ')}` };
    }
    return { success: true, data: languageCode };
  }

  /**
   * Validate story creation request
   */
  static validateStoryRequest(body: any): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!body.storyId || !this.validateUUID(body.storyId)) {
      errors.push('Valid story ID is required');
    }

    const promptResult = this.validateString(body.prompt, 1, 2000);
    if (!promptResult.success) {
      errors.push(`Prompt: ${promptResult.error}`);
    }

    const genreResult = this.validateGenre(body.genre);
    if (!genreResult.success) {
      errors.push(genreResult.error!);
    }

    const ageGroupResult = this.validateAgeGroup(body.ageGroup);
    if (!ageGroupResult.success) {
      errors.push(ageGroupResult.error!);
    }

    // Optional fields
    if (body.languageCode) {
      const langResult = this.validateLanguageCode(body.languageCode);
      if (!langResult.success) {
        errors.push(langResult.error!);
      }
    }

    // Characters validation
    if (body.characters && Array.isArray(body.characters)) {
      if (body.characters.length > 5) {
        errors.push('Maximum 5 characters allowed');
      }

      body.characters.forEach((char: any, index: number) => {
        const nameResult = this.validateString(char.name, 2, 50, /^[\p{L}\p{M}\s\-'']+$/u);
        if (!nameResult.success) {
          errors.push(`Character ${index + 1} name: ${nameResult.error}`);
        }

        const descResult = this.validateString(char.description, 0, 500);
        if (!descResult.success) {
          errors.push(`Character ${index + 1} description: ${descResult.error}`);
        }
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true };
  }

  /**
   * Validate story segment request
   */
  static validateSegmentRequest(body: any): ValidationResult {
    const errors: string[] = [];

    const storyId = body.story_id || body.storyId;
    if (!storyId || !this.validateUUID(storyId)) {
      errors.push('Valid story ID is required');
    }

    if (body.choice) {
      const choiceResult = this.validateString(body.choice, 0, 500);
      if (!choiceResult.success) {
        errors.push(`Choice: ${choiceResult.error}`);
      }
    }

    if (body.segment_number !== undefined) {
      if (!Number.isInteger(body.segment_number) || body.segment_number < 1 || body.segment_number > 100) {
        errors.push('Segment number must be an integer between 1 and 100');
      }
    }

    return errors.length > 0 ? { success: false, errors } : { success: true };
  }

  /**
   * Validate image generation request
   */
  static validateImageRequest(body: any): ValidationResult {
    const errors: string[] = [];

    if (body.prompt) {
      const promptResult = this.validateString(body.prompt, 5, 500);
      if (!promptResult.success) {
        errors.push(`Prompt: ${promptResult.error}`);
      }
    }

    if (body.storyContent) {
      const contentResult = this.validateString(body.storyContent, 0, 2000);
      if (!contentResult.success) {
        errors.push(`Story content: ${contentResult.error}`);
      }
    }

    if (!body.prompt && !body.storyContent) {
      errors.push('Either prompt or story content must be provided');
    }

    if (body.story_id && !this.validateUUID(body.story_id)) {
      errors.push('Invalid story ID format');
    }

    if (body.segment_id && !this.validateUUID(body.segment_id)) {
      errors.push('Invalid segment ID format');
    }

    if (body.ageGroup) {
      const ageResult = this.validateAgeGroup(body.ageGroup);
      if (!ageResult.success) {
        errors.push(ageResult.error!);
      }
    }

    if (body.genre) {
      const genreResult = this.validateGenre(body.genre);
      if (!genreResult.success) {
        errors.push(genreResult.error!);
      }
    }

    return errors.length > 0 ? { success: false, errors } : { success: true };
  }
}

/**
 * Sanitization utilities
 */
export class InputSanitizer {
  
  /**
   * Sanitize text input to prevent XSS and injection attacks
   */
  static sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .substring(0, 2000); // Limit length
  }

  /**
   * Sanitize HTML content (basic implementation)
   */
  static sanitizeHtml(html: string): string {
    if (typeof html !== 'string') return '';
    
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '');
  }

  /**
   * Sanitize and validate JSON
   */
  static sanitizeJson(json: any): any {
    if (typeof json !== 'object' || json === null) {
      return {};
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(json)) {
      if (typeof key === 'string' && key.length <= 100) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeText(value);
        } else if (typeof value === 'number' && isFinite(value)) {
          sanitized[key] = value;
        } else if (typeof value === 'boolean') {
          sanitized[key] = value;
        } else if (Array.isArray(value)) {
          sanitized[key] = value.slice(0, 10).map(item => 
            typeof item === 'string' ? this.sanitizeText(item) : item
          );
        }
      }
    }

    return sanitized;
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check if request is within rate limits
   */
  static checkLimit(
    identifier: string, 
    maxRequests: number = 10, 
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `${identifier}`;
    
    const existing = this.requests.get(key);
    
    if (!existing || now >= existing.resetTime) {
      // New window
      const resetTime = now + windowMs;
      this.requests.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }
    
    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    }
    
    existing.count++;
    this.requests.set(key, existing);
    
    return { 
      allowed: true, 
      remaining: maxRequests - existing.count, 
      resetTime: existing.resetTime 
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now >= data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Security audit logging
 */
export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'validation_error' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: any;
  timestamp: number;
}

export class SecurityAuditor {
  /**
   * Log security event
   */
  static logEvent(event: SecurityEvent): void {
    console.warn('[SECURITY]', {
      ...event,
      timestamp: new Date(event.timestamp).toISOString()
    });
  }

  /**
   * Log authentication failure
   */
  static logAuthFailure(details: any, request?: Request): void {
    this.logEvent({
      type: 'auth_failure',
      ip: request?.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      details,
      timestamp: Date.now()
    });
  }

  /**
   * Log rate limit violation
   */
  static logRateLimit(identifier: string, details: any): void {
    this.logEvent({
      type: 'rate_limit',
      details: { identifier, ...details },
      timestamp: Date.now()
    });
  }

  /**
   * Log validation error
   */
  static logValidationError(errors: string[], request?: Request): void {
    this.logEvent({
      type: 'validation_error',
      ip: request?.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      details: { errors },
      timestamp: Date.now()
    });
  }
}