import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Book, Star, Eye, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface FeaturedStory {
  story_id: string;
  title: string;
  description: string;
  author_name: string;
  genre: string;
  age_group: string;
  cover_image_url?: string;
  story_position: number;
}

interface FeaturedStoriesProps {
  limit?: number;
  showTitle?: boolean;
}

const FeaturedStories: React.FC<FeaturedStoriesProps> = ({ 
  limit = 6, 
  showTitle = true 
}) => {
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedStories();
  }, [limit]);

  const loadFeaturedStories = async () => {
    try {
      const { data, error } = await supabase.rpc('get_featured_stories', {
        limit_count: limit
      });

      if (error) throw error;
      setFeaturedStories(data || []);
    } catch (error) {
      console.error('Error loading featured stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (storyId: string) => {
    navigate(`/story/${storyId}?mode=read`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  if (featuredStories.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      {showTitle && (
        <h2 className="text-3xl font-heading font-semibold mb-8 text-with-shadow">
          Featured Stories
        </h2>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredStories.map((story) => (
          <div 
            key={story.story_id} 
            className="glass-card-interactive group cursor-pointer"
            onClick={() => handleStoryClick(story.story_id)}
          >
            {/* Cover Image */}
            <div className="relative overflow-hidden rounded-t-lg">
              {story.cover_image_url ? (
                <img 
                  src={story.cover_image_url} 
                  alt={story.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
                  <Book className="w-16 h-16 text-primary/50" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {story.age_group}
                </span>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                  {story.title}
                </h3>
              </div>

              <p className="text-text-secondary text-sm mb-2">
                by {story.author_name || 'Anonymous'}
              </p>
              <p className="text-primary text-sm font-medium mb-3">
                {story.genre}
              </p>
              <p className="text-text-secondary text-sm mb-6 line-clamp-3">
                {story.description}
              </p>

              <Button className="btn-primary w-full">
                Read Story
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedStories;