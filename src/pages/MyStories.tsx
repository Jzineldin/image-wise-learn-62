import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Book, Search, Eye, Calendar, Filter, Settings, Globe, Lock } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import StorySettings from '@/components/StorySettings';
import HeroBackground from '@/components/HeroBackground';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useDataFetching';
import { logger } from '@/lib/logger';
import { Loading } from '@/components/ui/loading';

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
      <div className="min-h-screen relative">
        <HeroBackground />
        <Navigation />
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="flex-1">
              <div className="h-10 bg-muted rounded w-48 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-64 animate-pulse" />
            </div>
            <div className="h-10 bg-muted rounded w-32 mt-4 md:mt-0 animate-pulse" />
          </div>

          {/* Search and filter skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
          </div>

          {/* Story cards skeleton */}
          <div className="space-y-4">
            <Loading.Skeleton.Card count={6} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      <Navigation />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-[#F4E3B2] mb-2 tracking-wide">
              My Stories
            </h1>
            <p className="text-lg text-[#C9C5D5]">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'} in your collection
            </p>
          </div>
          <Link to="/create">
            <Button
              variant="default"
              size="lg"
              className="mt-4 md:mt-0 bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
            >
              Create New Story
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C9C5D5]" />
              <Input
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[rgba(0,0,0,.3)] border-[rgba(242,181,68,.2)] text-white placeholder:text-[#C9C5D5]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#C9C5D5]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[rgba(0,0,0,.3)] border border-[rgba(242,181,68,.2)] text-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Complete</option>
                <option value="in_progress">In Progress</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stories List - New Compact Horizontal Cards */}
        {filteredStories.length === 0 ? (
          <div className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-12 text-center">
            <Book className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-heading font-semibold text-[#F4E3B2] mb-4">
              {searchTerm || statusFilter !== 'all' ? 'No Matching Stories' : 'No Stories Yet'}
            </h3>
            <p className="text-[#C9C5D5] mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start creating your first magical story adventure!'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link to="/create">
                <Button
                  variant="default"
                  size="lg"
                  className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
                >
                  Create Your First Story
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] hover:ring-[rgba(242,181,68,.35)] transition-all duration-300 overflow-hidden group hover:shadow-[0_12px_48px_rgba(242,181,68,.15)]"
              >
                <div className="flex gap-4 p-4">
                  {/* Left: Image */}
                  <div className="relative w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    {story.cover_image ? (
                      <img
                        src={story.cover_image}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="w-10 h-10 text-primary/50" />
                      </div>
                    )}
                    {/* Status badge overlay */}
                    {story.status && (
                      <div className="absolute top-2 left-2">
                        <Badge className={`${getStatusColor(story.status)} text-xs px-2 py-0.5`}>
                          {getStatusLabel(story.status)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-heading font-semibold text-[#F4E3B2] line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                      {story.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="text-xs border-primary/30 text-[#C9C5D5]">
                        {story.genre}
                      </Badge>
                      <span className="text-[#6f6a78]">•</span>
                      <Badge variant="outline" className="text-xs border-primary/30 text-[#C9C5D5]">
                        {story.age_group}
                      </Badge>
                    </div>

                    {story.description && (
                      <p className="text-sm text-[#C9C5D5] line-clamp-1 mb-2">
                        {story.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-[#C9C5D5]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(story.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        {story.visibility === 'public' ? (
                          <><Globe className="w-3 h-3 text-success" /> Public</>
                        ) : (
                          <><Lock className="w-3 h-3 text-warning" /> Private</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 items-end justify-center">
                    <Link to={`/story/${story.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedStory(story)}
                      className="text-[#C9C5D5] hover:text-[#F4E3B2] hover:bg-[rgba(242,181,68,.1)]"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
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