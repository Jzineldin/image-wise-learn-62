import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Sparkles, Users, BookOpen, Wand2, Home, User, Settings } from 'lucide-react';
import { AGE_GROUPS, GENRES } from '@/types';
import { UserCharacter, StorySeed, StoryCreationFlow } from '@/types/character';
import { CharacterSelector } from '@/components/story-creation/CharacterSelector';
import { StorySeedGenerator } from '@/components/story-creation/StorySeedGenerator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import taleForgeLogoImage from '@/assets/tale-forge-logo.png';
import { logger } from '@/lib/debug';
import CreditDisplay from '@/components/CreditDisplay';
import LanguageAwareGenreSelector from '@/components/LanguageAwareGenreSelector';
import LanguageAwareAgeSelector from '@/components/LanguageAwareAgeSelector';
import { useLanguage } from '@/hooks/useLanguage';

const STEPS = [
  { id: 1, title: 'Age & Genre', icon: BookOpen },
  { id: 2, title: 'Characters', icon: Users },
  { id: 3, title: 'Story Idea', icon: Sparkles },
  { id: 4, title: 'Create Story', icon: Wand2 }
];

export default function CreateStoryFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { translate, selectedLanguage } = useLanguage();
  const [generating, setGenerating] = useState(false);

  const [flow, setFlow] = useState<StoryCreationFlow>({
    step: 1,
    ageGroup: undefined,
    genres: [],
    selectedCharacters: [],
    selectedSeed: undefined,
    customSeed: ''
  });

  const updateFlow = (updates: Partial<StoryCreationFlow>) => {
    setFlow(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (flow.step < STEPS.length) {
      updateFlow({ step: flow.step + 1 });
    }
  };

  const handleBack = () => {
    if (flow.step > 1) {
      updateFlow({ step: flow.step - 1 });
    }
  };

  const handleAgeGroupSelect = (ageGroup: string) => {
    updateFlow({ ageGroup });
  };

  const handleGenreToggle = (genre: string) => {
    const newGenres = flow.genres.includes(genre)
      ? flow.genres.filter(g => g !== genre)
      : [...flow.genres, genre];
    updateFlow({ genres: newGenres });
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!flow.ageGroup && flow.genres.length > 0;
      case 2:
        return true; // Characters are optional
      case 3:
        return !!(flow.selectedSeed || flow.customSeed.trim());
      default:
        return true;
    }
  };

  const generateStory = async () => {
    if (!user) {
      toast.error('Please sign in to create stories');
      return;
    }

    if (!canProceedFromStep(3)) {
      toast.error('Please select a story idea or write your own');
      return;
    }

    setGenerating(true);
    
    try {
      // Create TTS-optimized prompt for Swedish or English
      const storyPrompt = flow.selectedSeed?.description || flow.customSeed;
      const storyTitle = flow.selectedSeed?.title || (selectedLanguage === 'sv' ? 'Anpassad Berättelse' : 'Custom Story');

      // Create the story in database first
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: storyTitle,
          description: storyPrompt,
          prompt: storyPrompt,
          age_group: flow.ageGroup,
          genre: flow.genres[0], // Primary genre
          language_code: selectedLanguage,
          original_language_code: selectedLanguage,
          status: 'generating',
          user_id: user.id,
          metadata: {
            genres: flow.genres,
            characters: flow.selectedCharacters.map(c => ({
              id: c.id,
              name: c.name,
              description: c.description
            })),
            selectedSeed: flow.selectedSeed,
            customSeed: flow.customSeed,
            step: flow.step
          } as any
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Increment usage count for selected characters
      for (const character of flow.selectedCharacters) {
        await supabase
          .from('user_characters')
          .update({ usage_count: character.usage_count + 1 })
          .eq('id', character.id);
      }

          // Generate the first story segment
          const { data: generationResult, error: generationError } = await supabase.functions.invoke('generate-story', {
            body: {
              prompt: storyPrompt,
              genre: flow.genres[0],
              ageGroup: flow.ageGroup,
              storyId: story.id,
              language: selectedLanguage,
              isInitialGeneration: true,
              characters: flow.selectedCharacters.map(c => ({
                name: c.name,
                description: c.description,
                personality: c.personality_traits.join(', ')
              }))
            }
          });

      if (generationError) throw generationError;

      // Save generated segments to database
      if (generationResult?.segments && generationResult.segments.length > 0) {
        const segmentsToInsert = generationResult.segments.map((segment: any, index: number) => ({
          story_id: story.id,
          segment_number: index + 1,
          content: segment.content || segment.text || '',
          choices: Array.isArray(segment.choices) ? segment.choices : [],
          is_ending: (segment.isEnding ?? segment.is_ending ?? false),
          image_prompt: segment.imagePrompt
        }));

        const { error: segmentsError } = await supabase
          .from('story_segments')
          .insert(segmentsToInsert);

        if (segmentsError) {
          logger.error('Error saving segments', segmentsError);
          throw new Error('Failed to save story segments');
        }
      }

      // Update story with generated title and status
      const storyUpdates: any = {
        status: 'draft'
      };
      
      if (generationResult?.title) {
        storyUpdates.title = generationResult.title;
      }

      await supabase
        .from('stories')
        .update(storyUpdates)
        .eq('id', story.id);

      toast.success(selectedLanguage === 'sv' ? 'Berättelse skapad!' : 'Story created successfully!');
      navigate(`/story/${story.id}`);

    } catch (error) {
      logger.error('Error generating story', error);
      toast.error(selectedLanguage === 'sv' ? 'Kunde inte skapa berättelse. Försök igen.' : 'Failed to create story. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const progress = (flow.step / STEPS.length) * 100;

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="glass-card border-b border-primary/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src={taleForgeLogoImage} 
                alt="Tale Forge Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-heading font-bold text-gradient">Tale Forge</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/discover" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                Discover
              </Link>
              <Link to="/characters" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow flex items-center gap-2">
                <Users className="h-4 w-4" />
                Characters
              </Link>
              <Link to="/my-stories" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                My Stories
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <CreditDisplay compact />
              <Link to="/settings">
                <Button variant="outline" className="btn-secondary flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{translate('storyCreation.title')}</h1>
            <p className="text-muted-foreground">{selectedLanguage === 'sv' ? 'Låt oss bygga en fantastisk interaktiv berättelse tillsammans!' : 'Let\'s build an amazing interactive story together!'}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {flow.step} of {STEPS.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = flow.step === step.id;
              const isCompleted = flow.step > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-background border-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {flow.step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{translate('storyCreation.selectAge')} & {translate('storyCreation.selectGenre')}</h2>
                  <p className="text-muted-foreground">{selectedLanguage === 'sv' ? 'Välj åldersgrupp och berättelsegenrer för ditt äventyr.' : 'Select the age group and story genres for your adventure.'}</p>
                </div>

                <LanguageAwareAgeSelector
                  selectedAgeGroup={flow.ageGroup}
                  onAgeGroupSelect={handleAgeGroupSelect}
                />

                <LanguageAwareGenreSelector
                  selectedGenres={flow.genres}
                  onGenreToggle={handleGenreToggle}
                />
              </div>
            )}

            {flow.step === 2 && (
              <CharacterSelector
                selectedCharacters={flow.selectedCharacters}
                onCharactersChange={(characters) => updateFlow({ selectedCharacters: characters })}
              />
            )}

            {flow.step === 3 && flow.ageGroup && (
              <StorySeedGenerator
                ageGroup={flow.ageGroup}
                genres={flow.genres}
                characters={flow.selectedCharacters}
                selectedSeed={flow.selectedSeed || null}
                customSeed={flow.customSeed}
                onSeedSelect={(seed) => updateFlow({ selectedSeed: seed })}
                onCustomSeedChange={(seed) => updateFlow({ customSeed: seed })}
              />
            )}

            {flow.step === 4 && (
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Ready to Create Your Story!</h2>
                  <p className="text-muted-foreground">Review your choices and create your interactive story.</p>
                </div>

                <div className="bg-muted/30 rounded-lg p-6 text-left space-y-4">
                  <div>
                    <span className="font-medium">Age Group:</span> {flow.ageGroup}
                  </div>
                  <div>
                    <span className="font-medium">Genres:</span> {flow.genres.join(', ')}
                  </div>
                  {flow.selectedCharacters.length > 0 && (
                    <div>
                      <span className="font-medium">Characters:</span> {flow.selectedCharacters.map(c => c.name).join(', ')}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Story Idea:</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {flow.selectedSeed?.description || flow.customSeed}
                    </p>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="px-8"
                  onClick={generateStory}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Story...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Create My Story
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {flow.step < 4 && (
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={flow.step === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {selectedLanguage === 'sv' ? 'Tillbaka' : 'Back'}
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!canProceedFromStep(flow.step)}
              className="flex items-center gap-2"
            >
              {selectedLanguage === 'sv' ? 'Nästa' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}