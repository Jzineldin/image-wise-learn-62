import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { logger } from '@/lib/production-logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  checkStoryAccess?: boolean;
  requiresAdmin?: boolean;
  requiresRole?: string;
}

const ProtectedRoute = ({
  children,
  requiresAuth = true,
  checkStoryAccess = false,
  requiresAdmin = false,
  requiresRole
}: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyAccessible, setStoryAccessible] = useState(true);
  const [hasRequiredRole, setHasRequiredRole] = useState(true);
  const { id: storyId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!checkStoryAccess && !requiresAdmin && !requiresRole) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!checkStoryAccess && !requiresAdmin && !requiresRole) {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkStoryAccess, requiresAdmin, requiresRole]);

  useEffect(() => {
    if (checkStoryAccess && storyId) {
      checkStoryAccessibility();
    }
  }, [checkStoryAccess, storyId, user]);

  useEffect(() => {
    if ((requiresAdmin || requiresRole) && user) {
      checkRoleAccess();
    }
  }, [requiresAdmin, requiresRole, user]);

  // Context7 Pattern: Centralized role checking with proper error handling
  const checkRoleAccess = async () => {
    if (!user) {
      setHasRequiredRole(false);
      setLoading(false);
      return;
    }

    try {
      const roleToCheck = requiresRole || (requiresAdmin ? 'admin' : null);
      if (!roleToCheck) {
        setHasRequiredRole(true);
        setLoading(false);
        return;
      }

      logger.info('Checking role access', {
        userId: user.id,
        requiredRole: roleToCheck,
        operation: 'role-access-check'
      });

      const { data: hasRole, error } = await supabase.rpc('has_role', {
        check_role: roleToCheck
      });

      if (error) {
        logger.error('Error checking role', error, {
          operation: 'role-access-check',
          userId: user.id,
          requiredRole: roleToCheck
        });
        setHasRequiredRole(false);
      } else {
        setHasRequiredRole(hasRole || false);
        logger.info('Role check completed', {
          userId: user.id,
          requiredRole: roleToCheck,
          hasRole: hasRole || false
        });
      }
    } catch (error) {
      logger.error('Role check failed', error, {
        operation: 'role-access-check-general',
        userId: user.id
      });
      setHasRequiredRole(false);
    } finally {
      setLoading(false);
    }
  };

  const checkStoryAccessibility = async () => {
    if (!storyId) {
      setLoading(false);
      return;
    }

    try {
      const { data: storyData, error } = await supabase
        .from('stories')
        .select('visibility, status, author_id, user_id, is_completed, is_complete')
        .eq('id', storyId)
        .maybeSingle();

      if (error) {
        logger.error('Error checking story', error, {
          operation: 'story-access-check',
          storyId,
          userId: user?.id
        });
        setStoryAccessible(false);
        setLoading(false);
        return;
      }

      if (!storyData) {
        setStoryAccessible(false);
        setLoading(false);
        return;
      }

      // Allow access to completed stories in both modes
      const isCompleted = storyData.status === 'completed' || 
                         storyData.is_completed || 
                         storyData.is_complete;

      // Check access permissions
      const isOwner = user && (storyData.author_id === user.id || storyData.user_id === user.id);
      const isPublic = storyData.visibility === 'public';
      
      if (mode === 'experience') {
        // Experience mode: accessible if public or user is owner
        setStoryAccessible(isPublic || !!isOwner);
      } else {
        // Edit/create mode: only accessible by owner
        setStoryAccessible(!!isOwner);
      }

    } catch (error) {
      logger.error('Error checking story access', error, {
        operation: 'story-access-check-general',
        storyId,
        userId: user?.id
      });
      setStoryAccessible(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  // Handle authentication requirement
  if (requiresAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Context7 Pattern: Role-based access control with proper redirects
  if ((requiresAdmin || requiresRole) && !hasRequiredRole) {
    logger.warn('Access denied - insufficient role', {
      userId: user?.id,
      requiredRole: requiresRole || 'admin',
      operation: 'access-denied'
    });
    return <Navigate to="/dashboard" replace />;
  }

  // Handle story access for story-specific routes
  if (checkStoryAccess && storyId) {
    if (!storyAccessible) {
      // Check if we need to redirect to experience mode for completed stories
      if (mode !== 'experience') {
        return <Navigate to={`/story/${storyId}?mode=experience`} replace />;
      }
      // Otherwise redirect to discover page
      return <Navigate to="/discover" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
