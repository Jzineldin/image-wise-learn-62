/**
 * React Query hooks for authentication operations
 * Centralizes auth state management with proper caching
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Get current user session with caching
 */
export const useAuthSession = () => {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: async () => {
      logger.apiCall('getSession', { operation: 'auth_session' });
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Failed to get auth session', error);
        throw error;
      }
      
      logger.apiResponse('getSession', true, { 
        hasSession: !!data.session,
        hasUser: !!data.session?.user 
      });
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Don't retry auth calls aggressively
  });
};

/**
 * Get current user with caching
 */
export const useAuthUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async () => {
      logger.apiCall('getUser', { operation: 'auth_user' });
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        logger.error('Failed to get auth user', error);
        throw error;
      }
      
      logger.apiResponse('getUser', true, { hasUser: !!data.user });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

/**
 * Sign up mutation
 */
export const useSignUp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      logger.apiCall('signUp', { email, operation: 'auth_signup' });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        logger.error('Sign up failed', error, { email });
        throw error;
      }
      
      logger.apiResponse('signUp', true, { hasUser: !!data.user });
      return data;
    },
    onSuccess: () => {
      // Invalidate auth queries on successful signup
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

/**
 * Sign in mutation
 */
export const useSignIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      logger.apiCall('signIn', { email, operation: 'auth_signin' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('Sign in failed', error, { email });
        throw error;
      }
      
      logger.apiResponse('signIn', true, { hasUser: !!data.user });
      return data;
    },
    onSuccess: () => {
      // Invalidate auth queries on successful signin
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

/**
 * Google OAuth sign in mutation
 */
export const useGoogleSignIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      logger.apiCall('googleSignIn', { operation: 'auth_google_signin' });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        logger.error('Google sign in failed', error);
        throw error;
      }
      
      logger.apiResponse('googleSignIn', true);
      return data;
    },
    onSuccess: () => {
      // Invalidate auth queries on successful signin
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
};

/**
 * Sign out mutation
 */
export const useSignOut = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      logger.apiCall('signOut', { operation: 'auth_signout' });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Sign out failed', error);
        throw error;
      }
      
      logger.apiResponse('signOut', true);
    },
    onSuccess: () => {
      // Clear all cached data on signout
      queryClient.clear();
    },
  });
};

/**
 * Auth state change listener hook
 */
export const useAuthStateChange = (callback: (session: Session | null) => void) => {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.info('Auth state changed', { event, hasSession: !!session });
        
        // Update cached auth data
        queryClient.setQueryData(queryKeys.auth.session, { session });
        queryClient.setQueryData(queryKeys.auth.user, { user: session?.user || null });
        
        callback(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [callback, queryClient]);
};