/**
 * Story API utilities - consolidated from storyGeneration.ts
 * Handles all story-related API operations
 */

import { supabase } from '@/integrations/supabase/client';
import { getOperationEstimate, isOperationSupported } from '@/lib/constants/ai-constants';
import { logger, generateRequestId } from '@/lib/debug';
import { AIClient, AIClientError, InsufficientCreditsError } from './ai-client';

// ============= TYPES & INTERFACES =============

export interface StoryGenerationOptions {
  prompt: string;
  ageGroup: string;
  genre: string;
  characters: Array<{
    name: string;
    description: string;
    role: string;
  }>;
  languageCode?: string;
  storyLength?: 'short' | 'medium' | 'long';
}

export interface StoryGenerationResult {
  story: string;
  model_used: string;
  language: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    provider?: string;
  };
}

export interface AudioGenerationOptions {
  text: string;
  voice?: string;
  languageCode?: string;
  storyId?: string;
  segmentId?: string;
  modelId?: string;
}

export interface AudioGenerationResult {
  audioContent: string;
  audioUrl?: string;
  voice: string;
  language: string;
  duration: number;
}

export interface TranslationOptions {
  content: string;
  fromLanguage: string;
  toLanguage: string;
  contentType: 'story' | 'segment' | 'title' | 'description';
  storyId?: string;
  segmentId?: string;
}

export interface TranslationResult {
  translatedContent: string;
  fromLanguage: string;
  toLanguage: string;
  contentType: string;
  originalLength: number;
  translatedLength: number;
}

// ============= STORY GENERATION =============

/**
 * Generate a story using the centralized AI architecture with Context7 error handling
 */
export const generateStory = async (options: StoryGenerationOptions): Promise<StoryGenerationResult> => {
  // Validate operation support
  if (!isOperationSupported('story-generation', options.ageGroup, options.genre)) {
    throw new AIClientError(
      `Story generation not supported for age group: ${options.ageGroup}, genre: ${options.genre}`,
      'VALIDATION_ERROR',
      400
    );
  }

  const requestId = generateRequestId();
  logger.info('Generating story with centralized AI service', {
    requestId,
    ageGroup: options.ageGroup,
    genre: options.genre,
    charactersCount: options.characters.length,
    estimate: getOperationEstimate('story-generation'),
    operation: 'story-generation'
  });

  try {
    // Context7 Pattern: Use AIClient for consistent error handling
    const response = await AIClient.invoke('generate-story', options, {
      timeout: 60000,
      retries: 2
    });

    if (!response.success || !response.data) {
      throw new AIClientError(
        response.error || 'Story generation failed',
        response.error_code || 'GENERATION_ERROR',
        400
      );
    }

    return response.data;
  } catch (error) {
    logger.error('Story generation failed', error, { requestId, operation: 'story-generation' });

    // Re-throw AIClient errors as-is (they have proper Context7 error handling)
    if (error instanceof AIClientError || error instanceof InsufficientCreditsError) {
      throw error;
    }

    // Wrap other errors
    throw new AIClientError(
      error instanceof Error ? error.message : 'Failed to generate story',
      'GENERATION_ERROR',
      500
    );
  }
};

/**
 * Generate audio for text using AI text-to-speech with Context7 error handling
 */
export const generateAudio = async (options: AudioGenerationOptions): Promise<AudioGenerationResult> => {
  // Map parameters to match edge function expectations
  const requestBody = {
    text: options.text,
    voiceId: options.voice, // Edge function supports voiceId
    languageCode: options.languageCode,
    story_id: options.storyId,
    segment_id: options.segmentId,
    modelId: options.modelId
  };

  try {
    // Context7 Pattern: Use AIClient for consistent error handling
    const response = await AIClient.invoke('generate-story-audio', requestBody, {
      timeout: 90000,
      retries: 2
    });

    if (!response.success || !response.data) {
      throw new AIClientError(
        response.error || 'Audio generation failed',
        response.error_code || 'AUDIO_GENERATION_ERROR',
        400
      );
    }

    return response.data;
  } catch (error) {
    logger.error('Audio generation failed', error, { operation: 'audio-generation', options });

    // Re-throw AIClient errors as-is (they have proper Context7 error handling)
    if (error instanceof AIClientError || error instanceof InsufficientCreditsError) {
      throw error;
    }

    // Wrap other errors
    throw new AIClientError(
      error instanceof Error ? error.message : 'Failed to generate audio',
      'AUDIO_GENERATION_ERROR',
      500
    );
  }
};

/**
 * Translate content from one language to another with Context7 error handling
 */
export const translateContent = async (options: TranslationOptions): Promise<TranslationResult> => {
  try {
    // Context7 Pattern: Use AIClient for consistent error handling
    const response = await AIClient.invoke('translate-content', options, {
      timeout: 30000,
      retries: 2
    });

    if (!response.success || !response.data) {
      throw new AIClientError(
        response.error || 'Translation failed',
        response.error_code || 'TRANSLATION_ERROR',
        400
      );
    }

    return response.data;
  } catch (error) {
    logger.error('Translation failed', error, { operation: 'translation', options });

    // Re-throw AIClient errors as-is (they have proper Context7 error handling)
    if (error instanceof AIClientError || error instanceof InsufficientCreditsError) {
      throw error;
    }

    // Wrap other errors
    throw new AIClientError(
      error instanceof Error ? error.message : 'Failed to translate content',
      'TRANSLATION_ERROR',
      500
    );
  }
};

/**
 * Generate a story ending using AI with Context7 error handling
 */
export const generateStoryEnding = async (options: {
  storyId: string;
  currentSegments: Array<{
    segment_number: number;
    content: string;
  }>;
  genre: string;
  ageGroup: string;
  characters?: Array<{ name: string; description: string }>;
}) => {
  try {
    // Context7 Pattern: Use AIClient for consistent error handling
    const response = await AIClient.invoke('generate-story-ending', options, {
      timeout: 45000,
      retries: 2
    });

    if (!response.success || !response.data) {
      throw new AIClientError(
        response.error || 'Story ending generation failed',
        response.error_code || 'ENDING_GENERATION_ERROR',
        400
      );
    }

    return response.data;
  } catch (error) {
    logger.error('Story ending generation failed', error, { operation: 'ending-generation', storyId: options.storyId });

    // Re-throw AIClient errors as-is (they have proper Context7 error handling)
    if (error instanceof AIClientError || error instanceof InsufficientCreditsError) {
      throw error;
    }

    // Wrap other errors
    throw new AIClientError(
      error instanceof Error ? error.message : 'Failed to generate story ending',
      'ENDING_GENERATION_ERROR',
      500
    );
  }
};

/**
 * Create a complete story in the database with localization support
 */
export const createStoryWithLocalization = async (
  storyData: {
    title: string;
    description?: string;
    age_group: string;
    genre: string;
    prompt: string;
    language_code: string;
    story_content: string;
    characters?: any[];
  },
  userId: string
) => {
  try {
    // Create the main story record
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        user_id: userId,
        author_id: userId,
        title: storyData.title,
        description: storyData.description,
        age_group: storyData.age_group,
        genre: storyData.genre,
        prompt: storyData.prompt,
        language_code: storyData.language_code,
        original_language_code: storyData.language_code,
        status: 'completed',
        visibility: 'private',
        metadata: {
          characters: storyData.characters || [],
          generated_at: new Date().toISOString(),
          ai_generated: true
        }
      })
      .select()
      .single();

    if (storyError) throw storyError;

    // Create localized content entry
    const { error: i18nError } = await supabase
      .from('story_content_i18n')
      .insert({
        story_id: story.id,
        language_code: storyData.language_code,
        title: storyData.title,
        description: storyData.description,
        content: { full_text: storyData.story_content },
        is_primary: true
      });

    if (i18nError) {
      // Don't fail the whole operation if i18n fails
    }

    return story;
  } catch (error) {
    throw error;
  }
};

/**
 * Get localized content for a story
 */
export const getLocalizedStoryContent = async (storyId: string, languageCode: string) => {
  try {
    const { data, error } = await supabase
      .from('story_content_i18n')
      .select('*')
      .eq('story_id', storyId)
      .eq('language_code', languageCode)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is OK
      throw error;
    }

    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Get available languages for a story (languages it has been translated to)
 */
export const getStoryLanguages = async (storyId: string) => {
  try {
    const { data, error } = await supabase
      .from('story_content_i18n')
      .select(`
        language_code,
        languages!inner(name, native_name)
      `)
      .eq('story_id', storyId);

    if (error) throw error;

    return data?.map(item => ({
      code: item.language_code,
      name: (item.languages as any).name,
      native_name: (item.languages as any).native_name
    })) || [];
  } catch (error) {
    return [];
  }
};