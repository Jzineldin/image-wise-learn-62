/**
 * Age Group Utilities
 *
 * Centralized helper functions for age group format handling.
 *
 * Database Format: "7-9 years old", "10-12 years old", etc.
 * Backend Format: "7-9", "10-12", etc.
 *
 * This ensures consistent age group normalization across the entire application.
 */

export const AGE_GROUPS = {
  FULL: [
    '4-6 years old',
    '7-9 years old',
    '10-12 years old',
    '13+ years old',
  ],
  SHORT: ['4-6', '7-9', '10-12', '13+'],
} as const;

/**
 * Normalizes age group to backend format (removes " years old")
 *
 * @param ageGroup - Age group in any format
 * @returns Age group in backend format (e.g., "7-9")
 *
 * @example
 * normalizeAgeGroup('7-9 years old') // Returns: '7-9'
 * normalizeAgeGroup('7-9') // Returns: '7-9'
 * normalizeAgeGroup(undefined) // Returns: '7-9' (default)
 * normalizeAgeGroup('') // Returns: '7-9' (default)
 */
export function normalizeAgeGroup(ageGroup: string | undefined | null): string {
  if (!ageGroup || typeof ageGroup !== 'string' || ageGroup.trim() === '') {
    return '7-9'; // Default to middle age group
  }

  return ageGroup.replace(' years old', '').trim();
}

/**
 * Converts age group to database format (adds " years old" if missing)
 *
 * @param ageGroup - Age group in any format
 * @returns Age group in database format (e.g., "7-9 years old")
 *
 * @example
 * toDatabaseFormat('7-9') // Returns: '7-9 years old'
 * toDatabaseFormat('7-9 years old') // Returns: '7-9 years old'
 * toDatabaseFormat(undefined) // Returns: '7-9 years old' (default)
 */
export function toDatabaseFormat(ageGroup: string | undefined | null): string {
  const normalized = normalizeAgeGroup(ageGroup);
  return normalized.includes('years old') ? normalized : `${normalized} years old`;
}

/**
 * Validates if an age group is valid
 *
 * @param ageGroup - Age group to validate
 * @returns True if valid, false otherwise
 */
export function isValidAgeGroup(ageGroup: string | undefined | null): boolean {
  if (!ageGroup) return false;
  const normalized = normalizeAgeGroup(ageGroup);
  return AGE_GROUPS.SHORT.includes(normalized as any);
}

/**
 * Gets display text for age group
 *
 * @param ageGroup - Age group in any format
 * @returns Human-readable age group text
 */
export function getDisplayText(ageGroup: string | undefined | null): string {
  return toDatabaseFormat(ageGroup);
}
