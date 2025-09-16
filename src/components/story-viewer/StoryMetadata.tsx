import { Badge } from '@/components/ui/badge';
import { User, Book, Globe, Calendar } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  description: string;
  author_id: string;
  user_id?: string;
  genre: string;
  age_group: string;
  status: string;
  is_completed?: boolean;
  is_complete?: boolean;
  visibility?: string;
  metadata: any;
  cover_image?: string;
  created_at?: string;
}

interface StoryMetadataProps {
  story: Story;
  viewMode: 'creation' | 'experience';
}

export const StoryMetadata = ({ story, viewMode }: StoryMetadataProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className={`font-heading font-bold text-gradient ${
          viewMode === 'experience' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
        }`}>
          {story.title}
        </h1>
        
        {story.description && (
          <p className={`text-muted-foreground ${
            viewMode === 'experience' ? 'text-lg' : 'text-base'
          }`}>
            {story.description}
          </p>
        )}
      </div>

      {/* Story Info */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {/* Genre */}
        <Badge variant="secondary" className="flex items-center gap-1">
          <Book className="h-3 w-3" />
          {story.genre}
        </Badge>

        {/* Age Group */}
        <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {story.age_group}
        </Badge>

        {/* Language */}
        {story.metadata?.languageCode && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {story.metadata.languageCode.toUpperCase()}
          </Badge>
        )}

        {/* Created Date */}
        {story.created_at && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(story.created_at)}
          </Badge>
        )}

        {/* Status */}
        <Badge 
          variant={story.status === 'completed' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {story.status}
        </Badge>
      </div>

      {/* Characters (if any) */}
      {story.metadata?.characters && story.metadata.characters.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Featured Characters:</p>
          <div className="flex flex-wrap justify-center gap-1">
            {story.metadata.characters.map((character: any, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {character.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};