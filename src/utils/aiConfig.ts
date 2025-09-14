/**
 * Frontend AI Configuration Management
 * 
 * This module provides centralized configuration for AI operations on the frontend.
 * It defines models, providers, and operations available to the client.
 */

// ============= TYPES & INTERFACES =============

export interface AIOperation {
  id: string;
  name: string;
  description: string;
  estimatedTokens: number;
  estimatedTime: number; // seconds
  supportedAgeGroups: string[];
  supportedGenres: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
  supportedOperations: string[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  costTier: 'low' | 'medium' | 'high';
}

// ============= CONFIGURATION =============

export const AI_OPERATIONS: Record<string, AIOperation> = {
  'story-seeds': {
    id: 'story-seeds',
    name: 'Story Seeds Generation',
    description: 'Generate creative story ideas and starting points',
    estimatedTokens: 500,
    estimatedTime: 5,
    supportedAgeGroups: ['4-6', '7-9', '10-12', '13+'],
    supportedGenres: ['Fantasy', 'Adventure', 'Mystery', 'Superhero Stories', 'Animal Stories', 'Fairy Tales']
  },
  'story-segments': {
    id: 'story-segments',
    name: 'Story Segment Generation',
    description: 'Continue interactive stories based on user choices',
    estimatedTokens: 800,
    estimatedTime: 8,
    supportedAgeGroups: ['4-6', '7-9', '10-12', '13+'],
    supportedGenres: ['Fantasy', 'Adventure', 'Mystery', 'Superhero Stories', 'Animal Stories', 'Fairy Tales']
  },
  'story-titles': {
    id: 'story-titles',
    name: 'Story Title Generation',
    description: 'Generate creative and engaging story titles',
    estimatedTokens: 200,
    estimatedTime: 3,
    supportedAgeGroups: ['4-6', '7-9', '10-12', '13+'],
    supportedGenres: ['Fantasy', 'Adventure', 'Mystery', 'Superhero Stories', 'Animal Stories', 'Fairy Tales']
  },
  'story-generation': {
    id: 'story-generation',
    name: 'Complete Story Generation',
    description: 'Generate complete stories with multiple segments',
    estimatedTokens: 2000,
    estimatedTime: 15,
    supportedAgeGroups: ['4-6', '7-9', '10-12', '13+'],
    supportedGenres: ['Fantasy', 'Adventure', 'Mystery', 'Superhero Stories', 'Animal Stories', 'Fairy Tales']
  }
};

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'High-quality creative AI models optimized for storytelling',
    isAvailable: true,
    supportedOperations: ['story-seeds', 'story-segments', 'story-titles', 'story-generation']
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'Reliable and consistent AI models with structured outputs',
    isAvailable: true,
    supportedOperations: ['story-seeds', 'story-segments', 'story-titles', 'story-generation']
  },
  ovh: {
    id: 'ovh',
    name: 'OVH Llama',
    description: 'Open-source language models for cost-effective generation',
    isAvailable: true,
    supportedOperations: ['story-seeds', 'story-segments', 'story-titles', 'story-generation']
  }
};

export const AI_MODELS: Record<string, AIModel> = {
  'openrouter/sonoma-dusk-alpha': {
    id: 'openrouter/sonoma-dusk-alpha',
    name: 'Sonoma Dusk Alpha',
    provider: 'openrouter',
    description: 'Creative storytelling model optimized for children\'s content',
    capabilities: ['creative-writing', 'structured-output', 'age-appropriate'],
    costTier: 'medium'
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and reliable model with excellent structured outputs',
    capabilities: ['structured-output', 'consistent-quality', 'age-appropriate'],
    costTier: 'low'
  },
  'Meta-Llama-3_3-70B-Instruct': {
    id: 'Meta-Llama-3_3-70B-Instruct',
    name: 'Llama 3.3 70B',
    provider: 'ovh',
    description: 'Open-source model with strong reasoning capabilities',
    capabilities: ['creative-writing', 'reasoning', 'multilingual'],
    costTier: 'low'
  }
};

// ============= AGE GROUP CONFIGURATIONS =============

export const AGE_GROUP_CONFIG = {
  '4-6': {
    name: 'Ages 4-6 (Preschool)',
    description: 'Simple words, basic emotions, familiar settings',
    wordLimits: { min: 30, max: 60 },
    vocabularyLevel: 'basic',
    themes: ['friendship', 'family', 'animals', 'home'],
    complexity: 'simple'
  },
  '7-9': {
    name: 'Ages 7-9 (Early Elementary)',
    description: 'Elementary vocabulary, mild adventures, clear lessons',
    wordLimits: { min: 100, max: 140 },
    vocabularyLevel: 'elementary',
    themes: ['school', 'nature', 'teamwork', 'problem-solving'],
    complexity: 'basic'
  },
  '10-12': {
    name: 'Ages 10-12 (Middle Elementary)',
    description: 'Intermediate vocabulary, meaningful choices, character growth',
    wordLimits: { min: 150, max: 200 },
    vocabularyLevel: 'intermediate',
    themes: ['friendship-challenges', 'quests', 'self-discovery', 'moral-choices'],
    complexity: 'moderate'
  },
  '13+': {
    name: 'Ages 13+ (Young Adult)',
    description: 'Advanced vocabulary, complex themes, nuanced characters',
    wordLimits: { min: 250, max: 400 },
    vocabularyLevel: 'advanced',
    themes: ['identity', 'relationships', 'moral-dilemmas', 'complex-adventures'],
    complexity: 'sophisticated'
  }
};

// ============= GENRE CONFIGURATIONS =============

export const GENRE_CONFIG = {
  'Fantasy': {
    name: 'Fantasy',
    description: 'Magical worlds, mythical creatures, and enchanted adventures',
    keywords: ['magical', 'enchanted', 'mystical', 'wondrous', 'spellbinding'],
    themes: ['magic', 'quests', 'good-vs-evil', 'transformation'],
    elements: ['wizards', 'dragons', 'castles', 'spells', 'prophecies']
  },
  'Adventure': {
    name: 'Adventure',
    description: 'Exciting journeys, exploration, and thrilling challenges',
    keywords: ['thrilling', 'exciting', 'daring', 'courageous', 'bold'],
    themes: ['exploration', 'challenges', 'discovery', 'courage'],
    elements: ['journeys', 'treasure', 'maps', 'dangers', 'heroes']
  },
  'Mystery': {
    name: 'Mystery',
    description: 'Puzzles to solve, secrets to uncover, and clues to follow',
    keywords: ['puzzling', 'mysterious', 'curious', 'intriguing', 'secretive'],
    themes: ['investigation', 'problem-solving', 'secrets', 'discovery'],
    elements: ['clues', 'detectives', 'puzzles', 'hidden-objects', 'revelations']
  },
  'Superhero Stories': {
    name: 'Superhero Stories',
    description: 'Extraordinary powers, heroic deeds, and saving the day',
    keywords: ['heroic', 'powerful', 'brave', 'extraordinary', 'remarkable'],
    themes: ['heroism', 'responsibility', 'justice', 'helping-others'],
    elements: ['superpowers', 'villains', 'secret-identities', 'missions', 'teamwork']
  },
  'Animal Stories': {
    name: 'Animal Stories',
    description: 'Adventures with animal friends and nature exploration',
    keywords: ['playful', 'loyal', 'wild', 'gentle', 'natural'],
    themes: ['friendship', 'nature', 'survival', 'cooperation'],
    elements: ['animal-characters', 'habitats', 'seasons', 'pack-behavior', 'instincts']
  },
  'Fairy Tales': {
    name: 'Fairy Tales',
    description: 'Classic story elements, moral lessons, and timeless themes',
    keywords: ['magical', 'wonderful', 'charming', 'timeless', 'enchanting'],
    themes: ['good-vs-evil', 'transformation', 'reward-virtue', 'justice'],
    elements: ['princesses', 'talking-animals', 'curses', 'wishes', 'happy-endings']
  }
};

// ============= UTILITY FUNCTIONS =============

/**
 * Get configuration for a specific age group
 */
export function getAgeGroupConfig(ageGroup: string) {
  return AGE_GROUP_CONFIG[ageGroup as keyof typeof AGE_GROUP_CONFIG] || AGE_GROUP_CONFIG['10-12'];
}

/**
 * Get configuration for a specific genre
 */
export function getGenreConfig(genre: string) {
  return GENRE_CONFIG[genre as keyof typeof GENRE_CONFIG] || GENRE_CONFIG['Adventure'];
}

/**
 * Get estimated time and cost for an operation
 */
export function getOperationEstimate(operationId: string) {
  const operation = AI_OPERATIONS[operationId];
  if (!operation) {
    throw new Error(`Unknown operation: ${operationId}`);
  }

  return {
    estimatedTime: operation.estimatedTime,
    estimatedTokens: operation.estimatedTokens,
    description: operation.description
  };
}

/**
 * Check if an operation is supported for given parameters
 */
export function isOperationSupported(
  operationId: string,
  ageGroup: string,
  genre: string
): boolean {
  const operation = AI_OPERATIONS[operationId];
  if (!operation) return false;

  return (
    operation.supportedAgeGroups.includes(ageGroup) &&
    operation.supportedGenres.includes(genre)
  );
}

/**
 * Get all available providers for an operation
 */
export function getAvailableProviders(operationId: string): AIProvider[] {
  return Object.values(AI_PROVIDERS).filter(provider =>
    provider.isAvailable && provider.supportedOperations.includes(operationId)
  );
}

/**
 * Get models for a specific provider
 */
export function getProviderModels(providerId: string): AIModel[] {
  return Object.values(AI_MODELS).filter(model => model.provider === providerId);
}