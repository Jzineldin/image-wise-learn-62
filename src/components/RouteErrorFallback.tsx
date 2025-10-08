import React from 'react';
import { isRouteErrorResponse } from 'react-router-dom';
import { logger } from '@/lib/debug';
import { Button } from '@/components/ui/button';

interface Props {
  error?: unknown;
  context?: string;
  onRetry?: () => void;
}

const RouteErrorFallback: React.FC<Props> = ({ error, context = 'this page', onRetry }) => {
  // Log error for debugging (Context7 pattern)
  React.useEffect(() => {
    if (error) {
      logger.error('Route error caught', error, {
        context,
        isRouteError: isRouteErrorResponse(error),
        routeErrorFallback: true
      });
    }
  }, [error, context]);

  // Context7 MCP Pattern: Use isRouteErrorResponse to distinguish error types
  const getErrorMessage = () => {
    if (isRouteErrorResponse(error)) {
      return {
        title: `Error ${error.status}: ${error.statusText}`,
        message: error.data || `We couldn't load ${context} due to a server error.`
      };
    }

    if (error instanceof Error) {
      return {
        title: 'Something went wrong',
        message: error.message || `We couldn't load ${context}. Please try again.`
      };
    }

    return {
      title: 'Oops! Something went wrong',
      message: `We couldn't load ${context}. You can try again, or go back to the dashboard.`
    };
  };

  const { title, message } = getErrorMessage();
  return (
    <div className="min-h-[60vh] bg-background flex items-center justify-center px-4">
      <div className="glass-card-elevated p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-heading font-bold text-gradient mb-3">
          {title}
        </h1>
        <p className="text-text-secondary mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            variant="default"
            size="lg"
          >
            Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/dashboard">
              Go to Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorFallback;

