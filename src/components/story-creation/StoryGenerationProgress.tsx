import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, X, RefreshCw } from 'lucide-react';
import { useStoryStore } from '@/stores/storyStore';

interface StoryGenerationProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: string | null;
}

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description: string;
}

export const StoryGenerationProgress = ({
  open,
  onOpenChange,
  onCancel,
  onRetry,
  error
}: StoryGenerationProgressProps) => {
  const { isGenerating, generationProgress } = useStoryStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: 'create',
      label: 'Creating Story',
      status: 'pending',
      description: 'Setting up your story structure...'
    },
    {
      id: 'generate',
      label: 'Generating Content',
      status: 'pending',
      description: 'AI is crafting your first story segment...'
    },
    {
      id: 'save',
      label: 'Saving Progress',
      status: 'pending',
      description: 'Storing your story in the database...'
    },
    {
      id: 'image',
      label: 'Creating Visuals',
      status: 'pending',
      description: 'Generating the first image (optional)...'
    }
  ]);

  // Simulate progress steps based on generation progress
  useEffect(() => {
    if (!isGenerating) return;

    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      
      if (generationProgress >= 25 && currentStep < 1) {
        newSteps[0].status = 'completed';
        newSteps[1].status = 'active';
        setCurrentStep(1);
      }
      
      if (generationProgress >= 50 && currentStep < 2) {
        newSteps[1].status = 'completed';
        newSteps[2].status = 'active';
        setCurrentStep(2);
      }
      
      if (generationProgress >= 75 && currentStep < 3) {
        newSteps[2].status = 'completed';
        newSteps[3].status = 'active';
        setCurrentStep(3);
      }
      
      if (generationProgress >= 100) {
        newSteps[3].status = 'completed';
      }
      
      return newSteps;
    });
  }, [generationProgress, currentStep, isGenerating]);

  // Handle error state
  useEffect(() => {
    if (error) {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        if (currentStep < newSteps.length) {
          newSteps[currentStep].status = 'error';
        }
        return newSteps;
      });
    }
  }, [error, currentStep]);

  // Reset when dialog opens
  useEffect(() => {
    if (open && isGenerating) {
      setCurrentStep(0);
      setSteps(prevSteps => prevSteps.map(step => ({ ...step, status: 'pending' })));
      if (steps.length > 0) {
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[0].status = 'active';
          return newSteps;
        });
      }
    }
  }, [open, isGenerating]);

  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <RefreshCw className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const canCancel = isGenerating && !error;
  const canRetry = error && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" hideCloseButton>
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">
              {error ? 'Generation Failed' : isGenerating ? 'Creating Your Story' : 'Story Ready!'}
            </h2>
            <p className="text-muted-foreground">
              {error ? 'Something went wrong during story creation' : 
               isGenerating ? 'Please wait while we craft your personalized story...' : 
               'Your story has been successfully created!'}
            </p>
          </div>

          {/* Progress Bar */}
          {!error && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <Card key={step.id} className={`transition-all ${
                step.status === 'active' ? 'ring-2 ring-primary' : 
                step.status === 'error' ? 'ring-2 ring-destructive' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step)}
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        step.status === 'error' ? 'text-destructive' : 
                        step.status === 'completed' ? 'text-green-600' : ''
                      }`}>
                        {step.label}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Generation Error</h4>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            {canCancel && onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
            
            {canRetry && onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            {!isGenerating && !error && (
              <Button onClick={() => onOpenChange(false)}>
                Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};