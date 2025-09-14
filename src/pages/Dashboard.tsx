import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Book, Users, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const [stats, setStats] = useState({
    storiesCreated: 0,
    totalViews: 0,
    totalLikes: 0,
    followers: 0
  });
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
      
      // Calculate stats
      const completedStories = stories?.filter(s => s.status === 'completed') || [];
      const totalStories = stories?.length || 0;
      
      setStats({
        storiesCreated: totalStories,
        totalViews: 0, // Would need analytics table
        totalLikes: 0, // Would need likes table  
        followers: 0  // Would need followers table
      });

      setRecentStories(stories || []);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Stories Created</p>
                <p className="text-3xl font-bold text-primary">{stats.storiesCreated}</p>
              </div>
              <Book className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Total Views</p>
                <p className="text-3xl font-bold text-primary">{stats.totalViews}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Total Likes</p>
                <p className="text-3xl font-bold text-primary">{stats.totalLikes}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Followers</p>
                <p className="text-3xl font-bold text-primary">{stats.followers}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Recent Stories */}
        <div className="glass-card-elevated p-8">
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
            <div className="space-y-4">
              {recentStories.map((story) => (
                <div key={story.id} className="glass-card-interactive p-6 group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors mb-2">
                        {story.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-text-secondary">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          story.status === 'completed' 
                            ? 'bg-success/20 text-success' 
                            : story.status === 'in_progress'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-muted/20 text-muted-foreground'
                        }`}>
                          {story.status === 'completed' ? 'Complete' : 
                           story.status === 'in_progress' ? 'In Progress' : 'Draft'}
                        </span>
                        <span>{story.genre}</span>
                        <span>{story.visibility}</span>
                        <span>{new Date(story.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link to={`/story/${story.id}`}>
                      <Button variant="outline" size="sm" className="btn-ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Link to="/discover" className="glass-card-interactive p-6 group text-center">
            <Book className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              Discover Stories
            </h3>
            <p className="text-text-secondary text-sm">
              Explore amazing stories from the community
            </p>
          </Link>

          <Link to="/characters" className="glass-card-interactive p-6 group text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              My Characters
            </h3>
            <p className="text-text-secondary text-sm">
              Manage your character library
            </p>
          </Link>

          <Link to="/settings" className="glass-card-interactive p-6 group text-center">
            <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              Analytics
            </h3>
            <p className="text-text-secondary text-sm">
              Track your story performance
            </p>
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;