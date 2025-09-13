import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, Share, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';

const StoryViewer = () => {
  const { id } = useParams();
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Mock story data
  const story = {
    id: id,
    title: 'The Dragon\'s Secret Garden',
    author: 'Sarah Johnson',
    segments: [
      {
        id: '1',
        content: `Once upon a time, in a kingdom far beyond the misty mountains, there lived a young girl named Luna who possessed an extraordinary gift - she could speak to dragons. One sunny morning, while exploring the ancient forest near her village, Luna stumbled upon a hidden pathway covered in glowing moss.

The pathway led to a magnificent garden unlike anything she had ever seen. Flowers of every color imaginable bloomed in perfect harmony, their petals shimmering with magical light. In the center of the garden stood an enormous, gentle dragon with scales that sparkled like emeralds.

"Welcome, young one," the dragon spoke in a voice as soft as velvet. "I am Verdania, guardian of this secret garden. For centuries, I have tended to these magical plants, but I have grown lonely."`,
        image_url: '/api/placeholder/800/600',
        choices: [
          { id: 1, text: "Ask the dragon about the magical plants" },
          { id: 2, text: "Offer to help tend the garden" },
          { id: 3, text: "Explore the garden on your own" }
        ]
      }
    ]
  };

  const handleChoice = (choiceId: number) => {
    // Mock progression to next segment
    console.log('Selected choice:', choiceId);
  };

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const currentSegmentData = story.segments[currentSegment];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-card border-b border-primary/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-gradient">
                {story.title}
              </h1>
              <p className="text-text-secondary">by {story.author}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={toggleLike}
                variant="outline"
                className={`btn-icon ${isLiked ? 'text-red-400' : 'text-text-secondary'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" className="btn-icon">
                <Share className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Story Content */}
          <div className="glass-card-elevated p-8 mb-8">
            {/* Image */}
            <div className="mb-8">
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                <p className="text-text-tertiary">Story Image</p>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center mb-8">
              <div className="glass-card p-4 flex items-center space-x-4">
                <Button
                  onClick={toggleAudio}
                  className="btn-primary"
                  size="sm"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <Volume2 className="w-5 h-5 text-text-secondary" />
                <div className="w-32 h-2 bg-surface rounded-full">
                  <div className="w-1/3 h-full bg-primary rounded-full"></div>
                </div>
                <span className="text-text-secondary text-sm">2:34</span>
              </div>
            </div>

            {/* Story Text */}
            <div className="prose prose-lg max-w-none">
              <div className="text-text-primary leading-relaxed text-lg">
                {currentSegmentData.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Choices */}
          {currentSegmentData.choices && (
            <div className="glass-card-elevated p-8">
              <h3 className="text-xl font-heading font-semibold mb-6 text-center">
                What happens next?
              </h3>
              <div className="space-y-4">
                {currentSegmentData.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice.id)}
                    className="glass-card-interactive w-full p-6 text-left group"
                  >
                    <p className="text-text-primary group-hover:text-primary transition-colors">
                      {choice.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              className="btn-secondary"
              disabled={currentSegment === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-text-secondary">
                Segment {currentSegment + 1} of {story.segments.length}
              </span>
            </div>

            <Button
              variant="outline"
              className="btn-secondary"
              disabled={currentSegment === story.segments.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;