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
import StoryCard from '@/components/StoryCard';
import { queryClient, queryKeys } from '@/lib/query-client';


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
  const [previewFilter, setPreviewFilter] = useState<'all' | 'featured' | 'non'>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | '25' | '50' | '75' | '100'>('all');
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [featurePriority, setFeaturePriority] = useState<Record<string, number>>({});
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});
  const [audioCounts, setAudioCounts] = useState<Record<string, number>>({});
  const [contentCounts, setContentCounts] = useState<Record<string, number>>({});
  const PREVIEW_LIMIT = 5;


  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStories();
  }, [stories, searchTerm, statusFilter, visibilityFilter, completionFilter, previewFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get all stories with basic moderation info
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Get currently featured stories (active)
      const { data: featuredRows, error: featuredError } = await supabase
        .from('featured_stories')
        .select('story_id, is_active, priority')
        .eq('is_active', true);

      if (featuredError) throw featuredError;

      // Aggregate segments/audio for richer UI indicators
      const ids = (storiesData || []).map((s: any) => s.id);
      const segCounts: Record<string, number> = {};
      const audCounts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: segs, error: segErr } = await supabase
          .from('story_segments')
          .select('story_id,audio_url,content')
          .in('story_id', ids);
        if (segErr) throw segErr;
        (segs || []).forEach((row: any) => {
          segCounts[row.story_id] = (segCounts[row.story_id] || 0) + 1;
          if (row.audio_url) {
            audCounts[row.story_id] = (audCounts[row.story_id] || 0) + 1;
          }
          const hasText = typeof row.content === 'string' && row.content.trim().length > 0;
          if (hasText) {
            contentCounts[row.story_id] = (contentCounts[row.story_id] || 0) + 1;
          }
        });
      }

      const featuredSet = new Set((featuredRows || []).map((r: any) => r.story_id));
      const priorityMap: Record<string, number> = {};
      (featuredRows || []).forEach((r: any) => {
        priorityMap[r.story_id] = r.priority ?? 1;
      });
      setFeaturedIds(featuredSet);
      setFeaturePriority(priorityMap);
      setSegmentCounts(segCounts);
      setAudioCounts(audCounts);
      setStories(storiesData || []);
      setContentCounts(contentCounts);
      logger.info('Loaded moderation data', { stories: storiesData?.length, featured: featuredRows?.length || 0 });
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

    // Completion filter
    if (completionFilter !== 'all') {
      const threshold = Number(completionFilter);
      filtered = filtered.filter(story => {
        const sc = segmentCounts[story.id] || 0;
        if (sc <= 0) return false;
        const ratios: number[] = [];
        if (typeof contentCounts[story.id] === 'number') ratios.push((contentCounts[story.id] as number) / sc);
        if (typeof audioCounts[story.id] === 'number') ratios.push((audioCounts[story.id] as number) / sc);
        if (ratios.length === 0) return false;
        const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        const percent = Math.round(avg * 100);
        return percent >= threshold;
      });
    }

    // Preview filter
    if (previewFilter !== 'all') {
      filtered = filtered.filter(story => previewFilter === 'featured' ? featuredIds.has(story.id) : !featuredIds.has(story.id));
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

  const toggleStoryFeature = async (storyId: string, shouldFeature: boolean, priority: number = 1) => {
    try {
      if (shouldFeature) {
        // Enforce preview limit on client side for immediate feedback
        if (!featuredIds.has(storyId) && featuredIds.size >= PREVIEW_LIMIT) {
          toast({
            title: 'Preview limit reached',
            description: `You can feature up to ${PREVIEW_LIMIT} stories. Remove one before adding another.`,
            variant: 'destructive',
          });
          return;
        }
        // Pre-check story status/visibility to avoid RPC failure
        const { data: storyRow, error: sErr } = await supabase
          .from('stories')
          .select('status, visibility')
          .eq('id', storyId)
          .single();
        if (sErr) throw sErr;

        if (storyRow.status !== 'completed') {
          toast({
            title: 'Not eligible',
            description: 'Story must be completed before it can be featured.',
            variant: 'destructive',
          });
          return;
        }

        if (storyRow.visibility !== 'public') {
          // Auto-publish to public to satisfy RPC requirement
          const { error: vErr } = await supabase
            .from('stories')
            .update({ visibility: 'public' })
            .eq('id', storyId);
          if (vErr) throw vErr;
          toast({ title: 'Published', description: 'Story visibility set to public.' });
        }

        const { error } = await supabase.rpc('admin_feature_story', {
          p_story_id: storyId,
          p_priority: priority,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('admin_unfeature_story', {
          p_story_id: storyId,
        });
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Story ${shouldFeature ? 'featured' : 'unfeatured'} successfully.`,
      });

      loadData();
      queryClient.invalidateQueries({ queryKey: queryKeys.featuredStories });
    } catch (error: any) {
      logger.error('Error toggling story feature', error);
      const message = error?.message || 'Failed to update story feature status.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary">{stories.length}</div>
            <div className="text-sm text-text-secondary">Total Stories</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary">
              {stories.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-text-secondary">Completed</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary">
              {stories.filter(s => s.visibility === 'public').length}
            </div>
            <div className="text-sm text-text-secondary">Public</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-6">
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
            <Select value={previewFilter} onValueChange={(v) => setPreviewFilter(v as 'all' | 'featured' | 'non')}>
              <SelectTrigger className="w-48" aria-label="Preview filter">
                <SelectValue placeholder="Preview filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stories</SelectItem>
                <SelectItem value="featured">Preview Only</SelectItem>
                <SelectItem value="non">Not in Preview</SelectItem>
              </SelectContent>
            </Select>
            <Select value={completionFilter} onValueChange={(v) => setCompletionFilter(v as any)}>

              <SelectTrigger className="w-44" aria-label="Completion">
                <SelectValue placeholder="Completion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Completion</SelectItem>
                <SelectItem value="25">≥ 25%</SelectItem>
                <SelectItem value="50">≥ 50%</SelectItem>
                <SelectItem value="75">≥ 75%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div key={story.id} className={`space-y-3 ${featuredIds.has(story.id) ? 'ring-2 ring-amber-400 rounded-xl' : ''}`}>
                <StoryCard
                  story={{
                    ...story,
                    segment_count: segmentCounts[story.id] ?? undefined,
                    audio_segments: audioCounts[story.id] ?? undefined,
                    content_segments: contentCounts[story.id] ?? undefined,
                  }}
                  showActions
                />
                <div className="glass-card p-3 flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(story.status)}>
                      {story.status}
                    </Badge>
                    <Badge variant={getVisibilityBadgeVariant(story.visibility)}>
                      {story.visibility}
                    </Badge>
                    {featuredIds.has(story.id) && (
                      <Badge variant="default">Preview</Badge>
                    )}
                    <Badge variant="outline">{story.genre}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStoryVisibility(
                        story.id,
                        story.visibility === 'public' ? 'private' : 'public'
                      )}
                      title={story.visibility === 'public' ? 'Make Private' : 'Make Public'}
                    >
                      {story.visibility === 'public' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={featuredIds.has(story.id) ? "secondary" : "outline"}
                      disabled={!featuredIds.has(story.id) && featuredIds.size >= PREVIEW_LIMIT}
                      onClick={() => toggleStoryFeature(story.id, !featuredIds.has(story.id), featurePriority[story.id] ?? 1)}
                      title={featuredIds.has(story.id) ? 'Remove from Preview' : 'Add to Preview (Landing Carousel)'}
                      aria-label={featuredIds.has(story.id) ? 'Remove from Preview' : 'Add to Preview'}
                    >
                      {featuredIds.has(story.id) ? (
                        <StarOff className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </Button>
                    <Select
                      value={String(featurePriority[story.id] ?? 1)}
                      onValueChange={(v) => setFeaturePriority(prev => ({ ...prev, [story.id]: Number(v) }))}
                    >
                      <SelectTrigger className="w-28" aria-label="Feature priority">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Priority 1</SelectItem>
                        <SelectItem value="2">Priority 2</SelectItem>
                        <SelectItem value="3">Priority 3</SelectItem>
                        <SelectItem value="4">Priority 4</SelectItem>
                        <SelectItem value="5">Priority 5</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteStory(story.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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