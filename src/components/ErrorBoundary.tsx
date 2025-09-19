import React from 'react';
import { logger } from '@/lib/debug';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by boundary', error, { 
      componentStack: errorInfo.componentStack,
      errorBoundary: true 
    });
  }

  render() {
    if (this.state.hasError) {
      // Context7 Pattern: Support function fallbacks that receive error
      const fallback = typeof this.props.fallback === 'function'
        ? this.props.fallback(this.state.error!)
        : this.props.fallback;

      return (
        fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="glass-card-elevated p-8 text-center max-w-md">
              <h1 className="text-2xl font-heading font-bold text-gradient mb-4">
                Something went wrong
              </h1>
              <p className="text-text-secondary mb-6">
                We're sorry, but something unexpected happened. Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;