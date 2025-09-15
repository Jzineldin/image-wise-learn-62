import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  BookOpen,
  TrendingUp,
  Coins,
  Calendar,
  Globe,
  Star,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';

interface AnalyticsData {
  overview: {
    total_users: number;
    total_stories: number;
    total_credits_used: number;
    monthly_active_users: number;
    stories_this_month: number;
    credits_used_this_month: number;
  };
  daily_usage: Array<{
    date: string;
    users: number;
    stories: number;
    credits: number;
  }>;
  genre_distribution: Array<{
    genre: string;
    count: number;
    percentage: number;
  }>;
  age_group_distribution: Array<{
    age_group: string;
    count: number;
    percentage: number;
  }>;
  top_users: Array<{
    user_id: string;
    user_name: string;
    stories_count: number;
    credits_used: number;
  }>;
  featured_performance: Array<{
    story_id: string;
    title: string;
    views: number;
    author: string;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get overview stats
      const { data: overview, error: overviewError } = await supabase.rpc('admin_get_analytics_overview', {
        days: parseInt(timeRange.replace('d', ''))
      });
      if (overviewError) throw overviewError;

      // Get daily usage data
      const { data: dailyUsage, error: dailyError } = await supabase.rpc('admin_get_daily_usage', {
        days: parseInt(timeRange.replace('d', ''))
      });
      if (dailyError) throw dailyError;

      // Get genre distribution
      const { data: genreData, error: genreError } = await supabase.rpc('admin_get_genre_distribution');
      if (genreError) throw genreError;

      // Get age group distribution
      const { data: ageData, error: ageError } = await supabase.rpc('admin_get_age_group_distribution');
      if (ageError) throw ageError;

      // Get top users
      const { data: topUsers, error: usersError } = await supabase.rpc('admin_get_top_users', {
        limit_count: 10
      });
      if (usersError) throw usersError;

      // Get featured story performance
      const { data: featuredPerf, error: featuredError } = await supabase.rpc('admin_get_featured_performance');
      if (featuredError) throw featuredError;

      setAnalyticsData({
        overview: overview[0] || {
          total_users: 0,
          total_stories: 0,
          total_credits_used: 0,
          monthly_active_users: 0,
          stories_this_month: 0,
          credits_used_this_month: 0
        },
        daily_usage: dailyUsage || [],
        genre_distribution: genreData || [],
        age_group_distribution: ageData || [],
        top_users: topUsers || [],
        featured_performance: featuredPerf || []
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
      // This would generate a CSV or JSON export of the analytics data
      const dataStr = JSON.stringify(analyticsData, null, 2);
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

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No analytics data available.</p>
      </div>
    );
  }

  const { overview, daily_usage, genre_distribution, age_group_distribution, top_users, featured_performance } = analyticsData;

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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={daily_usage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="stories" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Credits Usage Chart */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Credits Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={daily_usage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="credits" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Genre Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genre_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ genre, percentage }) => `${genre}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {genre_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Group Distribution */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Age Group Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={age_group_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age_group" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Top Content Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_users.map((user, index) => (
                <div key={user.user_id} className="flex items-center justify-between glass-card p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{user.user_name || 'Anonymous User'}</p>
                      <p className="text-sm text-text-secondary">
                        {user.stories_count} stories • {user.credits_used} credits used
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Story Performance */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Featured Story Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featured_performance.map((story, index) => (
                <div key={story.story_id} className="flex items-center justify-between glass-card p-3">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-semibold">{story.title}</p>
                      <p className="text-sm text-text-secondary">
                        by {story.author} • {story.views} views
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;