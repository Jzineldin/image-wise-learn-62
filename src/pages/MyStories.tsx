import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Book, Search, Eye, Calendar, Filter, Settings, Globe, Lock } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import StorySettings from '@/components/StorySettings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  title: string;
  description?: string;
  genre: string;
  age_group: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  cover_image?: string;
}

const MyStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchStories();
  }, [user]);

  const fetchStories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        title: "Error",
        description: "Failed to load your stories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStoryUpdate = (updatedStory: Story) => {
    setStories(stories.map(story => 
      story.id === updatedStory.id ? updatedStory : story
    ));
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'in_progress':
        return 'bg-warning/20 text-warning';
      case 'draft':
        return 'bg-muted/20 text-muted-foreground';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complete';
      case 'in_progress':
        return 'In Progress';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="content-overlay flex-1">
            <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
              My Stories
            </h1>
            <p className="text-xl text-text-secondary">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'} in your collection
            </p>
          </div>
          <Link to="/create">
            <Button className="btn-primary text-lg px-8 mt-4 md:mt-0">
              Create New Story
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-secondary" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="completed">Complete</option>
                <option value="in_progress">In Progress</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="glass-card-elevated p-12 text-center">
            <Book className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-heading font-semibold mb-4">
              {searchTerm || statusFilter !== 'all' ? 'No Matching Stories' : 'No Stories Yet'}
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start creating your first magical story adventure!'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/create">
                <Button className="btn-primary text-lg px-8">
                  Create Your First Story
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Card key={story.id} className="glass-card-interactive group overflow-hidden">
                {story.cover_image && (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img 
                      src={story.cover_image} 
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getStatusColor(story.status)}>
                        {getStatusLabel(story.status)}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {story.title}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{story.genre}</Badge>
                        <Badge variant="outline">{story.age_group}</Badge>
                      </div>
                    </div>
                  </div>
                  {!story.cover_image && (
                    <div className="mt-2">
                      <Badge className={getStatusColor(story.status)}>
                        {getStatusLabel(story.status)}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  {story.description && (
                    <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                      {story.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-text-secondary mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(story.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      {story.visibility === 'public' ? (
                        <Globe className="w-3 h-3 text-success" />
                      ) : (
                        <Lock className="w-3 h-3 text-warning" />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {story.visibility}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/story/${story.id}`} className="flex-1">
                      <Button className="w-full btn-secondary">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStory(story)}
                      className="px-3"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedStory && (
        <StorySettings
          story={selectedStory}
          onUpdate={handleStoryUpdate}
          onClose={() => setSelectedStory(null)}
        />
      )}

      <Footer />
    </div>
  );
};

export default MyStories;