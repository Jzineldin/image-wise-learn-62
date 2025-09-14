// Tale Forge - TypeScript Types

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  age_group: '4-6' | '7-9' | '10-12' | '13+';
  preferred_genres: string[];
  subscription_tier: 'free' | 'premium' | 'pro';
  subscription_status: string;
  credits: number;
  total_stories_created: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  age_group: string;
  genre: string;
  tags: string[];
  cover_image_url?: string;
  prompt?: string;
  visibility: 'public' | 'private';
  is_complete: boolean;
  is_featured: boolean;
  featured_until?: string;
  status: 'draft' | 'generating' | 'complete' | 'failed';
  total_segments: number;
  current_segment: number;
  total_words: number;
  estimated_reading_time?: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  published_at?: string;
}

export interface StorySegment {
  id: string;
  story_id: string;
  segment_number: number;
  content: string;
  image_url?: string;
  audio_url?: string;
  choices: Choice[];
  parent_segment_id?: string;
  parent_choice_id?: number;
  is_ending: boolean;
  created_at: string;
}

export interface Choice {
  id: number;
  text: string;
  leads_to_segment_id?: string;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  description: string;
  personality_traits: string[];
  backstory?: string;
  image_url?: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export interface Like {
  id: string;
  story_id: string;
  user_id: string;
  created_at: string;
}

// Story Creation Types
export interface StoryCreationState {
  step: number;
  age_group?: string;
  genres: string[];
  characters: Character[];
  prompt: string;
  settings: {
    length: 'short' | 'medium' | 'long';
    language: string;
    voice_enabled: boolean;
    image_style: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface StoryGenerationResponse {
  story_id: string;
  title: string;
  first_segment: StorySegment;
  status: string;
}

// Available genres
export const GENRES = [
  'Fantasy & Magic',
  'Adventure & Exploration', 
  'Mystery & Detective',
  'Science Fiction',
  'Animal Tales',
  'Fairy Tales',
  'Historical Fiction',
  'Superhero Stories'
] as const;

export type Genre = typeof GENRES[number];

// Age groups
export const AGE_GROUPS = [
  { value: '4-6', label: '4-6 Years', description: 'Simple stories with basic vocabulary' },
  { value: '7-9', label: '7-9 Years', description: 'Adventure stories with some complexity' },
  { value: '10-12', label: '10-12 Years', description: 'Rich narratives with deeper themes' },
  { value: '13+', label: '13+ Years', description: 'Complex stories with mature themes' }
] as const;

export type AgeGroup = typeof AGE_GROUPS[number]['value'];