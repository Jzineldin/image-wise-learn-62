import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ErrorCardProps {
  /**
   * The error title
   */
  title: string;
  /**
   * The error message or details
   */
  error: string | Error;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show the error in a code block
   * @default false
   */
  showCode?: boolean;
  /**
   * Additional actions to display (e.g., retry button)
   */
  actions?: React.ReactNode;
}

/**
 * ErrorCard Component
 * 
 * A detailed error card component for structured error displays.
 * Includes icon, title, error details, and optional actions.
 * 
 * @example
 * ```tsx
 * <ErrorCard
 *   title="Story Generation Failed"
 *   error="Network timeout after 30 seconds"
 *   showCode
 *   actions={
 *     <Button onClick={retry}>Try Again</Button>
 *   }
 * />
 * ```
 */
export const ErrorCard: React.FC<ErrorCardProps> = ({
  title,
  error,
  className,
  showCode = false,
  actions,
}) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className={cn('border-destructive/20', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-destructive mb-2">{title}</h4>
            
            {showCode ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Error Details:</p>
                <div className="text-sm font-mono bg-muted p-3 rounded-lg text-destructive overflow-x-auto">
                  {errorMessage}
                </div>
              </>
            ) : (
              <p className="text-sm text-destructive/80">{errorMessage}</p>
            )}

            {actions && (
              <div className="mt-4 flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorCard;

