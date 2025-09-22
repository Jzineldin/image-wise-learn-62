/**
 * Static image path mappings to ensure proper asset loading
 */

export const AGE_GROUP_IMAGES = {
  '4-6': '/images/age-groups/4-6.jpg',
  '7-9': '/images/age-groups/7-9.jpg',
  '10-12': '/images/age-groups/10-12.jpg',
  '13+': '/images/age-groups/13+.jpg'
} as const;

export const GENRE_IMAGES = {
  'Adventure': '/images/genres/Adventure.jpg',
  'Animal Stories': '/images/genres/Animal Stories.jpg',
  'Fairy Tales': '/images/genres/Fairy Tales.jpg',
  'Fantasy': '/images/genres/Fantasy.jpg',
  'Mystery': '/images/genres/Mystery.jpg',
  'Superhero Stories': '/images/genres/Superhero Stories.jpg'
} as const;

export type AgeGroup = keyof typeof AGE_GROUP_IMAGES;
export type Genre = keyof typeof GENRE_IMAGES;