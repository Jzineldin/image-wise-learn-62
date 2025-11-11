/**
 * Hook for managing chapter limits in the freemium model
 * Free users: 4 chapters/day, 2 max active stories
 * Paid users: Unlimited chapters, unlimited stories
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { logger } from '@/lib/production-logger';
import { queryKeys } from '@/lib/query-client';

export interface ChapterStatus {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
  isPaid: boolean;
  tier: string;
}

export interface ActiveStoriesStatus {
  activeCount: number;
  maxAllowed: number;
  canCreateNew: boolean;
  tier: string;
}

/**
 * Get chapter limit status for the current user
 */
export const useChapterLimits = () => {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const queryClient = useQueryClient();

  // Fetch chapter status
  const { data: chapterStatus, isLoading: isLoadingChapters, refetch: refetchChapters } = useQuery({
    queryKey: [...queryKeys.userCredits, 'chapter-status', user?.id],
    queryFn: async (): Promise<ChapterStatus> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_chapter_status', {
        user_uuid: user.id
      });

      if (error) {
        logger.error('Failed to fetch chapter status', error, {
          userId: user.id,
          operation: 'useChapterLimits'
        });
        throw error;
      }

      return data as unknown as ChapterStatus;
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
  });

  // Fetch active stories count
  const { data: activeStoriesStatus, isLoading: isLoadingStories, refetch: refetchStories } = useQuery({
    queryKey: [...queryKeys.userCredits, 'active-stories', user?.id],
    queryFn: async (): Promise<ActiveStoriesStatus> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('check_active_stories', {
        user_uuid: user.id
      });

      if (error) {
        logger.error('Failed to check active stories', error, {
          userId: user.id,
          operation: 'useChapterLimits'
        });
        throw error;
      }

      return data as unknown as ActiveStoriesStatus;
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
  });

  // Use a free chapter (called before generating segment)
  const useChapterMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('use_free_chapter', {
        user_uuid: user.id
      });

      if (error) throw error;

      const result = data as any;

      // Check if limit reached
      if (!result.success) {
        throw new Error(result.error || 'Daily chapter limit reached');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate chapter status to refresh UI
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.userCredits, 'chapter-status']
      });
    },
    onError: (error) => {
      logger.error('Failed to use chapter', error, {
        userId: user?.id,
        operation: 'useChapterLimits'
      });
    }
  });

  const isPaid = tier !== 'free';
  const isLoading = isLoadingChapters || isLoadingStories;

  // Helper to check if user can create new chapter
  const canCreateChapter = useCallback(() => {
    if (isPaid) return true; // Paid users have unlimited
    if (!chapterStatus) return false;
    return chapterStatus.remaining > 0;
  }, [isPaid, chapterStatus]);

  // Helper to check if user can create new story
  const canCreateStory = useCallback(() => {
    if (isPaid) return true; // Paid users have unlimited
    if (!activeStoriesStatus) return false;
    return activeStoriesStatus.canCreateNew;
  }, [isPaid, activeStoriesStatus]);

  // Calculate hours until reset
  const hoursUntilReset = useCallback(() => {
    if (!chapterStatus?.resetAt) return 0;
    const resetTime = new Date(chapterStatus.resetAt).getTime();
    const now = Date.now();
    const diff = resetTime - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
  }, [chapterStatus]);

  return {
    // Chapter limits
    chapterStatus,
    canCreateChapter: canCreateChapter(),
    hoursUntilReset: hoursUntilReset(),
    
    // Active stories
    activeStoriesStatus,
    canCreateStory: canCreateStory(),
    
    // User tier
    isPaid,
    tier,
    
    // Loading states
    isLoading,
    
    // Actions
    useChapter: useChapterMutation.mutate,
    refetchLimits: () => {
      refetchChapters();
      refetchStories();
    }
  };
};

/**
 * Format remaining time for display
 */
export const formatTimeUntilReset = (hours: number): string => {
  if (hours === 0) return 'Soon';
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
};
