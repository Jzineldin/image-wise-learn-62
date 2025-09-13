import React from 'react';
import { cn } from '@/lib/utils';

interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  asChild?: boolean;
  minSize?: number;
}

/**
 * TouchTarget ensures minimum touch target size for accessibility (44x44px minimum)
 * Following WCAG 2.1 Success Criterion 2.5.5 Target Size
 */
const TouchTarget = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  ({ children, className, minSize = 44, asChild = false, ...props }, ref) => {
    const minSizeClass = `min-w-[${minSize}px] min-h-[${minSize}px]`;

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        ref,
        className: cn(minSizeClass, 'touch-target', className),
        ...props
      });
    }

    return (
      <div
        ref={ref}
        className={cn(
          minSizeClass,
          'touch-target',
          'inline-flex items-center justify-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TouchTarget.displayName = 'TouchTarget';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'icon';
}

/**
 * TouchButton is a button component with built-in touch target sizing
 */
export const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'px-4 py-2',
      ghost: 'p-2',
      icon: 'p-3'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'min-w-[44px] min-h-[44px]',
          'inline-flex items-center justify-center',
          'touch-none select-none',
          'transition-all duration-200',
          'active:scale-95',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

export default TouchTarget;