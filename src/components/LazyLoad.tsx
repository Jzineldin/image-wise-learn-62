import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingText?: string;
  type?: 'page' | 'component' | 'inline';
}

const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback,
  loadingText = 'Loading...',
  type = 'component'
}) => {
  const defaultFallback = () => {
    switch (type) {
      case 'page':
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-text-secondary">{loadingText}</p>
            </div>
          </div>
        );
      case 'component':
        return (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        );
      case 'inline':
        return (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-text-secondary">{loadingText}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={fallback || defaultFallback()}>
      {children}
    </Suspense>
  );
};

export default LazyLoad;