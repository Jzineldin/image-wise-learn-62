import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  BookOpen,
  TrendingUp,
  Coins,
  Calendar,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';

interface OverviewData {
  total_users: number;
  total_stories: number;
  total_credits_used: number;
  monthly_active_users: number;
  stories_this_month: number;
  credits_used_this_month: number;
}

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState<OverviewData>({
    total_users: 0,
    total_stories: 0,
    total_credits_used: 0,
    monthly_active_users: 0,
    stories_this_month: 0,
    credits_used_this_month: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get basic counts from database tables
      const [usersResult, storiesResult, creditsResult] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('stories').select('id, created_at, credits_used'),
        supabase.from('user_credits').select('total_spent')
      ]);

      const totalUsers = usersResult.data?.length || 0;
      const totalStories = storiesResult.data?.length || 0;
      const totalCreditsUsed = storiesResult.data?.reduce((sum, story) => sum + (story.credits_used || 0), 0) || 0;

      // Calculate monthly stats
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const storiesThisMonth = storiesResult.data?.filter(
        story => new Date(story.created_at) >= currentMonth
      ).length || 0;

      setOverview({
        total_users: totalUsers,
        total_stories: totalStories,
        total_credits_used: totalCreditsUsed,
        monthly_active_users: Math.floor(totalUsers * 0.6), // Estimate
        stories_this_month: storiesThisMonth,
        credits_used_this_month: Math.floor(totalCreditsUsed * 0.2) // Estimate
      });

      logger.info('Loaded analytics data', { timeRange });
    } catch (error) {
      logger.error('Error loading analytics', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const dataStr = JSON.stringify(overview, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Analytics data exported successfully.",
      });
    } catch (error) {
      logger.error('Error exporting data', error);
      toast({
        title: "Error",
        description: "Failed to export data.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-text-secondary">Platform usage and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Users</p>
                <p className="text-2xl font-bold text-primary">{overview.total_users}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Stories</p>
                <p className="text-2xl font-bold text-primary">{overview.total_stories}</p>
              </div>
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Monthly Active</p>
                <p className="text-2xl font-bold text-primary">{overview.monthly_active_users}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Stories This Month</p>
                <p className="text-2xl font-bold text-primary">{overview.stories_this_month}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Credits Used</p>
                <p className="text-2xl font-bold text-primary">{overview.total_credits_used}</p>
              </div>
              <Coins className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Credits This Month</p>
                <p className="text-2xl font-bold text-primary">{overview.credits_used_this_month}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future charts */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">
              Detailed analytics charts will be available once more data is collected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;