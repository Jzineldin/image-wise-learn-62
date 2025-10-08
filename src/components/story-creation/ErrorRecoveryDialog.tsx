import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorCard } from '@/components/ui/error-card';

interface ErrorRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  error: string;
  isRetrying?: boolean;
}

export const ErrorRecoveryDialog = ({
  open,
  onOpenChange,
  onRetry,
  error,
  isRetrying = false
}: ErrorRecoveryDialogProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onOpenChange(false);
    navigate('/dashboard');
  };

  const handleContactSupport = () => {
    window.open('mailto:support@taleforge.ai?subject=Story Generation Error&body=' + encodeURIComponent(`
Error: ${error}

Please describe what you were trying to do:
[Your description here]

System Info:
- Timestamp: ${new Date().toISOString()}
- Browser: ${navigator.userAgent}
    `), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Story Generation Failed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ErrorCard
            title="Story Generation Failed"
            error={error}
            showCode
          />

          <div className="space-y-2">
            <h4 className="font-medium">What you can do:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Try generating the story again</li>
              <li>Check your internet connection</li>
              <li>Simplify your story prompt if it's very long</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={onRetry} 
              disabled={isRetrying}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGoHome}
                className="flex-1 flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleContactSupport}
                className="flex-1 flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Support
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};