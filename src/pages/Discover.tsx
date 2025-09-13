import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ThumbsUp, Eye, Star, Filter, Book } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Mock featured and trending stories
  const featuredStories = [
    {
      id: '1',
      title: 'The Enchanted Library',
      author: 'Sarah Johnson',
      genre: 'Fantasy & Magic',
      age_group: '7-9',
      cover_image: '/api/placeholder/300/400',
      views: 2543,
      likes: 187,
      rating: 4.8,
      description: 'A young girl discovers a magical library where books come to life...'
    },
    {
      id: '2',
      title: 'Space Rescue Mission',
      author: 'Mike Chen',
      genre: 'Science Fiction',
      age_group: '10-12',
      cover_image: '/api/placeholder/300/400',
      views: 1876,
      likes: 234,
      rating: 4.9,
      description: 'Join Captain Luna on an thrilling rescue mission across the galaxy...'
    },
    {
      id: '3',
      title: 'The Mystery of Whispering Woods',
      author: 'Emma Wilson',
      genre: 'Mystery & Detective',
      age_group: '13+',
      cover_image: '/api/placeholder/300/400',
      views: 3201,
      likes: 156,
      rating: 4.7,
      description: 'Strange sounds echo through the forest. Can you solve the mystery?...'
    }
  ];

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

        {/* Featured Stories */}
        <section className="mb-16">
          <h2 className="text-3xl font-heading font-semibold mb-8 text-with-shadow">
            Featured Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredStories.map((story) => (
              <div key={story.id} className="glass-card-interactive group">
                {/* Cover Image */}
                <div className="relative overflow-hidden rounded-t-lg">
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Book className="w-16 h-16 text-primary/50" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                      {story.age_group}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    <div className="flex items-center text-primary text-sm font-medium">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      {story.rating}
                    </div>
                  </div>

                  <p className="text-text-secondary text-sm mb-2">by {story.author}</p>
                  <p className="text-primary text-sm font-medium mb-3">{story.genre}</p>
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {story.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-text-tertiary text-sm mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {story.views}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {story.likes}
                      </span>
                    </div>
                  </div>

                  <Button className="btn-primary w-full">
                    Read Story
                  </Button>
                </div>
              </div>
            ))}
          </div>
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