/**
 * useQuotas Hook
 *
 * Fetches and manages user quotas (chapters and credits)
 * Polls every 60 seconds to keep UI in sync
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-client';
import { logger } from '@/lib/production-logger';

export interface QuotasResponse {
  credits: {
    balance: number;
    monthly_granted: number;
    monthly_used: number;
    next_daily_drip_at: string | null;
  };
  chapters: {
    used_today: number;
    limit_per_day: number | null;
    resets_at: string | null;
  };
  subscription: {
    is_active: boolean;
    monthly_credits: number | null;
    credits_reset_at: string | null;
  };
}

/**
 * Fetch current quotas for the authenticated user
 */
export const useQuotas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [...queryKeys.userCredits, 'quotas', user?.id],
    queryFn: async (): Promise<QuotasResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_user_quotas', {
        user_uuid: user.id
      });

      if (error) {
        logger.error('Failed to fetch user quotas', error, {
          userId: user.id,
          operation: 'useQuotas'
        });
        throw error;
      }

      return data as QuotasResponse;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Poll every 60 seconds
    refetchOnWindowFocus: true,
  });

  // Helper to invalidate and refetch quotas
  const refreshQuotas = () => {
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.userCredits, 'quotas']
    });
  };

  const isSubscriber = data?.subscription.is_active ?? false;
  const creditBalance = data?.credits.balance ?? 0;
  const chaptersRemaining = data?.chapters.limit_per_day
    ? data.chapters.limit_per_day - data.chapters.used_today
    : null; // null = unlimited

  return {
    quotas: data,
    creditBalance,
    chaptersRemaining,
    isSubscriber,
    isLoading,
    error,
    refetch,
    refreshQuotas,
  };
};

/**
 * Calculate hours until chapter reset
 */
export const useChapterResetTime = () => {
  const { quotas } = useQuotas();

  if (!quotas?.chapters.resets_at) return 0;

  const resetTime = new Date(quotas.chapters.resets_at).getTime();
  const now = Date.now();
  const diff = resetTime - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
};

/**
 * Format time until reset for display
 */
export const formatTimeUntilReset = (hours: number): string => {
  if (hours === 0) return 'Soon';
  if (hours === 1) return '1 hour';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
};
