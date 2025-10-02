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

interface StorySegment {
  id: string;
  segment_number: number;
  content: string | null;
  image_url?: string | null;
  audio_url?: string | null;
}

interface CreditCalculation {
  totalCredits: number;
  creditsUsed: number;
  breakdown: {
    segments: number;
    images: number;
    audio: number;
    total: number;
  };
  isLoading: boolean;
}

/**
 * Calculate credits used for a story based on its segments
 * 
 * Credit costs:
 * - Story segment (text): 1 credit
 * - Image generation: 1 credit
 * - Audio generation: 1 credit per 100 words (rounded up)
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
        .single();

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
        total: 0
      };
    }

    let segmentCredits = 0;
    let imageCredits = 0;
    let audioCredits = 0;

    segments.forEach((segment) => {
      // Count segment text generation (1 credit per segment)
      if (segment.content && segment.content.trim().length > 0) {
        segmentCredits += 1;
      }

      // Count image generation (1 credit per image)
      if (segment.image_url) {
        imageCredits += 1;
      }

      // Count audio generation (1 credit per 100 words, rounded up)
      if (segment.audio_url && segment.content) {
        const wordCount = segment.content.trim().split(/\s+/).filter(w => w.length > 0).length;
        const audioCost = Math.max(1, Math.ceil(wordCount / 100));
        audioCredits += audioCost;
      }
    });

    const total = segmentCredits + imageCredits + audioCredits;

    return {
      segments: segmentCredits,
      images: imageCredits,
      audio: audioCredits,
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
  estimatedWordCount: number = 150
): number => {
  let cost = 1; // Base segment cost

  if (includeImage) {
    cost += 1; // Image generation
  }

  if (includeAudio) {
    cost += Math.max(1, Math.ceil(estimatedWordCount / 100)); // Audio cost
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
  total: number;
}): string => {
  const parts: string[] = [];

  if (breakdown.segments > 0) {
    parts.push(`${breakdown.segments} segment${breakdown.segments > 1 ? 's' : ''}`);
  }

  if (breakdown.images > 0) {
    parts.push(`${breakdown.images} image${breakdown.images > 1 ? 's' : ''}`);
  }

  if (breakdown.audio > 0) {
    parts.push(`${breakdown.audio} audio`);
  }

  if (parts.length === 0) {
    return 'No credits used yet';
  }

  return parts.join(' + ') + ` = ${breakdown.total} credit${breakdown.total > 1 ? 's' : ''}`;
};

