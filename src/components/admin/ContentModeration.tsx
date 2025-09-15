import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Trash2,
  Flag,
  Check,
  X,
  RefreshCw,
  Calendar,
  User,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Story {
  id: string;
  title: string;
  description: string;
  author_name: string;
  author_id: string;
  genre: string;
  age_group: string;
  status: string;
  visibility: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  flags_count: number;
  cover_image: string;
  segment_count: number;
}

interface ContentFlag {
  id: string;
  story_id: string;
  user_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

const ContentModeration = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStories();
  }, [stories, searchTerm, statusFilter, visibilityFilter, genreFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get all stories with moderation info
      const { data: storiesData, error: storiesError } = await supabase.rpc('admin_get_all_stories');
      if (storiesError) throw storiesError;

      // Get content flags
      const { data: flagsData, error: flagsError } = await supabase.rpc('admin_get_content_flags');
      if (flagsError) throw flagsError;

      setStories(storiesData || []);
      setFlags(flagsData || []);
      logger.info('Loaded moderation data', { stories: storiesData?.length, flags: flagsData?.length });
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
        story.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    // Genre filter
    if (genreFilter !== 'all') {
      filtered = filtered.filter(story => story.genre === genreFilter);
    }

    setFilteredStories(filtered);
  };

  const updateStoryVisibility = async (storyId: string, visibility: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_story_visibility', {
        p_story_id: storyId,
        p_visibility: visibility
      });

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
      const { error } = await supabase.rpc('admin_delete_story', {
        p_story_id: storyId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Story deleted successfully.",
      });

      setShowDeleteConfirm(null);
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

  const flagStory = async (storyId: string, reason: string, description: string) => {
    try {
      const { error } = await supabase.rpc('admin_flag_story', {
        p_story_id: storyId,
        p_reason: reason,
        p_description: description
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Story flagged successfully.",
      });

      setFlagReason('');
      setFlagDescription('');
      setSelectedStory(null);
      loadData();
    } catch (error) {
      logger.error('Error flagging story', error);
      toast({
        title: "Error",
        description: "Failed to flag story.",
        variant: "destructive",
      });
    }
  };

  const resolveFlag = async (flagId: string, resolution: string) => {
    try {
      const { error } = await supabase.rpc('admin_resolve_flag', {
        p_flag_id: flagId,
        p_resolution: resolution
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Flag resolved successfully.",
      });

      loadData();
    } catch (error) {
      logger.error('Error resolving flag', error);
      toast({
        title: "Error",
        description: "Failed to resolve flag.",
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

  const genres = [
    'all', 'Fantasy & Magic', 'Adventure & Exploration', 'Mystery & Detective',
    'Science Fiction', 'Animal Tales', 'Fairy Tales', 'Historical Fiction', 'Superhero Stories'
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {stories.filter(s => s.is_featured).length}
            </div>
            <div className="text-sm text-text-secondary">Featured</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {flags.filter(f => f.status === 'pending').length}
            </div>
            <div className="text-sm text-text-secondary">Pending Flags</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Flags Section */}
      {flags.filter(f => f.status === 'pending').length > 0 && (
        <Card className="glass-card border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Pending Content Flags ({flags.filter(f => f.status === 'pending').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flags.filter(f => f.status === 'pending').map((flag) => {
                const story = stories.find(s => s.id === flag.story_id);
                return (
                  <div key={flag.id} className="glass-card p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{story?.title || 'Unknown Story'}</h4>
                      <p className="text-sm text-text-secondary">
                        <strong>Reason:</strong> {flag.reason}
                      </p>
                      {flag.description && (
                        <p className="text-sm text-text-secondary">
                          <strong>Details:</strong> {flag.description}
                        </p>
                      )}
                      <p className="text-xs text-text-tertiary">
                        Flagged {new Date(flag.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveFlag(flag.id, 'dismissed')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => resolveFlag(flag.id, 'action_taken')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Take Action
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
                <Input
                  placeholder="Search stories, authors..."
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
            <Select value={genreFilter} onValueChange={setGenreFilter}>
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
                  <div className="flex items-start gap-3">
                    {story.cover_image && (
                      <img
                        src={story.cover_image}
                        alt={story.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
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
                        {story.is_featured && (
                          <Badge className="bg-yellow-500/20 text-yellow-700">Featured</Badge>
                        )}
                        {story.flags_count > 0 && (
                          <Badge variant="destructive">{story.flags_count} flags</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {story.author_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {story.segment_count} segments
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => updateStoryVisibility(
                        story.id,
                        story.visibility === 'public' ? 'private' : 'public'
                      )}
                    >
                      {story.visibility === 'public' ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Make Public
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleStoryFeature(story.id, !story.is_featured)}
                    >
                      {story.is_featured ? (
                        <>
                          <StarOff className="w-4 h-4 mr-2" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Feature
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStory(story)}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Flag Content
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(story.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Flag Story Dialog */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Flag Story: {selectedStory.title}</DialogTitle>
              <DialogDescription>
                Report this story for inappropriate content or policy violations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Select value={flagReason} onValueChange={setFlagReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="copyright">Copyright Violation</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="violence">Violence</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  placeholder="Provide additional details about the issue..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (flagReason) {
                      flagStory(selectedStory.id, flagReason, flagDescription);
                    }
                  }}
                  disabled={!flagReason}
                  className="flex-1"
                >
                  Flag Story
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedStory(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Story</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this story? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => deleteStory(showDeleteConfirm)}
                className="flex-1"
              >
                Yes, Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ContentModeration;