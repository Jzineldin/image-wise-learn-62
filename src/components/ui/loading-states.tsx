/**
 * Consistent loading state components
 * Provides skeleton loaders and loading overlays for better UX
 */

import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton card loader for story cards
 */
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

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

/**
 * Full-screen loading overlay
 */
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

interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Inline loader for smaller sections
 */
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

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * Skeleton text loader
 */
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

/**
 * Skeleton avatar loader
 */
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

/**
 * Skeleton button loader
 */
export const SkeletonButton = ({ className }: SkeletonButtonProps) => (
  <div className={cn("h-10 bg-muted rounded animate-pulse", className)} />
);

/**
 * Skeleton table row
 */
export const SkeletonTableRow = ({ columns = 4 }: { columns?: number }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <div className="h-4 bg-muted rounded" />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton list item
 */
export const SkeletonListItem = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-4 p-4 animate-pulse", className)}>
    <SkeletonAvatar size="md" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  </div>
);

