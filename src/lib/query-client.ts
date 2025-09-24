/**
 * React Query Configuration for Production
 * 
 * Optimized caching strategies for better performance
 */

import { QueryClient } from '@tanstack/react-query';
import { performanceOptimizer } from './performance-optimization';

export const queryClient = new QueryClient(
  performanceOptimizer.getOptimalQuerySettings()
);

/**
 * Query Keys for consistent caching
 */
export const queryKeys = {
  // Auth-related queries
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },
  
  // User-related queries
  profile: ['profile'] as const,
  credits: ['credits'] as const,
  subscription: ['subscription'] as const,
  
  // Story-related queries  
  stories: ['stories'] as const,
  story: (id: string) => ['story', id] as const,
  storySegments: (id: string) => ['story-segments', id] as const,
  featuredStories: ['featured-stories'] as const,
  
  // Content queries
  languages: ['languages'] as const,
  characters: ['characters'] as const,
  
  // Analytics
  usage: ['usage'] as const,
  analytics: ['analytics'] as const,
  
  // Admin queries
  admin: {
    analytics: ['admin', 'analytics'] as const,
    dailyUsage: (days: number) => ['admin', 'daily-usage', days] as const,
    genreDistribution: ['admin', 'genre-distribution'] as const,
    ageGroupDistribution: ['admin', 'age-group-distribution'] as const,
    topUsers: (limit: number) => ['admin', 'top-users', limit] as const,
    allStories: (limit?: number) => ['admin', 'all-stories', limit] as const,
    completedStories: (limit?: number) => ['admin', 'completed-stories', limit] as const,
    featuredStories: ['admin', 'featured-stories'] as const,
  },
} as const;

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  profile: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
  credits: () => queryClient.invalidateQueries({ queryKey: queryKeys.credits }),
  stories: () => queryClient.invalidateQueries({ queryKey: queryKeys.stories }),
  story: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.story(id) }),
  all: () => queryClient.invalidateQueries(),
};
