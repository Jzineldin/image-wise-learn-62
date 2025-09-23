import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { useStoryStore } from '@/stores/storyStore';
import { useLanguage } from '@/hooks/useLanguage';

interface StoryCreationProgressProps {
  onCancel?: () => void;
  onRetry?: () => void;
}

export const StoryCreationProgress = ({ onCancel, onRetry }: StoryCreationProgressProps) => {
  const { translate } = useLanguage();
  const { 
    isGenerating, 
    generationProgress, 
    lastError, 
    retryCount 
  } = useStoryStore();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isGenerating && !startTime) {
      setStartTime(Date.now());
      setElapsedTime(0);
    } else if (!isGenerating) {
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isGenerating, startTime]);

  useEffect(() => {
    if (!isGenerating || !startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating, startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedTimeRemaining = (): string | null => {
    if (generationProgress.progress === 0) return null;
    
    const estimatedTotal = (elapsedTime / generationProgress.progress) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsedTime);
    
    if (remaining < 5) return null;
    return formatTime(Math.floor(remaining));
  };

  if (lastError && !isGenerating) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-destructive">
                {translate('messages.error')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {lastError}
              </p>
              {retryCount < 3 && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRetry}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {translate('messages.tryAgain')} {retryCount > 0 && `(${retryCount + 1}/3)`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isGenerating) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
              <div>
                <h4 className="font-medium">{translate('ui.generating')}</h4>
                <p className="text-sm text-muted-foreground">
                  {generationProgress.currentStep || 'Preparing your story...'}
                </p>
              </div>
            </div>
            {generationProgress.canCancel && onCancel && (
              <Button
                variant="outline" 
                size="sm"
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={generationProgress.progress} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(generationProgress.progress)}% complete</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(elapsedTime)}
                </span>
                {getEstimatedTimeRemaining() && (
                  <span>
                    ~{getEstimatedTimeRemaining()} remaining
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Generation Steps */}
          <div className="space-y-2">
            {[
              'Creating story structure...',
              'Generating first segment...',
              'Preparing illustrations...',
              'Finalizing story...'
            ].map((step, index) => {
              const stepProgress = (index + 1) * 25;
              const isCompleted = generationProgress.progress > stepProgress;
              const isCurrent = generationProgress.progress >= (index * 25) && generationProgress.progress < stepProgress;

              return (
                <div key={step} className="flex items-center gap-3 text-sm">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                  )}
                  <span className={`${isCompleted ? 'text-green-700 dark:text-green-300' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};