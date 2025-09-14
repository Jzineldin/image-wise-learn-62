import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  checkStoryAccess?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requiresAuth = true, 
  checkStoryAccess = false 
}: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyAccessible, setStoryAccessible] = useState(true);
  const { id: storyId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!checkStoryAccess) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!checkStoryAccess) {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkStoryAccess]);

  useEffect(() => {
    if (checkStoryAccess && storyId) {
      checkStoryAccessibility();
    }
  }, [checkStoryAccess, storyId, user]);

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
        console.error('Error checking story:', error);
        setStoryAccessible(false);
        setLoading(false);
        return;
      }

      if (!storyData) {
        setStoryAccessible(false);
        setLoading(false);
        return;
      }

      // Check if story is completed and should be in read mode
      const isCompleted = storyData.status === 'completed' || 
                         storyData.is_completed || 
                         storyData.is_complete;

      if (isCompleted && mode !== 'read') {
        // Redirect to read mode for completed stories
        setStoryAccessible(false);
        setLoading(false);
        return;
      }

      // Check access permissions
      const isOwner = user && (storyData.author_id === user.id || storyData.user_id === user.id);
      const isPublic = storyData.visibility === 'public';
      
      if (mode === 'read') {
        // Read mode: accessible if public or user is owner
        setStoryAccessible(isPublic || !!isOwner);
      } else {
        // Edit/create mode: only accessible by owner
        setStoryAccessible(!!isOwner);
      }

    } catch (error) {
      console.error('Error checking story access:', error);
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

  // Handle story access for story-specific routes
  if (checkStoryAccess && storyId) {
    if (!storyAccessible) {
      // Check if we need to redirect to read mode for completed stories
      if (mode !== 'read') {
        return <Navigate to={`/story/${storyId}?mode=read`} replace />;
      }
      // Otherwise redirect to discover page
      return <Navigate to="/discover" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
