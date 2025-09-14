import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedStoryRouteProps {
  children: React.ReactNode;
}

const ProtectedStoryRoute: React.FC<ProtectedStoryRouteProps> = ({ children }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    const checkStoryStatus = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const { data: storyData } = await supabase
          .from('stories')
          .select('status, author_id, user_id')
          .eq('id', id)
          .maybeSingle();

        setStory(storyData);
      } catch (error) {
        console.error('Error checking story status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStoryStatus();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  // If story is completed, redirect to read-only viewer
  if (story && (story.status === 'completed' || story.is_completed || story.is_complete)) {
    return <Navigate to={`/story/${id}?mode=read`} replace />;
  }

  // If user is not the owner and trying to edit, redirect to read mode
  if (story && user && story.author_id !== user.id && story.user_id !== user.id) {
    return <Navigate to={`/story/${id}?mode=read`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedStoryRoute;