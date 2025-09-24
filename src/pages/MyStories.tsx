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
import StoryCard from '@/components/StoryCard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useDataFetching';
import { logger } from '@/lib/logger';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: stories = [], isLoading: loading, error } = useStories();

  // Handle query error
  useEffect(() => {
    if (error) {
      logger.error('Error fetching stories', error, { operation: 'fetch_stories' });
      toast({
        title: "Error",
        description: "Failed to load your stories. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleStoryUpdate = (updatedStory: Story) => {
    // With React Query, the cache will be automatically updated
    // when the story is updated through mutations
    logger.info('Story updated', { storyId: updatedStory.id, title: updatedStory.title });
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
              <StoryCard
                key={story.id}
                story={story}
                variant={story.cover_image ? 'background' : 'default'}
                showActions={true}
                showStatus={true}
                onSettingsClick={() => setSelectedStory(story)}
              />
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