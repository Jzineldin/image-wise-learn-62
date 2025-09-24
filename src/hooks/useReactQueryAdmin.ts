/**
 * React Query hooks for admin operations
 * Centralizes admin API calls with proper caching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-client';
import { logger } from '@/lib/logger';

/**
 * Get admin analytics overview
 */
export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.admin.analytics,
    queryFn: async () => {
      logger.apiCall('admin_get_analytics_overview', { operation: 'admin_analytics' });
      
      const { data, error } = await supabase.rpc('admin_get_analytics_overview');
      
      if (error) {
        logger.error('Failed to get admin analytics', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_analytics_overview', true, { recordCount: data?.length });
      return data?.[0] || null;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get daily usage analytics
 */
export const useAdminDailyUsage = (daysBack: number = 30) => {
  return useQuery({
    queryKey: queryKeys.admin.dailyUsage(daysBack),
    queryFn: async () => {
      logger.apiCall('admin_get_daily_usage', { operation: 'admin_daily_usage', daysBack });
      
      const { data, error } = await supabase.rpc('admin_get_daily_usage', { days_back: daysBack });
      
      if (error) {
        logger.error('Failed to get admin daily usage', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_daily_usage', true, { recordCount: data?.length });
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get genre distribution
 */
export const useAdminGenreDistribution = () => {
  return useQuery({
    queryKey: queryKeys.admin.genreDistribution,
    queryFn: async () => {
      logger.apiCall('admin_get_genre_distribution', { operation: 'admin_genre_distribution' });
      
      const { data, error } = await supabase.rpc('admin_get_genre_distribution');
      
      if (error) {
        logger.error('Failed to get genre distribution', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_genre_distribution', true, { recordCount: data?.length });
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Get age group distribution
 */
export const useAdminAgeGroupDistribution = () => {
  return useQuery({
    queryKey: queryKeys.admin.ageGroupDistribution,
    queryFn: async () => {
      logger.apiCall('admin_get_age_group_distribution', { operation: 'admin_age_group_distribution' });
      
      const { data, error } = await supabase.rpc('admin_get_age_group_distribution');
      
      if (error) {
        logger.error('Failed to get age group distribution', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_age_group_distribution', true, { recordCount: data?.length });
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Get top users
 */
export const useAdminTopUsers = (limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.admin.topUsers(limit),
    queryFn: async () => {
      logger.apiCall('admin_get_top_users', { operation: 'admin_top_users', limit });
      
      const { data, error } = await supabase.rpc('admin_get_top_users', { limit_count: limit });
      
      if (error) {
        logger.error('Failed to get top users', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_top_users', true, { recordCount: data?.length });
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get all stories for admin
 */
export const useAdminAllStories = (limit: number = 50) => {
  return useQuery({
    queryKey: queryKeys.admin.allStories(limit),
    queryFn: async () => {
      logger.apiCall('admin_get_all_stories', { operation: 'admin_all_stories', limit });
      
      const { data, error } = await supabase.rpc('admin_get_all_stories', { limit_count: limit });
      
      if (error) {
        logger.error('Failed to get all stories', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_all_stories', true, { recordCount: data?.length });
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get completed stories for admin
 */
export const useAdminCompletedStories = (limit: number = 50) => {
  return useQuery({
    queryKey: queryKeys.admin.completedStories(limit),
    queryFn: async () => {
      logger.apiCall('admin_get_completed_stories', { operation: 'admin_completed_stories', limit });
      
      const { data, error } = await supabase.rpc('admin_get_completed_stories', { limit_count: limit });
      
      if (error) {
        logger.error('Failed to get completed stories', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_completed_stories', true, { recordCount: data?.length });
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get featured stories for admin
 */
export const useAdminFeaturedStories = () => {
  return useQuery({
    queryKey: queryKeys.admin.featuredStories,
    queryFn: async () => {
      logger.apiCall('admin_get_featured_stories', { operation: 'admin_featured_stories' });
      
      const { data, error } = await supabase.rpc('admin_get_featured_stories');
      
      if (error) {
        logger.error('Failed to get featured stories', error);
        throw error;
      }
      
      logger.apiResponse('admin_get_featured_stories', true, { recordCount: data?.length });
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Feature a story mutation
 */
export const useFeatureStory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      storyId, 
      priority = 1, 
      featuredUntil 
    }: { 
      storyId: string; 
      priority?: number; 
      featuredUntil?: string; 
    }) => {
      logger.apiCall('admin_feature_story', { storyId, priority, operation: 'feature_story' });
      
      const { data, error } = await supabase.rpc('admin_feature_story', {
        p_story_id: storyId,
        p_priority: priority,
        p_featured_until: featuredUntil || null,
      });
      
      if (error) {
        logger.error('Failed to feature story', error, { storyId });
        throw error;
      }
      
      logger.apiResponse('admin_feature_story', true, { storyId });
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.featuredStories });
      queryClient.invalidateQueries({ queryKey: queryKeys.featuredStories });
    },
  });
};

/**
 * Unfeature a story mutation
 */
export const useUnfeatureStory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (storyId: string) => {
      logger.apiCall('admin_unfeature_story', { storyId, operation: 'unfeature_story' });
      
      const { data, error } = await supabase.rpc('admin_unfeature_story', {
        p_story_id: storyId,
      });
      
      if (error) {
        logger.error('Failed to unfeature story', error, { storyId });
        throw error;
      }
      
      logger.apiResponse('admin_unfeature_story', true, { storyId });
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.featuredStories });
      queryClient.invalidateQueries({ queryKey: queryKeys.featuredStories });
    },
  });
};

/**
 * Update story visibility mutation
 */
export const useUpdateStoryVisibility = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ storyId, visibility }: { storyId: string; visibility: string }) => {
      logger.apiCall('admin_update_story_visibility', { storyId, visibility, operation: 'update_story_visibility' });
      
      const { data, error } = await supabase.rpc('admin_update_story_visibility', {
        p_story_id: storyId,
        p_visibility: visibility,
      });
      
      if (error) {
        logger.error('Failed to update story visibility', error, { storyId, visibility });
        throw error;
      }
      
      logger.apiResponse('admin_update_story_visibility', true, { storyId, visibility });
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.allStories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.completedStories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories });
    },
  });
};

/**
 * Delete story mutation
 */
export const useDeleteStory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (storyId: string) => {
      logger.apiCall('admin_delete_story', { storyId, operation: 'delete_story' });
      
      const { data, error } = await supabase.rpc('admin_delete_story', {
        p_story_id: storyId,
      });
      
      if (error) {
        logger.error('Failed to delete story', error, { storyId });
        throw error;
      }
      
      logger.apiResponse('admin_delete_story', true, { storyId });
      return data;
    },
    onSuccess: () => {
      // Invalidate all story-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.allStories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.completedStories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.featuredStories });
      queryClient.invalidateQueries({ queryKey: queryKeys.stories });
      queryClient.invalidateQueries({ queryKey: queryKeys.featuredStories });
    },
  });
};