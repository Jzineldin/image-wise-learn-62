/**
 * Story-specific helper functions
 */

import { formatStoryWithPreview } from '@/lib/story-preview-utils';

interface Story {
  status?: string;
  is_completed?: boolean;
  is_complete?: boolean;
}

/**
 * Check if a story is completed
 *
 * Standardizes the completion check across the codebase.
 * A story is considered completed if ANY of these conditions are true:
 * - status field is 'completed'
 * - is_completed boolean is true
 * - is_complete boolean is true
 *
 * @param story - Story object with completion fields
 * @returns true if story is completed, false otherwise
 */
export const isStoryCompleted = (story: Story | null | undefined): boolean => {
  if (!story) return false;

  return (
    story.status === 'completed' ||
    story.is_completed === true ||
    story.is_complete === true
  );
};

/**
 * Check if a story is in progress (not completed, not failed)
 *
 * @param story - Story object with status field
 * @returns true if story is in progress, false otherwise
 */
export const isStoryInProgress = (story: Story | null | undefined): boolean => {
  if (!story) return false;

  return (
    story.status === 'in_progress' ||
    story.status === 'generating' ||
    story.status === 'draft'
  ) && !isStoryCompleted(story);
};

/**
 * Check if a story has failed
 *
 * @param story - Story object with status field
 * @returns true if story has failed, false otherwise
 */
export const isStoryFailed = (story: Story | null | undefined): boolean => {
  if (!story) return false;

  return story.status === 'failed';
};

/**
 * Get story preview for display in lists/cards
 */
export const getStoryPreview = (story: any) => {
  return formatStoryWithPreview(story);
};

/**
 * Determine if user can edit a story
 */
export const canEditStory = (story: any, userId: string): boolean => {
  return story.author_id === userId || story.user_id === userId;
};

/**
 * Get story status display text
 */
export const getStoryStatusDisplay = (status: string): { text: string; color: string } => {
  const statusMap = {
    draft: { text: 'Draft', color: 'text-yellow-500' },
    published: { text: 'Published', color: 'text-green-500' },
    completed: { text: 'Completed', color: 'text-blue-500' },
    generating: { text: 'Generating...', color: 'text-orange-500' },
    failed: { text: 'Failed', color: 'text-red-500' },
  };

  return statusMap[status as keyof typeof statusMap] || { text: status, color: 'text-gray-500' };
};

/**
 * Calculate story completion percentage
 */
export const calculateStoryCompletion = (story: any, segments: any[]): number => {
  if (!segments.length) return 0;
  
  const hasEnding = segments.some(s => s.is_ending);
  if (hasEnding) return 100;
  
  // Estimate completion based on segment count and choices
  const segmentCount = segments.length;
  const averageChoicesPerSegment = segments.reduce((sum, s) => sum + (s.choices?.length || 0), 0) / segmentCount;
  
  // Simple heuristic: more segments with fewer choices = more complete
  const estimatedCompletion = Math.min(90, (segmentCount * 15) + (averageChoicesPerSegment * 5));
  
  return Math.round(estimatedCompletion);
};

/**
 * Get reading difficulty based on age group
 */
export const getReadingDifficulty = (ageGroup: string): { level: string; description: string } => {
  const difficultyMap = {
    '4-6': { level: 'Beginner', description: 'Simple words and short sentences' },
    '7-9': { level: 'Elementary', description: 'Easy vocabulary with some complexity' },
    '10-12': { level: 'Intermediate', description: 'Moderate vocabulary and longer texts' },
    '13+': { level: 'Advanced', description: 'Complex vocabulary and concepts' },
  };

  return difficultyMap[ageGroup as keyof typeof difficultyMap] || 
    { level: 'Unknown', description: 'Difficulty not determined' };
};