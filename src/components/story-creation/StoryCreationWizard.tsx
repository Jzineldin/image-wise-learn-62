import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, BookOpen, Users, Sparkles, Wand2 } from 'lucide-react';
import { t } from '@/constants/translations';
import { AgeGenreStep } from './AgeGenreStep';
import { CharacterSelectionStep } from './CharacterSelectionStep';
import { StoryIdeaStep } from './StoryIdeaStep';
import { ReviewStep } from './ReviewStep';
import { useStoryStore } from '@/stores/storyStore';
import { useStoryValidation, useRateLimit } from '@/hooks/useInputValidation';
import { toast } from 'sonner';


interface StoryCreationWizardProps {
  onCreateStory: () => void;
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
}

export const StoryCreationWizard = ({
  onCreateStory,
  selectedLanguage,
  onLanguageChange
}: StoryCreationWizardProps) => {
  const { currentFlow: flow, isGenerating: generating, updateFlow } = useStoryStore();
  
  // Input validation and rate limiting
  const { validate, getFieldError, hasFieldError } = useStoryValidation({ 
    validateOnChange: true, 
    sanitizeInputs: true 
  });
  const { checkRateLimit } = useRateLimit(5, 60000); // 5 story creations per minute

  const tr = (key: string) => t(key, selectedLanguage);

  const STEPS = [
    { id: 1, title: tr('storyCreation.steps.ageAndGenre'), icon: BookOpen },
    { id: 2, title: tr('storyCreation.steps.characters'), icon: Users },
    { id: 3, title: tr('storyCreation.steps.storyIdeas'), icon: Sparkles },
    { id: 4, title: tr('storyCreation.steps.review'), icon: Wand2 }
  ];

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
    // Limit to a single primary genre
    updateFlow({ genres: [genre] });
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!flow.ageGroup && flow.genres.length > 0;
      case 2:
        return true; // Characters are optional
      case 3:
        const seedText = typeof flow.selectedSeed === 'object' && flow.selectedSeed 
          ? flow.selectedSeed.title || flow.selectedSeed.description || ''
          : String(flow.selectedSeed || '');
        const customText = flow.customSeed?.trim() || '';
        const finalSeedText = seedText || customText;
        
        if (!finalSeedText) return false;
        
        // Basic validation for story seed
        if (finalSeedText.length < 10 || finalSeedText.length > 1000) {
          return false;
        }
        return true;
      case 4:
        // Final validation before submission
        const seedForValidation = typeof flow.selectedSeed === 'object' && flow.selectedSeed
          ? flow.selectedSeed.title || flow.selectedSeed.description || ''
          : String(flow.selectedSeed || flow.customSeed || '');
          
        const storyData = {
          title: 'My Story',
          prompt: seedForValidation,
          genre: flow.genres[0], // Use first selected genre
          ageGroup: flow.ageGroup,
          languageCode: selectedLanguage,
          characters: flow.selectedCharacters
        };
        
        const validationResult = validate(storyData);
        return validationResult.isValid;
      default:
        return true;
    }
  };

  const progress = (flow.step / STEPS.length) * 100;

  const handleStepClick = (targetStep: number) => {
    // TEMP DIAGNOSTIC LOG
    // eslint-disable-next-line no-console
    console.log('[Wizard.handleStepClick] invoked', { targetStep, currentStep: flow.step, ts: Date.now() });
    // Allow backward navigation to any previous step; forward remains via Next
    if (targetStep < flow.step) {
      updateFlow({ step: targetStep });
    }
  };

  const handleIndicatorRowClick = (e: any) => {
    const el = (e.target as HTMLElement).closest('[data-step-id]') as HTMLElement | null;
    if (!el) return;
    const target = Number(el.getAttribute('data-step-id'));
    // eslint-disable-next-line no-console
    console.log('[Wizard.handleIndicatorRowClick]', { target, currentStep: flow.step, ts: Date.now() });
    if (!Number.isNaN(target)) {
      handleStepClick(target);
    }
  };


  // TEMP DIAGNOSTIC LOG OF RENDERED STEP
  // eslint-disable-next-line no-console
  console.log('[Wizard.render] step', flow.step, 'ts', Date.now());

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            data-testid="wizard-current-step"
            data-step={flow.step}
            className="text-sm font-medium"
          >
            {tr('ui.step')} {flow.step} {tr('ui.of')} {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% {tr('ui.completeLabel')}</span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step Indicators (click to go back) */}
        <div
          className="relative z-20 flex justify-between mt-4 pointer-events-auto"
          data-testid="wizard-indicator-row"
          onClickCapture={handleIndicatorRowClick}
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = flow.step === step.id;
            const isCompleted = flow.step > step.id;
            const canClick = isCompleted; // Only allow clicking to earlier steps

            return (
              <button
                key={step.id}
                type="button"
                data-testid={`wizard-step-indicator-${step.id}`}
                data-step-id={step.id}
                data-active={isActive ? 'true' : 'false'}
                onMouseDown={() => handleStepClick(step.id)}
                onClick={() => handleStepClick(step.id)}
                className={`flex flex-col items-center focus:outline-none pointer-events-auto ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
                aria-current={isActive ? 'step' : undefined}
                aria-disabled={!canClick}
                title={canClick ? `Go to ${step.title}` : step.title}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-muted text-muted-foreground'
                  }`}
                  data-step-id={step.id}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-xs mt-1 ${isActive ? 'font-medium' : 'text-muted-foreground'}`}
                  data-step-id={step.id}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {flow.step === 1 && (
            <div data-testid="wizard-step-age-genre">
              <AgeGenreStep
                selectedAgeGroup={flow.ageGroup}
                selectedGenres={flow.genres}
                onAgeGroupSelect={handleAgeGroupSelect}
                onGenreToggle={handleGenreToggle}
              />
            </div>
          )}

          {flow.step === 2 && (
            <div data-testid="wizard-step-characters">
              <CharacterSelectionStep
                selectedCharacters={flow.selectedCharacters}
                onCharactersChange={(characters) => updateFlow({ selectedCharacters: characters })}
              />
            </div>
          )}

          {flow.step === 3 && flow.ageGroup && (
            <div data-testid="wizard-step-ideas">
              <StoryIdeaStep
                ageGroup={flow.ageGroup}
                genres={flow.genres}
                characters={flow.selectedCharacters}
                selectedSeed={flow.selectedSeed}
                customSeed={flow.customSeed}
                onSeedSelect={(seed) => updateFlow({ selectedSeed: seed })}
                onCustomSeedChange={(seed) => updateFlow({ customSeed: seed })}
              />
            </div>
          )}

          {flow.step === 4 && (
            <div data-testid="wizard-step-review">
              <ReviewStep
                ageGroup={flow.ageGroup}
                genres={flow.genres}
                selectedCharacters={flow.selectedCharacters}
                selectedSeed={flow.selectedSeed}
                customSeed={flow.customSeed}
                generating={generating}
                onCreateStory={onCreateStory}
              />
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
            {tr('ui.back')}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceedFromStep(flow.step)}
            className="flex items-center gap-2"
          >
            {tr('ui.next')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};