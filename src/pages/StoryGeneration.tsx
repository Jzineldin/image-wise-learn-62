import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useStoryStore } from '@/stores/storyStore';
import { ArrowRight, ArrowLeft, Plus, X, Sparkles, Users, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageSelector from '@/components/LanguageSelector';
import { generateStory, createStoryWithLocalization } from '@/utils/storyGeneration';

interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
}

const StoryGeneration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { creationState, updateCreationState } = useStoryStore();
  const [step, setStep] = useState(1);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacter, setNewCharacter] = useState({ name: '', description: '', role: 'Main Character' });
  const [storySeed, setStorySeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const characterRoles = ['Main Character', 'Supporting Character', 'Villain', 'Mentor', 'Friend'];

  const handleAddCharacter = () => {
    if (newCharacter.name.trim()) {
      const character: Character = {
        id: Date.now().toString(),
        name: newCharacter.name.trim(),
        description: newCharacter.description.trim(),
        role: newCharacter.role
      };
      setCharacters([...characters, character]);
      setNewCharacter({ name: '', description: '', role: 'Main Character' });
    }
  };

  const handleRemoveCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handleNext = () => {
    if (step === 1 && characters.length > 0) {
      setStep(2);
    } else if (step === 2 && storySeed.trim()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('/create');
    } else {
      setStep(step - 1);
    }
  };

  const generateStory = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create stories.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!storySeed.trim()) {
      toast({
        title: "Story seed required",
        description: "Please provide a story seed to generate your tale.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate initial story with AI
      const { data: storyData, error: aiError } = await supabase.functions.invoke('generate-story', {
        body: {
          prompt: storySeed,
          ageGroup: creationState.age_group,
          genre: creationState.genres[0] || 'fantasy',
          characters: characters.map(c => ({
            name: c.name,
            description: c.description,
            role: c.role
          })),
          languageCode: 'en',
          storyLength: 'medium',
          isInitialGeneration: true
        }
      });

      if (aiError) throw aiError;

      // Create story in database
      const { data: story, error: dbError } = await supabase
        .from('stories')
        .insert({
          title: storyData.title,
          description: storyData.description || storySeed,
          genre: creationState.genres[0] || 'fantasy',
          age_group: creationState.age_group,
          prompt: storySeed,
          visibility: 'private',
          status: 'in_progress',
          user_id: user.id,
          author_id: user.id,
          metadata: {
            characters: characters.map(c => ({
              name: c.name,
              description: c.description,
              role: c.role
            })),
            genres: creationState.genres,
            storySeed: storySeed,
            model_used: storyData.model_used
          }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Create initial story segments
      const segments = storyData.segments || [];
      if (segments.length > 0) {
        const segmentInserts = segments.map((segment: any) => ({
          story_id: story.id,
          segment_number: segment.segment_number,
          content: segment.content,
          choices: segment.choices || [],
          is_ending: segment.is_ending || false
        }));

        const { error: segmentsError } = await supabase
          .from('story_segments')
          .insert(segmentInserts);

        if (segmentsError) {
          console.error('Error creating segments:', segmentsError);
        } else {
          // Generate image for first segment
          const firstSegment = segments[0];
          supabase.functions.invoke('generate-story-image', {
            body: {
              storyContent: firstSegment.content,
              storyTitle: storyData.title,
              ageGroup: creationState.age_group,
              genre: creationState.genres[0] || 'fantasy',
              segmentNumber: 1,
              storyId: story.id,
              characters: characters.map(c => ({
                name: c.name,
                description: c.description
              }))
            }
          }).catch(error => {
            console.error('Error generating initial image:', error);
          });
        }
      }

      // Navigate to story viewer
      navigate(`/story/${story.id}`);
      
      toast({
        title: "Story created!",
        description: "Your magical tale has been generated.",
      });

    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Generation failed",
        description: "There was an error creating your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="content-overlay max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-4">
                Craft Your Story
              </h1>
              <p className="text-xl text-text-secondary">
                Add characters and a story seed to bring your tale to life
              </p>
            </div>
          </div>

          {/* Enhanced Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-2 md:space-x-4">
              {[
                { num: 1, label: 'Characters', icon: Users },
                { num: 2, label: 'Story Seed', icon: Lightbulb },
                { num: 3, label: 'Generate', icon: Sparkles }
              ].map((stepInfo, index) => (
                <div key={stepInfo.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                      stepInfo.num <= step 
                        ? 'bg-primary text-white glow-amber' 
                        : 'bg-surface border border-primary/30 text-text-tertiary'
                    }`}>
                      <stepInfo.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs md:text-sm mt-2 transition-colors ${
                      stepInfo.num <= step ? 'text-primary' : 'text-text-tertiary'
                    }`}>
                      {stepInfo.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 transition-colors duration-300 ${
                      stepInfo.num < step ? 'bg-primary' : 'bg-surface'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Character Creation */}
          {step === 1 && (
            <div className="glass-card-elevated p-8 animate-fade-in">
              <h2 className="text-2xl font-heading font-semibold text-center mb-4">
                Create Your Characters
              </h2>
              <p className="text-text-secondary text-center mb-8">
                Add characters who will star in your story adventure
              </p>
              
              {/* Character Creation Form */}
              <div className="glass-card p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Character</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Input
                    placeholder="Character name"
                    value={newCharacter.name}
                    onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                    className="input-field"
                  />
                  <select
                    value={newCharacter.role}
                    onChange={(e) => setNewCharacter({...newCharacter, role: e.target.value})}
                    className="input-field"
                  >
                    {characterRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <Button onClick={handleAddCharacter} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <Textarea
                  placeholder="Character description (personality, appearance, background...)"
                  value={newCharacter.description}
                  onChange={(e) => setNewCharacter({...newCharacter, description: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>

              {/* Characters List */}
              {characters.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Your Characters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {characters.map((character) => (
                      <Card key={character.id} className="glass-card p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-primary">{character.name}</h4>
                            <span className="text-sm text-text-secondary">{character.role}</span>
                          </div>
                          <Button
                            onClick={() => handleRemoveCharacter(character.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {character.description && (
                          <p className="text-sm text-text-secondary">{character.description}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={characters.length === 0}
                  className="btn-primary"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Story Seed */}
          {step === 2 && (
            <div className="glass-card-elevated p-8 animate-fade-in">
              <h2 className="text-2xl font-heading font-semibold text-center mb-4">
                Plant Your Story Seed
              </h2>
              <p className="text-text-secondary text-center mb-8">
                Describe the starting situation, setting, or main conflict of your story
              </p>
              
              <div className="max-w-2xl mx-auto mb-8">
                <Textarea
                  placeholder="Once upon a time, in a magical forest, there lived a young wizard who discovered a mysterious map..."
                  value={storySeed}
                  onChange={(e) => setStorySeed(e.target.value)}
                  className="input-field min-h-[150px]"
                  rows={6}
                />
              </div>

              {/* Story Summary */}
              <div className="glass-card p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Your Story Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Age Group:</span> 
                    <span className="ml-2 text-primary font-medium">{creationState.age_group}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Genres:</span> 
                    <span className="ml-2 text-primary font-medium">{creationState.genres.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Characters:</span> 
                    <span className="ml-2 text-primary font-medium">{characters.length} characters</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!storySeed.trim()}
                  className="btn-primary"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Generate Story */}
          {step === 3 && (
            <div className="glass-card-elevated p-8 text-center animate-fade-in">
              <div className="mb-8">
                <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 glow-amber" />
                <h2 className="text-2xl font-heading font-semibold mb-4">
                  Ready to Generate Your Story!
                </h2>
                <p className="text-text-secondary mb-6">
                  Your magical tale is ready to be created with {characters.length} characters 
                  in the {creationState.genres.join(' & ')} genre.
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={generateStory} 
                  disabled={isGenerating}
                  className="btn-primary text-lg px-8"
                >
                  {isGenerating ? (
                    <>
                      <div className="loading-spinner w-5 h-5 mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Story
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryGeneration;