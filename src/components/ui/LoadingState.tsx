/**
 * LoadingState - Reusable loading indicators
 *
 * Variants:
 * - Spinner: Generic loading spinner
 * - Inline: Small loader for buttons/inline elements
 * - Progress: Progress bar with percentage
 */

interface LoadingStateProps {
  variant?: 'spinner' | 'inline' | 'progress';
  message?: string;
  progress?: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  variant = 'spinner',
  message,
  progress,
  size = 'md',
  className = '',
}: LoadingStateProps) {
  if (variant === 'progress') {
    return (
      <div className={`space-y-3 ${className}`}>
        {message && (
          <p className="text-foreground font-medium text-sm text-center">
            {message}
          </p>
        )}
        <div className="w-full bg-edge rounded-full h-2 overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress || 0}%` }}
          />
        </div>
        {progress !== undefined && (
          <p className="text-muted text-xs text-center">{progress}%</p>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    const sizeClasses = {
      sm: 'w-3 h-3 border',
      md: 'w-4 h-4 border-2',
      lg: 'w-5 h-5 border-2',
    };

    return (
      <div
        className={`animate-spin rounded-full border-edge border-t-accent ${sizeClasses[size]} ${className}`}
        role="status"
        aria-label="Loading"
      />
    );
  }

  // Spinner variant (default)
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-edge border-t-accent ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-foreground font-medium mt-4 text-sm sm:text-base text-center">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Inline button loader - use inside buttons
 */
export function ButtonLoader({ className = '' }: { className?: string }) {
  return (
    <LoadingState
      variant="inline"
      size="sm"
      className={className}
    />
  );
}

/**
 * Full page loader
 */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LoadingState variant="spinner" size="lg" message={message} />
    </div>
  );
}
