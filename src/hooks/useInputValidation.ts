/**
 * Client-side input validation hook using Zod schemas
 * Provides real-time validation with user-friendly error messages
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { ValidationSchemas, sanitizeText, sanitizeHtml } from '@/lib/schemas/validation';
import type { 
  Character, 
  StoryCreation, 
  Contact, 
  Feedback, 
  ProfileUpdate 
} from '@/lib/schemas/validation';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData?: any;
}

interface UseValidationOptions {
  validateOnChange?: boolean;
  sanitizeInputs?: boolean;
}

export const useInputValidation = <T extends z.ZodSchema>(
  schema: T,
  options: UseValidationOptions = { validateOnChange: false, sanitizeInputs: true }
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((data: any): ValidationResult => {
    try {
      // Sanitize inputs if enabled
      let sanitizedData = data;
      if (options.sanitizeInputs) {
        sanitizedData = sanitizeInputData(data);
      }

      // Validate with Zod schema
      const result = schema.safeParse(sanitizedData);
      
      if (result.success) {
        setErrors({});
        setIsValid(true);
        return {
          isValid: true,
          errors: {},
          sanitizedData: result.data
        };
      } else {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((error) => {
          const path = error.path.join('.');
          fieldErrors[path] = error.message;
        });
        
        setErrors(fieldErrors);
        setIsValid(false);
        return {
          isValid: false,
          errors: fieldErrors,
          sanitizedData
        };
      }
    } catch (error) {
      const generalError = { general: 'Validation failed' };
      setErrors(generalError);
      setIsValid(false);
      return {
        isValid: false,
        errors: generalError
      };
    }
  }, [schema, options]);

  const validateField = useCallback((fieldName: string, value: any) => {
    if (!options.validateOnChange) return;

    try {
      // Create a partial object for single field validation
      const fieldData = { [fieldName]: value };
      
      // For schemas that support partial validation
      if ('partial' in schema && typeof schema.partial === 'function') {
        const result = (schema as any).partial().safeParse(fieldData);
        
        if (result.success || !result.error?.errors.find((e: any) => e.path.includes(fieldName))) {
          // Remove error for this field if validation passes
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
        } else {
          // Set error for this field
          const fieldError = result.error.errors.find((e: any) => e.path.includes(fieldName));
          if (fieldError) {
            setErrors(prev => ({
              ...prev,
              [fieldName]: fieldError.message
            }));
          }
        }
      }
    } catch (error) {
      // Ignore validation errors during typing
    }
  }, [schema, options]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return errors[fieldName] || '';
  }, [errors]);

  const hasFieldError = useCallback((fieldName: string) => {
    return !!errors[fieldName];
  }, [errors]);

  return {
    validate,
    validateField,
    clearErrors,
    getFieldError,
    hasFieldError,
    errors,
    isValid
  };
};

// Sanitization helper
const sanitizeInputData = (data: any): any => {
  if (typeof data === 'string') {
    return sanitizeText(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInputData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInputData(value);
    }
    return sanitized;
  }
  
  return data;
};

// Specific validation hooks for common forms
export const useStoryValidation = (options?: UseValidationOptions) => {
  return useInputValidation(ValidationSchemas.StoryCreation, options);
};

export const useCharacterValidation = (options?: UseValidationOptions) => {
  return useInputValidation(ValidationSchemas.Character, options);
};

export const useContactValidation = (options?: UseValidationOptions) => {
  return useInputValidation(ValidationSchemas.Contact, options);
};

export const useFeedbackValidation = (options?: UseValidationOptions) => {
  return useInputValidation(ValidationSchemas.Feedback, options);
};

export const useProfileValidation = (options?: UseValidationOptions) => {
  return useInputValidation(ValidationSchemas.ProfileUpdate, options);
};

// File upload validation hook
export const useFileValidation = () => {
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Size validation (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    // Type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 
      'audio/mpeg', 'audio/wav', 'audio/mp3'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, MP3, WAV' 
      };
    }

    // Name validation
    if (file.name.length > 255) {
      return { isValid: false, error: 'Filename too long (max 255 characters)' };
    }

    return { isValid: true };
  }, []);

  return { validateFile };
};

// Rate limiting hook for client-side throttling
export const useRateLimit = (maxRequests: number, windowMs: number) => {
  const [requests, setRequests] = useState<number[]>([]);

  const checkRateLimit = useCallback((): { allowed: boolean; remaining: number } => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filter out expired requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    const newRequests = [...validRequests, now];
    setRequests(newRequests);

    return { 
      allowed: true, 
      remaining: maxRequests - newRequests.length 
    };
  }, [requests, maxRequests, windowMs]);

  const resetRateLimit = useCallback(() => {
    setRequests([]);
  }, []);

  return { checkRateLimit, resetRateLimit };
};

// Export validation utilities for direct use
export { ValidationSchemas, sanitizeText, sanitizeHtml } from '@/lib/schemas/validation';