import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/production-logger';

export interface SubscriptionStatus {
  subscribed: boolean;
  tier: 'free' | 'starter' | 'premium';
  product_id: string | null;
  subscription_end: string | null;
  credits_per_month: number;
  loading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    tier: 'free',
    product_id: null,
    subscription_end: null,
    credits_per_month: 10,
    loading: true,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSubscriptionStatus({
        subscribed: false,
        tier: 'free',
        product_id: null,
        subscription_end: null,
        credits_per_month: 10,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setSubscriptionStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      setSubscriptionStatus({
        subscribed: data.subscribed || false,
        tier: data.tier || 'free',
        product_id: data.product_id || null,
        subscription_end: data.subscription_end || null,
        credits_per_month: data.credits_per_month || 10,
        loading: false,
        error: null,
      });
    } catch (error) {
      logger.error('Error checking subscription', error, {
        operation: 'subscription-check',
        userId: user?.id
      });
      setSubscriptionStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  }, [isAuthenticated, user]);

  const createCheckout = async (priceId: string, type: 'subscription' | 'payment' = 'subscription') => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with checkout.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: priceId, type },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      return data.url;
    } catch (error) {
      logger.error('Error creating checkout', error, {
        operation: 'checkout-create',
        priceId,
        type,
        userId: user?.id
      });
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: "destructive",
      });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      // Open customer portal in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      logger.error('Error opening customer portal', error, {
        operation: 'customer-portal',
        userId: user?.id
      });
      toast({
        title: "Portal Error",
        description: error instanceof Error ? error.message : 'Failed to open customer portal',
        variant: "destructive",
      });
    }
  };

  // Check subscription on mount and when auth state changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh subscription status every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkSubscription]);

  return {
    ...subscriptionStatus,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    refresh: checkSubscription,
  };
};