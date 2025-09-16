import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, BookOpen, Users, Sparkles, Wand2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { StoryCreationFlow } from '@/types/character';
import { AgeGenreStep } from './AgeGenreStep';
import { CharacterSelectionStep } from './CharacterSelectionStep';
import { StoryIdeaStep } from './StoryIdeaStep';
import { ReviewStep } from './ReviewStep';

interface StoryCreationWizardProps {
  flow: StoryCreationFlow;
  generating: boolean;
  onFlowUpdate: (updates: Partial<StoryCreationFlow>) => void;
  onCreateStory: () => void;
}

export const StoryCreationWizard = ({
  flow,
  generating,
  onFlowUpdate,
  onCreateStory
}: StoryCreationWizardProps) => {
  const { translate } = useLanguage();

  const STEPS = [
    { id: 1, title: translate('storyCreation.steps.ageAndGenre'), icon: BookOpen },
    { id: 2, title: translate('storyCreation.steps.characters'), icon: Users },
    { id: 3, title: translate('storyCreation.steps.storyIdeas'), icon: Sparkles },
    { id: 4, title: translate('storyCreation.steps.review'), icon: Wand2 }
  ];

  const handleNext = () => {
    if (flow.step < STEPS.length) {
      onFlowUpdate({ step: flow.step + 1 });
    }
  };

  const handleBack = () => {
    if (flow.step > 1) {
      onFlowUpdate({ step: flow.step - 1 });
    }
  };

  const handleAgeGroupSelect = (ageGroup: string) => {
    onFlowUpdate({ ageGroup });
  };

  const handleGenreToggle = (genre: string) => {
    const newGenres = flow.genres.includes(genre)
      ? flow.genres.filter(g => g !== genre)
      : [...flow.genres, genre];
    onFlowUpdate({ genres: newGenres });
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

  const progress = (flow.step / STEPS.length) * 100;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div>
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
      <Card>
        <CardContent className="p-8">
          {flow.step === 1 && (
            <AgeGenreStep
              selectedAgeGroup={flow.ageGroup}
              selectedGenres={flow.genres}
              onAgeGroupSelect={handleAgeGroupSelect}
              onGenreToggle={handleGenreToggle}
            />
          )}

          {flow.step === 2 && (
            <CharacterSelectionStep
              selectedCharacters={flow.selectedCharacters}
              onCharactersChange={(characters) => onFlowUpdate({ selectedCharacters: characters })}
            />
          )}

          {flow.step === 3 && flow.ageGroup && (
            <StoryIdeaStep
              ageGroup={flow.ageGroup}
              genres={flow.genres}
              characters={flow.selectedCharacters}
              selectedSeed={flow.selectedSeed}
              customSeed={flow.customSeed}
              onSeedSelect={(seed) => onFlowUpdate({ selectedSeed: seed })}
              onCustomSeedChange={(seed) => onFlowUpdate({ customSeed: seed })}
            />
          )}

          {flow.step === 4 && (
            <ReviewStep
              ageGroup={flow.ageGroup}
              genres={flow.genres}
              selectedCharacters={flow.selectedCharacters}
              selectedSeed={flow.selectedSeed}
              customSeed={flow.customSeed}
              generating={generating}
              onCreateStory={onCreateStory}
            />
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
            {translate('ui.back')}
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!canProceedFromStep(flow.step)}
            className="flex items-center gap-2"
          >
            {translate('ui.next')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};