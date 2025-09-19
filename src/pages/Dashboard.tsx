import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Book, Users, TrendingUp, Zap, Crown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import CreditDisplay from '@/components/CreditDisplay';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import UsageAnalytics from '@/components/UsageAnalytics';
import OnboardingTour, { useOnboarding } from '@/components/OnboardingTour';
import StoryCard from '@/components/StoryCard';

const Dashboard = () => {
  const [stats, setStats] = useState({
    storiesCreated: 0,
    totalViews: 0,
    totalLikes: 0,
    followers: 0,
    creditsUsed: 0,
    voiceMinutes: 0
  });
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { tier, subscribed } = useSubscription();
  const { showTour, closeTour } = useOnboarding();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user stories
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (storiesError) throw storiesError;

      // Enrich with segment/audio counts for UI indicators
      const ids = (stories || []).map((s: any) => s.id);
      let segCounts: Record<string, number> = {};
      let audCounts: Record<string, number> = {};
      let textCounts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: segs, error: segErr } = await supabase
          .from('story_segments')
          .select('story_id,audio_url,content')
          .in('story_id', ids);
        if (!segErr) {
          (segs || []).forEach((row: any) => {
            segCounts[row.story_id] = (segCounts[row.story_id] || 0) + 1;
            if (row.audio_url) {
              audCounts[row.story_id] = (audCounts[row.story_id] || 0) + 1;
            }
            const hasText = typeof row.content === 'string' && row.content.trim().length > 0;
            if (hasText) {
              textCounts[row.story_id] = (textCounts[row.story_id] || 0) + 1;
            }
          });
        }
      }

      // Get current month usage statistics
      const { data: usageStats, error: usageError } = await supabase.rpc('get_current_month_usage');

      // Calculate stats
      const totalStories = stories?.length || 0;
      const monthlyStats = usageStats?.[0] || { credits_used: 0, voice_minutes_used: 0 };

      setStats({
        storiesCreated: totalStories,
        totalViews: 0, // Would need analytics table
        totalLikes: 0, // Would need likes table
        followers: 0,  // Would need followers table
        creditsUsed: monthlyStats.credits_used || 0,
        voiceMinutes: monthlyStats.voice_minutes_used || 0
      });

      const enriched = (stories || []).map((s: any) => ({
        ...s,
        segment_count: segCounts[s.id] ?? 0,
        audio_segments: audCounts[s.id] ?? 0,
        content_segments: textCounts[s.id] ?? 0,
      }));
      setRecentStories(enriched);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="content-overlay flex-1">
            <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
              Welcome Back, Storyteller!
            </h1>
            <p className="text-xl text-text-secondary">
              Ready to create your next magical adventure?
            </p>
          </div>
          <Link to="/create">
            <Button className="btn-primary text-lg px-8 mt-4 md:mt-0">
              Create New Story
            </Button>
          </Link>
        </div>

        {/* Subscription & Credits Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SubscriptionStatus />
          <CreditDisplay />
        </div>

        {/* Upgrade Prompt for Free Users */}
        {tier === 'free' && (
          <div className="glass-card-primary p-6 mb-8 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Unlock Premium Features</h3>
                  <p className="text-text-secondary">Get more credits, priority generation, and voice narration</p>
                </div>
              </div>
              <Link to="/pricing">
                <Button className="btn-primary">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-card-primary p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Stories Created</p>
                <p className="text-3xl font-bold text-primary">{stats.storiesCreated}</p>
                <p className="text-xs text-text-secondary mt-1">Total in library</p>
              </div>
              <Book className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="glass-card-info p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Credits Used</p>
                <p className="text-3xl font-bold text-primary">{stats.creditsUsed}</p>
                <p className="text-xs text-text-secondary mt-1">This month</p>
              </div>
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="glass-card-success p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Voice Minutes</p>
                <p className="text-3xl font-bold text-primary">{stats.voiceMinutes}</p>
                <p className="text-xs text-text-secondary mt-1">Generated</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="glass-card-secondary p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Plan Status</p>
                <p className="text-3xl font-bold text-primary capitalize">{tier}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {subscribed ? 'Active subscription' : 'Free tier'}
                </p>
              </div>
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Recent Stories */}
        <div className="glass-card-light p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-heading font-semibold">Your Recent Stories</h2>
            <Link to="/my-stories">
              <Button variant="outline" className="btn-secondary">
                View All
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8" />
            </div>
          ) : recentStories.length === 0 ? (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-2">No stories yet</h3>
              <p className="text-text-secondary mb-6">
                Create your first magical story adventure!
              </p>
              <Link to="/create">
                <Button className="btn-primary">
                  Create Your First Story
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  showActions
                />
              ))}
            </div>
          )}
        </div>

        {/* Usage Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <UsageAnalytics />
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4">
              <Link to="/discover" className="glass-card-secondary p-4 group flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <Book className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Discover Stories
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Explore amazing stories from the community
                  </p>
                </div>
              </Link>

              <Link to="/characters" className="glass-card-primary p-4 group flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    My Characters
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Manage your character library
                  </p>
                </div>
              </Link>

              <Link to="/settings" className="glass-card-info p-4 group flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    Settings & Analytics
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Manage preferences and view detailed stats
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Onboarding Tour */}
      <OnboardingTour isOpen={showTour} onClose={closeTour} />
    </div>
  );
};

export default Dashboard;