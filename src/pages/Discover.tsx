import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ThumbsUp, Eye, Filter, Book, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HeroBackground from '@/components/HeroBackground';
import StoryCard from '@/components/StoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/production-logger';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { PAGINATION } from '@/lib/constants/query-constants';
import { Loading } from '@/components/ui/loading';
import { isStoryCompleted } from '@/lib/helpers/story-helpers';

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch public stories with infinite scroll using React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loading,
    error
  } = useInfiniteQuery({
    queryKey: ['discover-stories', selectedGenre, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const startRange = pageParam;
      const endRange = pageParam + PAGINATION.pageSize - 1;

      let query = supabase
        .from('stories')
        .select(`
          id,
          title,
          description,
          genre,
          age_group,
          cover_image,
          created_at,
          author_id,
          is_completed,
          is_complete,
          status
        `)
        .eq('visibility', 'public')
        .or('status.eq.completed,is_completed.eq.true,is_complete.eq.true')
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (selectedGenre !== 'all') {
        query = query.eq('genre', selectedGenre);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error loading public stories', error, {
          operation: 'discover-load-stories',
          selectedGenre,
          searchQuery,
          pageParam
        });
        throw error;
      }

      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < PAGINATION.pageSize) {
        return undefined;
      }
      // Return the next page offset
      return allPages.length * PAGINATION.pageSize;
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for public content
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Flatten all pages into a single array
  const publicStories = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  const genres = [
    'all', 'Fantasy & Magic', 'Adventure & Exploration', 'Mystery & Detective', 
    'Science Fiction', 'Animal Tales', 'Fairy Tales', 'Historical Fiction', 'Superhero Stories'
  ];

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      <Navigation />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-[#F4E3B2] mb-4 tracking-wide">
              Discover Amazing Stories
            </h1>
            <p className="text-lg text-[#C9C5D5]">
              Explore a world of magical tales created by our community of storytellers
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#C9C5D5] w-5 h-5" />
              <Input
                type="text"
                placeholder="Search stories, authors, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[rgba(0,0,0,.3)] border-[rgba(242,181,68,.2)] text-white placeholder:text-[#C9C5D5]"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[rgba(0,0,0,.3)] border border-[rgba(242,181,68,.2)] text-white w-48"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre === 'all' ? 'All Genres' : genre}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Public Stories */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-[#F4E3B2] mb-6">
            Community Stories
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Loading.Skeleton.Card count={6} />
            </div>
          ) : publicStories.length === 0 ? (
            <div className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-12 text-center">
              <div className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Book className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-[#F4E3B2] mb-2">No stories found</h3>
              <p className="text-[#C9C5D5]">
                {searchQuery ? 'Try adjusting your search terms' : 'Be the first to publish a story!'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {publicStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    variant="discover"
                    currentUserId={currentUserId}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="default"
                    size="lg"
                    aria-label="Load more stories"
                    className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading more stories...
                      </>
                    ) : (
                      <>
                        <Book className="w-4 h-4 mr-2" />
                        Load More Stories
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* End of results message */}
              {!hasNextPage && publicStories.length > 0 && (
                <div className="text-center mt-8 text-[#C9C5D5]">
                  <p>You've reached the end of the stories. Check back later for more!</p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Browse Categories */}
        <section>
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-[#F4E3B2] mb-6">Browse by Genre</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.slice(1).map((genre) => (
              <button
                key={genre}
                className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] hover:ring-[rgba(242,181,68,.35)] transition-all duration-300 p-6 text-center group hover:shadow-[0_12px_48px_rgba(242,181,68,.15)]"
                onClick={() => setSelectedGenre(genre)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200 text-primary font-bold text-lg">
                  {genre.charAt(0)}
                </div>
                <h3 className="font-heading font-medium text-[#F4E3B2] group-hover:text-primary transition-colors duration-200 text-sm">
                  {genre}
                </h3>
              </button>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Discover;