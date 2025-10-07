import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveStats {
  founderCount: number;
  totalUsers: number;
  totalStories: number;
  completedStories: number;
}

export const useLiveStats = () => {
  const [stats, setStats] = useState<LiveStats>({
    founderCount: 8,
    totalUsers: 15,
    totalStories: 0,
    completedStories: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_live_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        setStats({
          founderCount: Number(result.founder_count) || 8,
          totalUsers: Number(result.total_users) || 15,
          totalStories: Number(result.total_stories) || 0,
          completedStories: Number(result.completed_stories) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching live stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, isLoading };
};
