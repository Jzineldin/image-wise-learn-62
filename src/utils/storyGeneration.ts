import { supabase } from '@/integrations/supabase/client';
import { getOperationEstimate, isOperationSupported } from './aiConfig';

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
 * Generate a story using the centralized AI architecture
 */
export const generateStory = async (options: StoryGenerationOptions): Promise<StoryGenerationResult> => {
  // Validate operation support
  if (!isOperationSupported('story-generation', options.ageGroup, options.genre)) {
    throw new Error(`Story generation not supported for age group: ${options.ageGroup}, genre: ${options.genre}`);
  }

  console.log('Generating story with centralized AI service:', {
    ageGroup: options.ageGroup,
    genre: options.genre,
    charactersCount: options.characters.length,
    estimate: getOperationEstimate('story-generation')
  });

  const { data, error } = await supabase.functions.invoke('generate-story', {
    body: options
  });

  if (error) {
    console.error('Story generation error:', error);
    throw new Error(error.message || 'Failed to generate story');
  }

  if (!data.success) {
    throw new Error(data.error || 'Story generation failed');
  }

  return data.data;
};

/**
 * Generate audio for text using AI text-to-speech
 */
export const generateAudio = async (options: AudioGenerationOptions): Promise<AudioGenerationResult> => {
  const { data, error } = await supabase.functions.invoke('generate-story-audio', {
    body: options
  });

  if (error) {
    console.error('Audio generation error:', error);
    throw new Error(error.message || 'Failed to generate audio');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};

/**
 * Translate content from one language to another
 */
export const translateContent = async (options: TranslationOptions): Promise<TranslationResult> => {
  const { data, error } = await supabase.functions.invoke('translate-content', {
    body: options
  });

  if (error) {
    console.error('Translation error:', error);
    throw new Error(error.message || 'Failed to translate content');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
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
      console.error('Error creating localized content:', i18nError);
      // Don't fail the whole operation if i18n fails
    }

    return story;
  } catch (error) {
    console.error('Error creating story with localization:', error);
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
    console.error('Error fetching localized content:', error);
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
    console.error('Error fetching story languages:', error);
    return [];
  }
};

/**
 * Utility function to estimate reading time
 */
export const estimateReadingTime = (text: string, ageGroup: string): number => {
  const wordsPerMinute = {
    '4-6': 50,   // Slow reading for young children
    '7-9': 80,   // Beginning readers
    '10-12': 120, // Intermediate readers
    '13+': 150   // Advanced readers
  };

  const wordCount = text.split(/\s+/).length;
  const wpm = wordsPerMinute[ageGroup as keyof typeof wordsPerMinute] || 100;
  
  return Math.ceil(wordCount / wpm);
};

/**
 * Utility function to get voice recommendations for different languages
 */
export const getRecommendedVoices = (languageCode: string): string[] => {
  const voiceMapping: { [key: string]: string[] } = {
    'en': ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    'sv': ['alloy', 'nova'], // Swedish works better with these voices
    // Add more language-specific mappings as needed
  };

  return voiceMapping[languageCode] || voiceMapping['en'];
};

/**
 * Generate a story ending using AI
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
  const { data, error } = await supabase.functions.invoke('generate-story-ending', {
    body: options
  });

  if (error) {
    console.error('Story ending generation error:', error);
    throw new Error(error.message || 'Failed to generate story ending');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
};