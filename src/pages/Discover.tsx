import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ThumbsUp, Eye, Filter, Book } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import StoryCard from '@/components/StoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [publicStories, setPublicStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublicStories();
  }, [selectedGenre, searchQuery]);

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  const loadPublicStories = async () => {
    try {
      setLoading(true);
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
        .limit(20);

      if (selectedGenre !== 'all') {
        query = query.eq('genre', selectedGenre);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setPublicStories(data || []);
    } catch (error) {
      console.error('Error loading public stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const genres = [
    'all', 'Fantasy & Magic', 'Adventure & Exploration', 'Mystery & Detective', 
    'Science Fiction', 'Animal Tales', 'Fairy Tales', 'Historical Fiction', 'Superhero Stories'
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="content-overlay max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-4">
              Discover Amazing Stories
            </h1>
            <p className="text-xl text-text-secondary">
              Explore a world of magical tales created by our community of storytellers
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-card-elevated p-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
              <Input
                type="text"
                placeholder="Search stories, authors, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="input-field w-48"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre === 'all' ? 'All Genres' : genre}
                  </option>
                ))}
              </select>
              <Button className="btn-secondary">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Public Stories */}
        <section className="mb-16">
          <h2 className="text-3xl font-heading font-semibold mb-8">
            Community Stories
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8" />
            </div>
          ) : publicStories.length === 0 ? (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h3 className="text-xl font-heading font-semibold mb-2">No stories found</h3>
              <p className="text-text-secondary">
                {searchQuery ? 'Try adjusting your search terms' : 'Be the first to publish a story!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  variant="discover"
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </section>

        {/* Browse Categories */}
        <section>
          <h2 className="text-3xl font-heading font-semibold mb-8">Browse by Genre</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.slice(1).map((genre) => (
              <button
                key={genre}
                className="glass-card-interactive p-6 text-center group"
                onClick={() => setSelectedGenre(genre)}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition-colors text-primary font-bold text-lg">
                  {genre.charAt(0)}
                </div>
                <h3 className="font-medium group-hover:text-primary transition-colors text-sm">
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