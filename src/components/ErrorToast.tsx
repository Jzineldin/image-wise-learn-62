import { memo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorToastProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'network' | 'destructive';
}

export const ErrorToast = memo(({ title, description, action, variant = 'default' }: ErrorToastProps) => {
  const { toast } = useToast();

  const showErrorToast = () => {
    toast({
      variant: variant === 'destructive' ? 'destructive' : 'default',
      title: title,
      description,
      action: action ? (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          {action.label}
        </Button>
      ) : undefined,
    });
  };

  return null; // This component only triggers toasts
});

ErrorToast.displayName = 'ErrorToast';

// Utility functions for common error patterns
export const showStoryLoadError = (toast: ReturnType<typeof useToast>['toast'], retry?: () => void) => {
  toast({
    variant: 'destructive',
    title: 'Story Loading Failed',
    description: 'Unable to load the story. Please check your connection and try again.',
    action: retry ? (
      <Button
        variant="outline"
        size="sm"
        onClick={retry}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </Button>
    ) : undefined,
  });
};

export const showNetworkError = (toast: ReturnType<typeof useToast>['toast'], retry?: () => void) => {
  toast({
    variant: 'destructive',
    title: 'Connection Error',
    description: 'Unable to connect to our servers. Please check your internet connection.',
    action: retry ? (
      <Button
        variant="outline"
        size="sm"
        onClick={retry}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-3 w-3" />
        Try Again
      </Button>
    ) : undefined,
  });
};

export const showGenerationError = (toast: ReturnType<typeof useToast>['toast'], retry?: () => void) => {
  toast({
    variant: 'destructive',
    title: 'Generation Failed',
    description: 'Unable to generate content. Our AI service may be temporarily unavailable.',
    action: retry ? (
      <Button
        variant="outline"
        size="sm"
        onClick={retry}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-3 w-3" />
        Try Again
      </Button>
    ) : undefined,
  });
};