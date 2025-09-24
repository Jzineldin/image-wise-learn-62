/**
 * Analytics Hook using React Query
 * Replaces direct Supabase calls in AnalyticsDashboard with proper caching
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AnalyticsData {
  totalUsers: number;
  totalStories: number;
  totalCreditsUsed: number;
  activeUsers30d: number;
  monthlyStats: {
    stories: number;
    credits: number;
    newUsers: number;
  };
}

export function useAnalytics(timeRange: string = '30d') {
  return useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      logger.apiCall('fetch_analytics', { timeRange });
      
      try {
        // Get basic counts from database tables
        const [usersResult, storiesResult, creditsResult] = await Promise.all([
          supabase.from('profiles').select('id, created_at'),
          supabase.from('stories').select('id, created_at, credits_used, user_id, author_id'),
          supabase.from('user_credits').select('total_spent')
        ]);

        if (usersResult.error) throw usersResult.error;
        if (storiesResult.error) throw storiesResult.error;
        if (creditsResult.error) throw creditsResult.error;

        const totalUsers = usersResult.data?.length || 0;
        const totalStories = storiesResult.data?.length || 0;
        const totalCreditsUsed = storiesResult.data?.reduce((sum, story) => sum + (story.credits_used || 0), 0) || 0;

        // Calculate monthly stats
        const currentMonth = new Date();
        currentMonth.setDate(1);
        
        const monthlyStories = storiesResult.data?.filter(story => 
          new Date(story.created_at) >= currentMonth
        ).length || 0;

        const monthlyCredits = storiesResult.data?.filter(story => 
          new Date(story.created_at) >= currentMonth
        ).reduce((sum, story) => sum + (story.credits_used || 0), 0) || 0;

        const monthlyUsers = usersResult.data?.filter(user => 
          new Date(user.created_at) >= currentMonth
        ).length || 0;

        // Calculate active users (users who created stories in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeUsers30d = new Set(
          storiesResult.data?.filter(story => 
            new Date(story.created_at) >= thirtyDaysAgo
          ).map(story => story.user_id || story.author_id)
        ).size;

        const analyticsData: AnalyticsData = {
          totalUsers,
          totalStories,
          totalCreditsUsed,
          activeUsers30d,
          monthlyStats: {
            stories: monthlyStories,
            credits: monthlyCredits,
            newUsers: monthlyUsers
          }
        };

        logger.apiResponse('fetch_analytics', true, { 
          timeRange,
          totalUsers,
          totalStories,
          activeUsers30d
        });

        return analyticsData;

      } catch (error) {
        logger.error('Failed to fetch analytics', error, { timeRange });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}