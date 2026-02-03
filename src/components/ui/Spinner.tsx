/**
 * Spinner Component - Loading indicator
 *
 * Accessible loading spinner with customizable size
 */

interface SpinnerProps {
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Optional label for screen readers
   */
  label?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function Spinner({ size = 'md', label = 'Loading', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
  };

  return (
    <div role="status" aria-live="polite" className={className}>
      <div
        className={`animate-spin rounded-full border-edge border-t-accent ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Full-page loading state
 */
export function LoadingPage({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Spinner size="lg" />
      {message && (
        <p className="text-muted text-sm mt-4 text-center">{message}</p>
      )}
    </div>
  );
}

/**
 * Inline loading state (for buttons, etc.)
 */
export function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex ${className}`}>
      <Spinner size="sm" />
    </div>
  );
}
