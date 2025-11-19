import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, BookOpen, Users, Sparkles, Wand2, Save } from 'lucide-react';
import { t } from '@/constants/translations';
import { AgeGenreStep } from './AgeGenreStep';
import { CharacterSelectionStep } from './CharacterSelectionStep';
import { StoryIdeaStep } from './StoryIdeaStep';
import { ReviewStep } from './ReviewStep';
import { useStoryStore } from '@/stores/storyStore';
import { useStoryValidation, useRateLimit } from '@/hooks/useInputValidation';
import { useAutoSave } from '@/hooks/use-auto-save';
import { toast } from 'sonner';
import { useCallback, useMemo, useEffect } from 'react';


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

  // Auto-save hook with 2s debounce
  const { isSaving, lastSaved } = useAutoSave({
    ageGroup: flow.ageGroup,
    genres: flow.genres,
    selectedCharacters: flow.selectedCharacters,
    selectedSeed: flow.selectedSeed,
    customSeed: flow.customSeed,
    step: flow.step,
    languageCode: selectedLanguage,
  }, {
    debounceMs: 2000,
    enableLocalStorage: true,
    enableToasts: false,
  });

  // Memoized translation function
  const tr = useCallback((key: string) => t(key, selectedLanguage), [selectedLanguage]);

  const STEPS = [
    { id: 1, title: tr('storyCreation.steps.ageAndGenre'), icon: BookOpen },
    { id: 2, title: tr('storyCreation.steps.characters'), icon: Users },
    { id: 3, title: tr('storyCreation.steps.storyIdeas'), icon: Sparkles },
    { id: 4, title: tr('storyCreation.steps.review'), icon: Wand2 }
  ];

  // Memoized event handlers to prevent re-renders
  const handleNext = useCallback(() => {
    if (flow.step < STEPS.length) {
      updateFlow({ step: flow.step + 1 });
    }
  }, [flow.step, updateFlow]);

  const handleBack = useCallback(() => {
    if (flow.step > 1) {
      updateFlow({ step: flow.step - 1 });
    }
  }, [flow.step, updateFlow]);

  const handleAgeGroupSelect = useCallback((ageGroup: string) => {
    updateFlow({ ageGroup });
  }, [updateFlow]);

  const handleGenreToggle = useCallback((genre: string) => {
    // Limit to a single primary genre
    updateFlow({ genres: [genre] });
  }, [updateFlow]);

  // Memoized validation function - expensive operation
  const canProceedFromStep = useMemo(() => {
    return (step: number): boolean => {
      switch (step) {
        case 1:
          return !!flow.ageGroup && flow.genres.length > 0;
        case 2:
          return true; // Characters are optional
        case 3: {
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
        }
        case 4: {
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
        }
        default:
          return true;
      }
    };
  }, [flow.ageGroup, flow.genres, flow.selectedSeed, flow.customSeed, flow.selectedCharacters, selectedLanguage, validate]);

  // Memoized progress calculation
  const progress = useMemo(() => (flow.step / STEPS.length) * 100, [flow.step]);

  const handleStepClick = useCallback((targetStep: number) => {
    // Allow backward navigation to any previous step; forward remains via Next
    if (targetStep < flow.step) {
      updateFlow({ step: targetStep });
    }
  }, [flow.step, updateFlow]);

  const handleIndicatorRowClick = useCallback((e: any) => {
    const el = (e.target as HTMLElement).closest('[data-step-id]') as HTMLElement | null;
    if (!el) return;
    const target = Number(el.getAttribute('data-step-id'));
    if (!Number.isNaN(target)) {
      handleStepClick(target);
    }
  }, [handleStepClick, flow.step]);

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
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Saving...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% {tr('ui.completeLabel')}</span>
          </div>
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
                  className={`w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-muted text-muted-foreground'
                  }`}
                  data-step-id={step.id}
                >
                  <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
                </div>
                <span
                  className={`text-xs mt-1 text-center max-w-[80px] ${isActive ? 'font-medium' : 'text-muted-foreground'}`}
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
        <CardContent className="p-4 sm:p-6 md:p-8">
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

      {/* Navigation - Mobile Optimized */}
      {flow.step < 4 && (
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={flow.step === 1}
            className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{tr('ui.back')}</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceedFromStep(flow.step)}
            className="flex items-center gap-2 min-h-[44px] flex-1 sm:flex-initial"
          >
            <span className="hidden sm:inline">{tr('ui.next')}</span>
            <span className="sm:hidden">Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};