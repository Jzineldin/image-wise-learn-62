/**
 * Core application constants
 */

export const APP_NAME = 'Tale Forge';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'AI-powered interactive storytelling platform for children';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
];

export const AGE_GROUPS = [
  '4-6',
  '7-9', 
  '10-12',
  '13+'
];

export const STORY_GENRES = [
  'Adventure',
  'Fantasy',
  'Sci-Fi',
  'Mystery',
  'Superhero Stories',
  'Animal Stories',
  'Fairy Tales',
  'Educational',
];

export const STORY_LENGTHS = [
  { value: 'short', label: 'Short (5-10 segments)', segments: [5, 10] },
  { value: 'medium', label: 'Medium (10-20 segments)', segments: [10, 20] },
  { value: 'long', label: 'Long (20+ segments)', segments: [20, 50] },
];

export const MAX_STORY_SEGMENTS = 50;
export const MAX_CHARACTERS_PER_STORY = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB