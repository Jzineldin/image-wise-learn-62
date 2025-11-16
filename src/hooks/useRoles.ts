import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface UserRoles {
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

export const useRoles = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UserRoles>({
    roles: [],
    isAdmin: false,
    loading: true,
    error: null,
  });

  const fetchRoles = useCallback(async () => {
    if (!user) {
      setState({ roles: [], isAdmin: false, loading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch all roles for the user
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map(r => r.role) || [];
      const isAdmin = roles.includes('admin');

      setState({ roles, isAdmin, loading: false, error: null });
      
      logger.debug('User roles fetched', { userId: user.id, roles, isAdmin });
    } catch (error) {
      logger.error('Error fetching user roles', error, { userId: user.id });
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error('Failed to fetch roles') 
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    ...state,
    refresh: fetchRoles,
  };
};
