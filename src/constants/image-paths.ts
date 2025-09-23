/**
 * Static image path mappings to ensure proper asset loading
 */

export const AGE_GROUP_IMAGES = {
  '4-6': '/images/story-creation-flow/age-4-6.jpg',
  '7-9': '/images/story-creation-flow/age-7-9.jpg',
  '10-12': '/images/story-creation-flow/age-10-12.jpg',
  '13+': '/images/story-creation-flow/age-13.jpg'
} as const;

export const GENRE_IMAGES = {
  'Adventure': '/images/story-creation-flow/adventure.jpg',
  'Animal Stories': '/images/story-creation-flow/animals.jpg',
  'Fairy Tales': '/images/story-creation-flow/fairy-tales.jpg',
  'Fantasy': '/images/story-creation-flow/fantasy.jpg',
  'Mystery': '/images/story-creation-flow/mystery.jpg',
  'Superhero Stories': '/images/story-creation-flow/superhero.jpg'
} as const;

export type AgeGroup = keyof typeof AGE_GROUP_IMAGES;
export type Genre = keyof typeof GENRE_IMAGES;