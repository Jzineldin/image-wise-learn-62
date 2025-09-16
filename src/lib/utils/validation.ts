/**
 * Validation utilities
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate story title
 */
export const isValidStoryTitle = (title: string): boolean => {
  return title.trim().length >= 3 && title.trim().length <= 100;
};

/**
 * Validate story description
 */
export const isValidStoryDescription = (description: string): boolean => {
  return description.trim().length <= 500;
};

/**
 * Validate age group
 */
export const isValidAgeGroup = (ageGroup: string): boolean => {
  const validAgeGroups = ['4-6', '7-9', '10-12', '13+'];
  return validAgeGroups.includes(ageGroup);
};

/**
 * Validate genre
 */
export const isValidGenre = (genre: string): boolean => {
  // This could be expanded to check against a list of valid genres
  return genre.trim().length > 0 && genre.trim().length <= 50;
};

/**
 * Validate character name
 */
export const isValidCharacterName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

/**
 * Validate character description
 */
export const isValidCharacterDescription = (description: string): boolean => {
  return description.trim().length >= 10 && description.trim().length <= 200;
};

/**
 * Sanitize text input (remove potentially harmful content)
 */
export const sanitizeTextInput = (text: string): string => {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000); // Limit length
};