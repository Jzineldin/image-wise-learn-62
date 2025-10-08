/**
 * Unified Loading Component System
 * Consolidates all loading states into a single, consistent system
 * 
 * @version 1.0.0
 * @date January 2025
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './card';

// ============================================================================
// LOADING SPINNER
// General purpose loading spinner with optional text
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

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

// ============================================================================
// PAGE LOADING
// Full-page loading state for route transitions
// ============================================================================

interface PageLoadingSpinnerProps {
  text?: string;
}

export const PageLoadingSpinner = ({ text = "Loading..." }: PageLoadingSpinnerProps) => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

// ============================================================================
// COMPONENT LOADING
// Loading state for component-level content
// ============================================================================

interface ComponentLoadingSpinnerProps {
  text?: string;
}

export const ComponentLoadingSpinner = ({ text }: ComponentLoadingSpinnerProps) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="md" text={text} />
  </div>
);

// ============================================================================
// INLINE LOADING
// Inline loader for smaller sections
// ============================================================================

interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const InlineLoader = ({ 
  message, 
  size = 'md', 
  className 
}: InlineLoaderProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn("flex items-center justify-center gap-3 py-8", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && <span className="text-text-secondary">{message}</span>}
    </div>
  );
};

// ============================================================================
// LOADING OVERLAY
// Full-screen overlay for blocking operations
// ============================================================================

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export const LoadingOverlay = ({ message = 'Loading...', className }: LoadingOverlayProps) => (
  <div className={cn(
    "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50",
    className
  )}>
    <div className="bg-background p-8 rounded-lg shadow-xl max-w-sm w-full mx-4">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-lg text-center">{message}</p>
    </div>
  </div>
);

// ============================================================================
// SKELETON LOADERS
// Skeleton loading states for content placeholders
// ============================================================================

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export const SkeletonCard = ({ count = 1, className }: SkeletonCardProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className={cn("overflow-hidden animate-pulse", className)}>
        {/* Image skeleton */}
        <div className="aspect-video bg-muted" />
        
        {/* Content skeleton */}
        <div className="p-6 space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
          <div className="mt-4 h-10 bg-muted rounded" />
        </div>
      </Card>
    ))}
  </>
);

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText = ({ lines = 3, className }: SkeletonTextProps) => (
  <div className={cn("space-y-2 animate-pulse", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className="h-4 bg-muted rounded"
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      />
    ))}
  </div>
);

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SkeletonAvatar = ({ size = 'md', className }: SkeletonAvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn(
      "rounded-full bg-muted animate-pulse",
      sizeClasses[size],
      className
    )} />
  );
};

interface SkeletonButtonProps {
  className?: string;
}

export const SkeletonButton = ({ className }: SkeletonButtonProps) => (
  <div className={cn("h-10 bg-muted rounded-lg animate-pulse", className)} />
);

interface SkeletonTableRowProps {
  columns?: number;
}

export const SkeletonTableRow = ({ columns = 4 }: SkeletonTableRowProps) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <div className="h-4 bg-muted rounded" />
      </td>
    ))}
  </tr>
);

interface SkeletonListItemProps {
  className?: string;
}

export const SkeletonListItem = ({ className }: SkeletonListItemProps) => (
  <div className={cn("flex items-center gap-4 p-4 animate-pulse", className)}>
    <SkeletonAvatar size="md" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  </div>
);

// ============================================================================
// UNIFIED EXPORT
// Single export point for all loading components
// ============================================================================

export const Loading = {
  Spinner: LoadingSpinner,
  Page: PageLoadingSpinner,
  Component: ComponentLoadingSpinner,
  Inline: InlineLoader,
  Overlay: LoadingOverlay,
  Skeleton: {
    Card: SkeletonCard,
    Text: SkeletonText,
    Avatar: SkeletonAvatar,
    Button: SkeletonButton,
    TableRow: SkeletonTableRow,
    ListItem: SkeletonListItem,
  }
};

// ============================================================================
// USAGE EXAMPLES (for documentation)
// ============================================================================

/*
// Example 1: Basic spinner
import { Loading } from '@/components/ui/loading';

{isLoading && <Loading.Spinner size="md" text="Loading story..." />}

// Example 2: Page loading
{isLoading && <Loading.Page text="Loading application..." />}

// Example 3: Inline loading
{isLoading && <Loading.Inline message="Processing..." />}

// Example 4: Overlay loading
{isGenerating && <Loading.Overlay message="Generating story..." />}

// Example 5: Skeleton loading
{isLoading ? (
  <Loading.Skeleton.Card count={3} />
) : (
  stories.map(story => <StoryCard key={story.id} story={story} />)
)}
*/

