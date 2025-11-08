import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { logger } from '@/lib/logger';
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
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorAlert } from '@/components/ui/error-alert';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

interface UserAnalytics {
  storyCreationPattern: { date: string; count: number }[];
  creditUsageTrend: { date: string; spent: number; earned: number }[];
  genreDistribution: { genre: string; count: number; percentage: number }[];
  userEngagement: { metric: string; value: number; change: number }[];
  topUsers: { name: string; stories: number; credits: number }[];
  ageGroupDistribution: { ageGroup: string; count: number }[];
  dailyActivity: { hour: number; count: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const { data: analytics, isLoading, error, refetch } = useAnalytics(timeRange);
  const { toast } = useToast();
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [liveActivity, setLiveActivity] = useState<Array<{
    id: string;
    type: 'story' | 'credit' | 'user';
    message: string;
    timestamp: Date;
  }>>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchUserAnalytics();
  }, [timeRange]);

  // Set up real-time subscriptions
  useEffect(() => {
    logger.info('Setting up real-time analytics subscriptions');
    
    const storiesChannel = supabase
      .channel('realtime-stories')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories'
        },
        (payload) => {
          logger.info('Real-time story created', payload);
          const newStory = payload.new as any;
          setLiveActivity(prev => [{
            id: `story-${newStory.id}`,
            type: 'story',
            message: `New story created: "${newStory.title}" (${newStory.genre})`,
            timestamp: new Date()
          }, ...prev.slice(0, 19)]);
          
          // Update story count in analytics
          if (userAnalytics) {
            const today = format(new Date(), 'MMM dd');
            setUserAnalytics(prev => {
              if (!prev) return prev;
              const updated = { ...prev };
              const todayIndex = updated.storyCreationPattern.findIndex(d => d.date === today);
              if (todayIndex >= 0) {
                updated.storyCreationPattern[todayIndex].count++;
              }
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        logger.info('Stories channel status', { status });
        setIsLive(status === 'SUBSCRIBED');
      });

    const creditsChannel = supabase
      .channel('realtime-credits')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions'
        },
        (payload) => {
          logger.info('Real-time credit transaction', payload);
          const newTx = payload.new as any;
          const action = newTx.amount > 0 ? 'earned' : 'spent';
          setLiveActivity(prev => [{
            id: `credit-${newTx.id}`,
            type: 'credit',
            message: `User ${action} ${Math.abs(newTx.amount)} credits (${newTx.transaction_type})`,
            timestamp: new Date()
          }, ...prev.slice(0, 19)]);

          // Update credit trend
          if (userAnalytics) {
            const today = format(new Date(), 'MMM dd');
            setUserAnalytics(prev => {
              if (!prev) return prev;
              const updated = { ...prev };
              const todayIndex = updated.creditUsageTrend.findIndex(d => d.date === today);
              if (todayIndex >= 0) {
                if (newTx.amount < 0) {
                  updated.creditUsageTrend[todayIndex].spent += Math.abs(newTx.amount);
                } else {
                  updated.creditUsageTrend[todayIndex].earned += newTx.amount;
                }
              }
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        logger.info('Credits channel status', { status });
      });

    const usersChannel = supabase
      .channel('realtime-users')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          logger.info('Real-time user created', payload);
          const newUser = payload.new as any;
          setLiveActivity(prev => [{
            id: `user-${newUser.id}`,
            type: 'user',
            message: `New user joined: ${newUser.email || 'Anonymous'}`,
            timestamp: new Date()
          }, ...prev.slice(0, 19)]);
        }
      )
      .subscribe((status) => {
        logger.info('Users channel status', { status });
      });

    return () => {
      logger.info('Cleaning up real-time subscriptions');
      supabase.removeChannel(storiesChannel);
      supabase.removeChannel(creditsChannel);
      supabase.removeChannel(usersChannel);
      setIsLive(false);
    };
  }, [userAnalytics]);

  const getDaysCount = (range: string) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const fetchUserAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const days = getDaysCount(timeRange);
      const startDate = subDays(new Date(), days);

      // Story creation pattern
      const { data: storyData } = await supabase
        .from('stories')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const storyPattern = Array.from({ length: days }, (_, i) => {
        const date = format(subDays(new Date(), days - i - 1), 'MMM dd');
        const dayStart = startOfDay(subDays(new Date(), days - i - 1));
        const dayEnd = startOfDay(subDays(new Date(), days - i));
        const count = storyData?.filter(s => {
          const created = parseISO(s.created_at);
          return created >= dayStart && created < dayEnd;
        }).length || 0;
        return { date, count };
      });

      // Credit usage trend
      const { data: creditData } = await supabase
        .from('credit_transactions')
        .select('created_at, amount')
        .gte('created_at', startDate.toISOString());

      const creditTrend = Array.from({ length: days }, (_, i) => {
        const date = format(subDays(new Date(), days - i - 1), 'MMM dd');
        const dayStart = startOfDay(subDays(new Date(), days - i - 1));
        const dayEnd = startOfDay(subDays(new Date(), days - i));
        const dayTransactions = creditData?.filter(t => {
          const created = parseISO(t.created_at);
          return created >= dayStart && created < dayEnd;
        }) || [];
        const spent = dayTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const earned = dayTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        return { date, spent, earned };
      });

      // Genre distribution
      const { data: genreData } = await supabase.rpc('admin_get_genre_distribution');
      const genreDistribution = genreData?.map((g: any) => ({
        genre: g.genre || 'Unknown',
        count: parseInt(g.count),
        percentage: parseFloat(g.percentage)
      })) || [];

      // Age group distribution
      const { data: ageData } = await supabase.rpc('admin_get_age_group_distribution');
      const ageGroupDistribution = ageData?.map((a: any) => ({
        ageGroup: a.age_group || 'Unknown',
        count: parseInt(a.count)
      })) || [];

      // Top users
      const { data: topUserData } = await supabase.rpc('admin_get_top_users', { limit_count: 5 });
      const topUsers = topUserData?.map((u: any) => ({
        name: u.user_name || 'Anonymous',
        stories: parseInt(u.stories_count),
        credits: parseInt(u.credits_used)
      })) || [];

      // User engagement metrics
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', subDays(new Date(), 7).toISOString());

      const { data: activeUsers } = await supabase
        .from('stories')
        .select('user_id')
        .gte('created_at', subDays(new Date(), 7).toISOString());

      const uniqueActive = new Set(activeUsers?.map(s => s.user_id)).size;
      const newUsers = recentUsers?.length || 0;

      // Daily activity by hour
      const { data: activityData } = await supabase
        .from('stories')
        .select('created_at')
        .gte('created_at', subDays(new Date(), 7).toISOString());

      const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
        const count = activityData?.filter(s => {
          const created = parseISO(s.created_at);
          return created.getHours() === hour;
        }).length || 0;
        return { hour, count };
      });

      setUserAnalytics({
        storyCreationPattern: storyPattern,
        creditUsageTrend: creditTrend,
        genreDistribution: genreDistribution,
        userEngagement: [
          { metric: 'New Users (7d)', value: newUsers, change: 0 },
          { metric: 'Active Users (7d)', value: uniqueActive, change: 0 },
          { metric: 'Avg Stories/User', value: Math.round((storyData?.length || 0) / Math.max(uniqueActive, 1)), change: 0 }
        ],
        topUsers: topUsers,
        ageGroupDistribution: ageGroupDistribution,
        dailyActivity: hourlyActivity
      });
    } catch (error) {
      logger.error('Error fetching user analytics', error);
      toast({
        title: "Error",
        description: "Failed to load detailed analytics.",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const exportData = async () => {
    if (!analytics || !userAnalytics) return;
    
    try {
      const exportData = { overview: analytics, detailed: userAnalytics };
      const dataStr = JSON.stringify(exportData, null, 2);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    logger.error('Analytics dashboard error', error);
    return (
      <div className="space-y-6">
        <ErrorAlert
          title="Failed to Load Analytics"
          message="Unable to load analytics data. Please try again."
          actions={
            <Button onClick={() => refetch()} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Analytics Dashboard
              {isLive && (
                <span className="flex items-center gap-1 text-sm font-normal text-green-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </h2>
            <p className="text-text-secondary">Platform usage and performance metrics</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={exportData} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => { 
                refetch(); 
                fetchUserAnalytics(); 
              }} 
              variant="outline" 
              size="sm" 
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Users</p>
                <p className="text-2xl font-bold text-primary">{analytics.totalUsers}</p>
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
                <p className="text-2xl font-bold text-primary">{analytics.totalStories}</p>
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
                <p className="text-2xl font-bold text-primary">{analytics.activeUsers30d}</p>
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
                <p className="text-2xl font-bold text-primary">{analytics.monthlyStats.stories}</p>
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
                <p className="text-2xl font-bold text-primary">{analytics.totalCreditsUsed}</p>
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
                <p className="text-2xl font-bold text-primary">{analytics.monthlyStats.credits}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      {liveActivity.length > 0 && (
        <Card className="glass-card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Activity Feed
                {isLive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLiveActivity([])}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {liveActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    activity.type === 'story' 
                      ? 'bg-blue-500/5 border-blue-500/20' 
                      : activity.type === 'credit' 
                      ? 'bg-yellow-500/5 border-yellow-500/20'
                      : 'bg-green-500/5 border-green-500/20'
                  } animate-in fade-in slide-in-from-right-2 duration-300`}
                >
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'story' 
                      ? 'bg-blue-500' 
                      : activity.type === 'credit' 
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {format(activity.timestamp, 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics Charts */}
      {loadingAnalytics ? (
        <Card className="glass-card-elevated">
          <CardContent className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : userAnalytics && (
        <>
          {/* Story Creation Pattern */}
          <Card className="glass-card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Story Creation Pattern
                  </CardTitle>
                  <p className="text-sm text-text-secondary mt-1">Daily story creation over time</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userAnalytics.storyCreationPattern}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--text-secondary))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--text-secondary))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Credit Usage Trends */}
          <Card className="glass-card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Credit Usage Trends
                  </CardTitle>
                  <p className="text-sm text-text-secondary mt-1">Credits spent vs earned over time</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userAnalytics.creditUsageTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--text-secondary))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--text-secondary))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="spent" 
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Credits Spent"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earned" 
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Credits Earned"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Genre Distribution */}
            <Card className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Popular Genres
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Genre distribution of completed stories</p>
              </CardHeader>
              <CardContent>
                {userAnalytics.genreDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userAnalytics.genreDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ genre, percentage }) => `${genre}: ${percentage.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {userAnalytics.genreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-text-secondary">
                    No genre data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Age Group Distribution */}
            <Card className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Age Group Distribution
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Stories by target age group</p>
              </CardHeader>
              <CardContent>
                {userAnalytics.ageGroupDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userAnalytics.ageGroupDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="ageGroup" 
                        stroke="hsl(var(--text-secondary))"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--text-secondary))"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-text-secondary">
                    No age group data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity Heatmap */}
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Activity by Hour
              </CardTitle>
              <p className="text-sm text-text-secondary mt-1">Story creation activity by hour of day (last 7 days)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userAnalytics.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(var(--text-secondary))"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis 
                    stroke="hsl(var(--text-secondary))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(hour) => `${hour}:00 - ${hour}:59`}
                  />
                  <Bar dataKey="count" fill="hsl(var(--accent))" name="Stories Created" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Engagement & Top Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  User Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAnalytics.userEngagement.map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-text-secondary">{metric.metric}</span>
                      <span className="text-xl font-bold text-primary">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Content Creators
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Most active users by story count</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userAnalytics.topUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-text-secondary">{user.stories} stories</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.credits}</p>
                        <p className="text-xs text-text-secondary">credits used</p>
                      </div>
                    </div>
                  ))}
                  {userAnalytics.topUsers.length === 0 && (
                    <p className="text-center text-text-secondary py-4">No user data available yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;