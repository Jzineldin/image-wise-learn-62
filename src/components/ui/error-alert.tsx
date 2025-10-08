import React from 'react';
import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorAlertProps {
  /**
   * The error title (optional)
   */
  title?: string;
  /**
   * The error message to display
   */
  message: string;
  /**
   * The severity of the error
   * @default 'error'
   */
  variant?: 'error' | 'warning' | 'critical';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show the icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Callback when the error is dismissed (if dismissible)
   */
  onDismiss?: () => void;
  /**
   * Additional actions to display (e.g., retry button)
   */
  actions?: React.ReactNode;
}

/**
 * ErrorAlert Component
 * 
 * A standardized error alert component for page-level errors.
 * Includes icon, title, and message with consistent styling.
 * 
 * @example
 * ```tsx
 * <ErrorAlert
 *   title="Generation Error"
 *   message="Failed to generate story. Please try again."
 * />
 * ```
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title,
  message,
  variant = 'error',
  className,
  showIcon = true,
  onDismiss,
  actions,
}) => {
  const Icon = variant === 'critical' ? XCircle : variant === 'warning' ? AlertTriangle : AlertCircle;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'p-4 bg-destructive/10 border border-destructive/20 rounded-lg transition-all duration-200',
        variant === 'warning' && 'bg-yellow-500/10 border-yellow-500/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0 mt-0.5',
              variant === 'warning' ? 'text-yellow-600 dark:text-yellow-500' : 'text-destructive'
            )}
            aria-hidden="true"
          />
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4
              className={cn(
                'font-medium',
                variant === 'warning' ? 'text-yellow-700 dark:text-yellow-400' : 'text-destructive'
              )}
            >
              {title}
            </h4>
          )}
          <p
            className={cn(
              'text-sm',
              title && 'mt-1',
              variant === 'warning' ? 'text-yellow-600/80 dark:text-yellow-400/80' : 'text-destructive/80'
            )}
          >
            {message}
          </p>
          {actions && (
            <div className="mt-3 flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-md transition-colors',
              variant === 'warning'
                ? 'hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
                : 'hover:bg-destructive/20 text-destructive'
            )}
            aria-label="Dismiss error"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * ErrorInline Component
 * 
 * A compact error component for inline form field errors.
 * 
 * @example
 * ```tsx
 * <ErrorInline message="This field is required" />
 * ```
 */
export interface ErrorInlineProps {
  /**
   * The error message to display
   */
  message: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const ErrorInline: React.FC<ErrorInlineProps> = ({ message, className }) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'p-3 bg-destructive/10 border border-destructive/20 rounded-lg transition-all duration-200',
        className
      )}
    >
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
};

/**
 * ErrorText Component
 * 
 * A simple text-only error component for minimal error displays.
 * 
 * @example
 * ```tsx
 * <ErrorText message="Invalid email address" />
 * ```
 */
export interface ErrorTextProps {
  /**
   * The error message to display
   */
  message: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show the icon
   * @default false
   */
  showIcon?: boolean;
}

export const ErrorText: React.FC<ErrorTextProps> = ({ message, className, showIcon = false }) => {
  return (
    <p
      role="alert"
      aria-live="polite"
      className={cn('text-sm text-destructive flex items-center gap-2', className)}
    >
      {showIcon && <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
      {message}
    </p>
  );
};

// Export all components as a namespace for convenience
export const Error = {
  Alert: ErrorAlert,
  Inline: ErrorInline,
  Text: ErrorText,
};

