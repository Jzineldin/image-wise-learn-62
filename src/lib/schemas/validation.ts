/**
 * Comprehensive validation schemas for Tale Forge application
 * Provides client-side and server-side input validation using Zod
 */

import { z } from 'zod';

// Base validation constants
const VALID_AGE_GROUPS = ['4-6', '7-9', '10-12', '13+'] as const;
const VALID_GENRES = [
  'adventure', 'fantasy', 'mystery', 'animals', 'fairy-tales', 'superhero'
] as const;
const VALID_LANGUAGES = ['en', 'sv'] as const;
const VALID_STORY_TYPES = ['short', 'medium', 'long'] as const;
const VALID_VISIBILITY = ['private', 'public'] as const;

// Character validation
export const CharacterSchema = z.object({
  name: z.string()
    .min(2, 'Character name must be at least 2 characters')
    .max(50, 'Character name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-'áàäâéèëêíìïîóòöôúùüûåæøñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÅÆØÑÇ]+$/, 'Invalid character name'),
  description: z.string()
    .min(10, 'Character description must be at least 10 characters')
    .max(200, 'Character description must be less than 200 characters'),
  personality: z.string()
    .max(100, 'Personality must be less than 100 characters')
    .optional(),
  character_type: z.string()
    .max(50, 'Character type must be less than 50 characters')
    .optional()
});

// Story creation validation
export const StoryCreationSchema = z.object({
  title: z.string()
    .min(3, 'Story title must be at least 3 characters')
    .max(100, 'Story title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-'!?.,:áàäâéèëêíìïîóòöôúùüûåæøñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÅÆØÑÇ]+$/, 'Invalid characters in title'),
  prompt: z.string()
    .min(10, 'Story prompt must be at least 10 characters')
    .max(1000, 'Story prompt must be less than 1000 characters'),
  genre: z.enum(VALID_GENRES, { errorMap: () => ({ message: 'Invalid genre' }) }),
  ageGroup: z.enum(VALID_AGE_GROUPS, { errorMap: () => ({ message: 'Invalid age group' }) }),
  languageCode: z.enum(VALID_LANGUAGES).default('en'),
  story_type: z.enum(VALID_STORY_TYPES).default('short'),
  visibility: z.enum(VALID_VISIBILITY).default('private'),
  characters: z.array(CharacterSchema).max(5, 'Maximum 5 characters allowed').optional()
});

// Story segment validation
export const StorySegmentSchema = z.object({
  story_id: z.string().uuid('Invalid story ID'),
  choice: z.string()
    .max(500, 'Choice text too long')
    .optional(),
  segment_number: z.number()
    .int('Segment number must be an integer')
    .min(1, 'Segment number must be positive')
    .max(100, 'Maximum 100 segments allowed')
    .optional()
});

// Image generation validation
export const ImageGenerationSchema = z.object({
  prompt: z.string()
    .min(5, 'Image prompt must be at least 5 characters')
    .max(500, 'Image prompt must be less than 500 characters')
    .optional(),
  storyContent: z.string().max(2000, 'Story content too long').optional(),
  storyTitle: z.string().max(100, 'Story title too long').optional(),
  ageGroup: z.enum(VALID_AGE_GROUPS).optional(),
  genre: z.enum(VALID_GENRES).optional(),
  story_id: z.string().uuid('Invalid story ID').optional(),
  segment_id: z.string().uuid('Invalid segment ID').optional(),
  style: z.string().max(50, 'Style name too long').optional()
}).refine(data => data.prompt || data.storyContent, {
  message: 'Either prompt or story content must be provided'
});

// Audio generation validation
export const AudioGenerationSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(2000, 'Text too long for audio generation'),
  voice_id: z.string()
    .min(1, 'Voice ID required')
    .max(100, 'Voice ID too long'),
  segment_id: z.string().uuid('Invalid segment ID').optional(),
  story_id: z.string().uuid('Invalid story ID').optional()
});

// User profile validation
export const ProfileUpdateSchema = z.object({
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_áàäâéèëêíìïîóòöôúùüûåæøñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÅÆØÑÇ]+$/, 'Invalid characters in display name')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  preferred_language: z.enum(VALID_LANGUAGES).optional()
});

// Feedback validation
export const FeedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general'], { errorMap: () => ({ message: 'Invalid feedback type' }) }),
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional()
});

// Contact form validation
export const ContactSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'áàäâéèëêíìïîóòöôúùüûåæøñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÅÆØÑÇ]+$/, 'Invalid characters in name'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
});

// Sanitization utilities
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 2000); // Limit length
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// File upload validation
export const FileUploadSchema = z.object({
  file: z.object({
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav'].includes(type),
      'Invalid file type'
    ),
    name: z.string().max(255, 'Filename too long')
  })
});

// Rate limiting validation
export const RateLimitSchema = z.object({
  operation: z.enum(['story_generation', 'image_generation', 'audio_generation', 'contact_form']),
  timeWindow: z.number().min(1000).max(86400000), // 1 second to 24 hours in ms
  maxRequests: z.number().min(1).max(1000)
});

// Export all schemas for use across the application
export const ValidationSchemas = {
  Character: CharacterSchema,
  StoryCreation: StoryCreationSchema,
  StorySegment: StorySegmentSchema,
  ImageGeneration: ImageGenerationSchema,
  AudioGeneration: AudioGenerationSchema,
  ProfileUpdate: ProfileUpdateSchema,
  Feedback: FeedbackSchema,
  Contact: ContactSchema,
  FileUpload: FileUploadSchema,
  RateLimit: RateLimitSchema
} as const;

// Type exports
export type Character = z.infer<typeof CharacterSchema>;
export type StoryCreation = z.infer<typeof StoryCreationSchema>;
export type StorySegment = z.infer<typeof StorySegmentSchema>;
export type ImageGeneration = z.infer<typeof ImageGenerationSchema>;
export type AudioGeneration = z.infer<typeof AudioGenerationSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type RateLimit = z.infer<typeof RateLimitSchema>;