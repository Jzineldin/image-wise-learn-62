import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

// Context7 Pattern: Reusable loading component for Suspense boundaries
export const LoadingSpinner = ({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-2",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

// Context7 Pattern: Page-level loading component
export const PageLoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

// Context7 Pattern: Component-level loading
export const ComponentLoadingSpinner = ({ text }: { text?: string }) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="md" text={text} />
  </div>
);
