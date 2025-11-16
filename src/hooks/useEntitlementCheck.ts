/**
 * useEntitlementCheck Hook
 *
 * Pre-flight checks for feature entitlement before showing generation UI
 * Prevents infinite spinners by gating upfront
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/production-logger';
import { calculateTTSCredits, calculateAnimateCredits, calculateVideoCredits } from '../../shared/credit-costs';

export type FeatureType = 'chapter' | 'tts' | 'animate' | 'video';

export interface EntitlementResult {
  allowed: boolean;
  reason?: 'subscriber' | 'has_credits' | 'daily_limit' | 'insufficient_credits';
  cost?: number;
  balance?: number;
  deficit?: number;
  remaining?: number;
  resets_at?: string;
  used?: number;
  limit?: number;
}

/**
 * Check if user can generate a chapter (text + image)
 */
export const useCanGenerateChapter = () => {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkEntitlement = useCallback(async (): Promise<EntitlementResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'daily_limit' };
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('can_generate_chapter', {
        user_uuid: user.id
      });

      if (error) throw error;

      return data as EntitlementResult;
    } catch (error) {
      logger.error('Failed to check chapter entitlement', error, {
        userId: user.id
      });
      return { allowed: false };
    } finally {
      setIsChecking(false);
    }
  }, [user?.id]);

  return { checkEntitlement, isChecking };
};

/**
 * Check if user has sufficient credits for a feature
 */
export const useCanUseFeature = () => {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkEntitlement = useCallback(async (
    feature: 'tts' | 'animate' | 'video',
    options?: { text?: string }
  ): Promise<EntitlementResult> => {
    if (!user?.id) {
      return { allowed: false, reason: 'insufficient_credits' };
    }

    // Calculate estimated cost
    let estimatedCost = 0;
    switch (feature) {
      case 'tts':
        estimatedCost = options?.text ? calculateTTSCredits(options.text) : 60; // Default 30sec estimate
        break;
      case 'animate':
        estimatedCost = calculateAnimateCredits();
        break;
      case 'video':
        estimatedCost = calculateVideoCredits();
        break;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_credit_entitlement', {
        user_uuid: user.id,
        feature_type: feature,
        estimated_cost: estimatedCost
      });

      if (error) throw error;

      return data as EntitlementResult;
    } catch (error) {
      logger.error('Failed to check feature entitlement', error, {
        userId: user.id,
        feature,
        estimatedCost
      });
      return { allowed: false };
    } finally {
      setIsChecking(false);
    }
  }, [user?.id]);

  return { checkEntitlement, isChecking };
};

/**
 * Unified entitlement hook for all features
 */
export const useEntitlementCheck = () => {
  const { checkEntitlement: checkChapter, isChecking: isCheckingChapter } = useCanGenerateChapter();
  const { checkEntitlement: checkFeature, isChecking: isCheckingFeature } = useCanUseFeature();

  const checkEntitlement = useCallback(async (
    feature: FeatureType,
    options?: { text?: string }
  ): Promise<EntitlementResult> => {
    if (feature === 'chapter') {
      return checkChapter();
    }
    return checkFeature(feature, options);
  }, [checkChapter, checkFeature]);

  return {
    checkEntitlement,
    isChecking: isCheckingChapter || isCheckingFeature
  };
};
