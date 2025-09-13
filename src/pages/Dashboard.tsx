import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Book, Heart, Users, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Dashboard = () => {
  // Mock data for demo
  const stats = {
    storiesCreated: 12,
    totalViews: 1847,
    totalLikes: 234,
    followers: 56
  };

  const recentStories = [
    {
      id: '1',
      title: 'The Dragon\'s Secret Garden',
      status: 'complete',
      views: 156,
      likes: 23,
      created_at: '2024-01-15'
    },
    {
      id: '2', 
      title: 'Mystery of the Glowing Forest',
      status: 'generating',
      views: 0,
      likes: 0,
      created_at: '2024-01-14'
    },
    {
      id: '3',
      title: 'Space Adventure with Captain Luna',
      status: 'complete',
      views: 289,
      likes: 45,
      created_at: '2024-01-12'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
              Welcome Back, Storyteller!
            </h1>
            <p className="text-xl text-text-secondary">
              Ready to create your next magical adventure?
            </p>
          </div>
          <Link to="/create">
            <Button className="btn-primary text-lg px-8 mt-4 md:mt-0">
              <Plus className="w-5 h-5 mr-2" />
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
              <Heart className="w-8 h-8 text-primary" />
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
                        story.status === 'complete' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {story.status === 'complete' ? 'Complete' : 'Generating...'}
                      </span>
                      <span>{story.views} views</span>
                      <span>{story.likes} likes</span>
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