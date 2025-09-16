/**
 * React Query Configuration for Production
 * 
 * Optimized caching strategies for better performance
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

/**
 * Query Keys for consistent caching
 */
export const queryKeys = {
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
