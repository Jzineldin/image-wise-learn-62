/**
 * React Query Hooks for Data Fetching
 * Centralizes data fetching with proper caching and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';

// User Profile Hook
export function useProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      logger.apiCall('fetch_profile', { userId: user.id });
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        logger.error('Failed to fetch profile', error, { userId: user.id });
        throw error;
      }
      
      logger.apiResponse('fetch_profile', true, { userId: user.id });
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// User Credits Hook
export function useCredits() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.credits,
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      logger.apiCall('fetch_credits', { userId: user.id });
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch credits', error, { userId: user.id });
        throw error;
      }
      
      logger.apiResponse('fetch_credits', true, { userId: user.id });
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds for credits (more frequent updates)
  });
}

// User Stories Hook
export function useStories() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.stories,
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      logger.apiCall('fetch_stories', { userId: user.id });
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          story_segments (
            id,
            segment_number,
            content,
            image_url,
            audio_url
          )
        `)
        .or(`user_id.eq.${user.id},author_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Failed to fetch stories', error, { userId: user.id });
        throw error;
      }
      
      logger.apiResponse('fetch_stories', true, { 
        userId: user.id, 
        count: data?.length || 0 
      });
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Single Story Hook
export function useStory(storyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.story(storyId || ''),
    queryFn: async () => {
      if (!storyId) throw new Error('No story ID');
      
      logger.apiCall('fetch_story', { storyId });
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          story_segments (
            id,
            segment_number,
            content,
            segment_text,
            image_url,
            audio_url,
            choices,
            is_ending,
            audio_generation_status,
            image_generation_status
          )
        `)
        .eq('id', storyId)
        .single();
      
      if (error) {
        logger.error('Failed to fetch story', error, { storyId });
        throw error;
      }
      
      logger.apiResponse('fetch_story', true, { storyId });
      return data;
    },
    enabled: !!storyId,
    staleTime: 1 * 60 * 1000, // 1 minute for active stories
  });
}

// Featured Stories Hook
export function useFeaturedStories() {
  return useQuery({
    queryKey: queryKeys.featuredStories,
    queryFn: async () => {
      logger.apiCall('fetch_featured_stories');
      const { data, error } = await supabase
        .rpc('get_featured_stories', { limit_count: 10 });
      
      if (error) {
        logger.error('Failed to fetch featured stories', error);
        throw error;
      }
      
      logger.apiResponse('fetch_featured_stories', true, { count: data?.length || 0 });
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for featured content
  });
}

// Update Profile Mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.id) throw new Error('No user ID');
      
      logger.apiCall('update_profile', { userId: user.id });
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        logger.error('Failed to update profile', error, { userId: user.id });
        throw error;
      }
      
      logger.apiResponse('update_profile', true, { userId: user.id });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}