/**
 * Hook for calculating and tracking story credit usage
 * Provides real-time credit calculations based on actual story content
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-client';
import { logger } from '@/lib/production-logger';
import { CREDIT_COSTS, calculateAudioCredits, calculateVideoCredits } from '../../shared/credit-costs';

interface StorySegment {
  id: string;
  segment_number: number;
  content: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
}

interface CreditCalculation {
  totalCredits: number;
  creditsUsed: number;
  breakdown: {
    segments: number;
    images: number;
    audio: number;
    video: number;
    total: number;
  };
  isLoading: boolean;
}

/**
 * Calculate credits used for a story based on its segments
 * 
 * Credit costs (from shared/credit-costs.ts):
 * - Story generation: FREE (0 credits)
 * - Story segment (text): FREE (0 credits)
 * - Image generation: FREE (0 credits)
 * - Audio generation: 1 credit per 100 words (rounded up)
 * - Video generation: 12 credits (8-second fixed duration)
 */
export const useStoryCredits = (
  storyId: string | undefined,
  segments: StorySegment[]
): CreditCalculation => {
  const { user } = useAuth();

  // Fetch user's total credits
  const { data: userCreditsData, isLoading } = useQuery({
    queryKey: [...queryKeys.userCredits, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_credits')
        .select('current_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch user credits', error, {
          userId: user.id,
          operation: 'useStoryCredits'
        });
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds - credits change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate credits used for this story
  const creditsUsed = useMemo(() => {
    if (!segments || segments.length === 0) {
      return {
        segments: 0,
        images: 0,
        audio: 0,
        video: 0,
        total: 0
      };
    }

    let segmentCredits = 0;
    let imageCredits = 0;
    let audioCredits = 0;
    let videoCredits = 0;

    segments.forEach((segment) => {
      // Story segments: FREE (0 credits)
      if (segment.content && segment.content.trim().length > 0) {
        segmentCredits += CREDIT_COSTS.segment;
      }

      // Image generation: FREE (0 credits)
      if (segment.image_url) {
        imageCredits += CREDIT_COSTS.image;
      }

      // Audio generation: 1 credit per 100 words (rounded up)
      if (segment.audio_url && segment.content) {
        audioCredits += calculateAudioCredits(segment.content);
      }

      // Video generation: 12 credits for 8-second video
      if (segment.video_url) {
        videoCredits += CREDIT_COSTS.videoLong;
      }
    });

    const total = segmentCredits + imageCredits + audioCredits + videoCredits;

    return {
      segments: segmentCredits,
      images: imageCredits,
      audio: audioCredits,
      video: videoCredits,
      total
    };
  }, [segments]);

  const totalCredits = userCreditsData?.current_balance ?? 0;

  return {
    totalCredits,
    creditsUsed: creditsUsed.total,
    breakdown: creditsUsed,
    isLoading
  };
};

/**
 * Calculate estimated credits for a new segment
 * Useful for showing users cost before generation
 */
export const estimateSegmentCost = (
  includeImage: boolean = true,
  includeAudio: boolean = false,
  includeVideo: boolean = false,
  estimatedWordCount: number = 150
): number => {
  let cost = CREDIT_COSTS.segment; // Story segment: FREE (0 credits)

  if (includeImage) {
    cost += CREDIT_COSTS.image; // Image generation: FREE (0 credits)
  }

  if (includeAudio) {
    cost += Math.max(1, Math.ceil(estimatedWordCount / 100)); // Audio: 1 credit per 100 words
  }

  if (includeVideo) {
    cost += CREDIT_COSTS.videoLong; // Video: 12 credits (8 seconds)
  }

  return cost;
};

/**
 * Format credit breakdown for display
 */
export const formatCreditBreakdown = (breakdown: {
  segments: number;
  images: number;
  audio: number;
  video: number;
  total: number;
}): string => {
  const parts: string[] = [];

  // Only show paid features (audio and video)
  if (breakdown.audio > 0) {
    parts.push(`${breakdown.audio} audio`);
  }

  if (breakdown.video > 0) {
    parts.push(`${breakdown.video} video`);
  }

  if (parts.length === 0) {
    return 'No credits used yet (Story & Images are FREE!)';
  }

  return parts.join(' + ') + ` = ${breakdown.total} credit${breakdown.total > 1 ? 's' : ''}`;
};

