import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Trash2,
  User,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';

interface Story {
  id: string;
  title: string;
  description: string;
  author_id: string;
  status: string;
  visibility: string;
  created_at: string;
  genre: string;
  age_group: string;
  credits_used: number;
}

const ContentModeration = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStories();
  }, [stories, searchTerm, statusFilter, visibilityFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get all stories with basic moderation info
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      setStories(storiesData || []);
      logger.info('Loaded moderation data', { stories: storiesData?.length });
    } catch (error) {
      logger.error('Error loading moderation data', error);
      toast({
        title: "Error",
        description: "Failed to load moderation data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStories = () => {
    let filtered = [...stories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(story => story.status === statusFilter);
    }

    // Visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(story => story.visibility === visibilityFilter);
    }

    setFilteredStories(filtered);
  };

  const updateStoryVisibility = async (storyId: string, visibility: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ visibility })
        .eq('id', storyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Story visibility updated to ${visibility}.`,
      });

      loadData();
    } catch (error) {
      logger.error('Error updating story visibility', error);
      toast({
        title: "Error",
        description: "Failed to update story visibility.",
        variant: "destructive",
      });
    }
  };

  const toggleStoryFeature = async (storyId: string, shouldFeature: boolean) => {
    try {
      if (shouldFeature) {
        const { error } = await supabase.rpc('admin_feature_story', {
          p_story_id: storyId,
          p_priority: 1
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('admin_unfeature_story', {
          p_story_id: storyId
        });
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Story ${shouldFeature ? 'featured' : 'unfeatured'} successfully.`,
      });

      loadData();
    } catch (error) {
      logger.error('Error toggling story feature', error);
      toast({
        title: "Error",
        description: "Failed to update story feature status.",
        variant: "destructive",
      });
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Story deleted successfully.",
      });

      loadData();
    } catch (error) {
      logger.error('Error deleting story', error);
      toast({
        title: "Error",
        description: "Failed to delete story.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const getVisibilityBadgeVariant = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'default';
      case 'private': return 'secondary';
      case 'unlisted': return 'outline';
      default: return 'outline';
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
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stories.length}</div>
            <div className="text-sm text-text-secondary">Total Stories</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {stories.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-text-secondary">Completed</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {stories.filter(s => s.visibility === 'public').length}
            </div>
            <div className="text-sm text-text-secondary">Public</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
                <Input
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stories Table */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle>Stories ({filteredStories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStories.map((story) => (
              <div key={story.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{story.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {story.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getStatusBadgeVariant(story.status)}>
                      {story.status}
                    </Badge>
                    <Badge variant={getVisibilityBadgeVariant(story.visibility)}>
                      {story.visibility}
                    </Badge>
                    <Badge variant="outline">{story.genre}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {story.author_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {new Date(story.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStoryVisibility(
                      story.id,
                      story.visibility === 'public' ? 'private' : 'public'
                    )}
                  >
                    {story.visibility === 'public' ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteStory(story.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredStories.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No stories found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentModeration;