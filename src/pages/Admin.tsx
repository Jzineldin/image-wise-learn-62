import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, StarOff, Calendar, User, Book, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CompletedStory {
  id: string;
  title: string;
  author_name: string;
  genre: string;
  age_group: string;
  created_at: string;
  is_featured: boolean;
}

interface FeaturedStory {
  id: string;
  story_id: string;
  title: string;
  author_name: string;
  priority: number;
  is_active: boolean;
  featured_until: string;
  created_at: string;
}

const Admin = () => {
  const [completedStories, setCompletedStories] = useState<CompletedStory[]>([]);
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const { data } = await supabase.rpc('has_role', { check_role: 'admin' });
      if (!data) {
        navigate('/');
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load completed stories
      const { data: stories, error: storiesError } = await supabase.rpc('admin_get_completed_stories', {
        limit_count: 50
      });

      if (storiesError) throw storiesError;
      setCompletedStories(stories || []);

      // Load featured stories
      const { data: featured, error: featuredError } = await supabase.rpc('admin_get_featured_stories');
      
      if (featuredError) throw featuredError;
      setFeaturedStories(featured || []);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const featureStory = async (storyId: string, priority: number = 1) => {
    try {
      const { data, error } = await supabase.rpc('admin_feature_story', {
        p_story_id: storyId,
        p_priority: priority
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Story has been featured!",
      });

      loadData(); // Reload data
    } catch (error) {
      console.error('Error featuring story:', error);
      toast({
        title: "Error",
        description: "Failed to feature story.",
        variant: "destructive",
      });
    }
  };

  const unfeatureStory = async (storyId: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_unfeature_story', {
        p_story_id: storyId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Story has been unfeatured.",
      });

      loadData(); // Reload data
    } catch (error) {
      console.error('Error unfeaturing story:', error);
      toast({
        title: "Error",
        description: "Failed to unfeature story.",
        variant: "destructive",
      });
    }
  };

  const updatePriority = async (storyId: string, priority: number) => {
    try {
      const { data, error } = await supabase.rpc('admin_update_featured_priority', {
        p_story_id: storyId,
        p_priority: priority
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Priority updated!",
      });

      loadData(); // Reload data
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority.",
        variant: "destructive",
      });
    }
  };

  const filteredStories = completedStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || story.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const genres = [
    'all', 'Fantasy & Magic', 'Adventure & Exploration', 'Mystery & Detective', 
    'Science Fiction', 'Animal Tales', 'Fairy Tales', 'Historical Fiction', 'Superhero Stories'
  ];

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-8 w-8" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="content-overlay mb-12">
          <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xl text-text-secondary">
            Manage featured stories and community content
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Total Stories</p>
                  <p className="text-3xl font-bold text-primary">{completedStories.length}</p>
                </div>
                <Book className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Featured Stories</p>
                  <p className="text-3xl font-bold text-primary">{featuredStories.length}</p>
                </div>
                <Star className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">Active Features</p>
                  <p className="text-3xl font-bold text-primary">
                    {featuredStories.filter(s => s.is_active).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Stories Management */}
        <Card className="glass-card-elevated mb-8">
          <CardHeader>
            <CardTitle>Currently Featured Stories</CardTitle>
          </CardHeader>
          <CardContent>
            {featuredStories.length === 0 ? (
              <p className="text-text-secondary text-center py-8">No featured stories yet.</p>
            ) : (
              <div className="space-y-4">
                {featuredStories.map((story) => (
                  <div key={story.id} className="glass-card p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{story.title}</h3>
                      <p className="text-sm text-text-secondary">by {story.author_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={story.is_active ? "default" : "secondary"}>
                          {story.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-text-secondary">Priority: {story.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={story.priority.toString()}
                        onValueChange={(value) => updatePriority(story.story_id, parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unfeatureStory(story.story_id)}
                      >
                        <StarOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stories to Feature */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Available Stories to Feature</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search stories or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre === 'all' ? 'All Genres' : genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stories List */}
            <div className="space-y-4">
              {filteredStories.map((story) => (
                <div key={story.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{story.title}</h3>
                    <p className="text-sm text-text-secondary">by {story.author_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{story.genre}</Badge>
                      <Badge variant="outline">{story.age_group}</Badge>
                      <span className="text-xs text-text-secondary">
                        {new Date(story.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {story.is_featured ? (
                      <Badge className="bg-success/20 text-success">Featured</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => featureStory(story.id)}
                        className="btn-primary"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Feature
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredStories.length === 0 && (
              <div className="text-center py-8">
                <Book className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                <p className="text-text-secondary">No stories found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Admin;