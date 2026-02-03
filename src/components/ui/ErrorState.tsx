/**
 * ErrorState Component - User-friendly error display with recovery options
 *
 * Features:
 * - Clear error messages (no technical jargon)
 * - Retry button for recoverable errors
 * - Support/help links
 * - Consistent error UX across the app
 */

interface ErrorStateProps {
  /**
   * Error message to display (user-friendly, not technical)
   */
  message: string;

  /**
   * Optional error code for support reference
   */
  code?: string;

  /**
   * Optional request ID for support tickets
   */
  requestId?: string;

  /**
   * Retry callback - if provided, shows retry button
   */
  onRetry?: () => void;

  /**
   * Whether the retry action is currently loading
   */
  retrying?: boolean;

  /**
   * Optional custom action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ErrorState({
  message,
  code,
  requestId,
  onRetry,
  retrying = false,
  action,
  size = 'md',
  className = '',
}: ErrorStateProps) {
  const sizeClasses = {
    sm: 'p-4 text-sm',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-red-500/10 border border-red-500/20 rounded-xl ${sizeClasses[size]} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className="shrink-0 mt-0.5">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          {/* Error Message */}
          <p className="text-red-400 font-medium mb-3 leading-relaxed">
            {message}
          </p>

          {/* Error Metadata (Code & Request ID) */}
          {(code || requestId) && (
            <div className="text-red-400/70 text-xs font-mono mb-3 space-y-1">
              {code && <div>Error Code: {code}</div>}
              {requestId && <div>Request ID: {requestId}</div>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Retry Button */}
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={retrying}
                className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-50 text-sm font-medium transition-colors underline hover:no-underline"
              >
                {retrying ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-400 border-t-transparent" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Try again
                  </>
                )}
              </button>
            )}

            {/* Custom Action Button */}
            {action && (
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors underline hover:no-underline"
              >
                {action.label}
              </button>
            )}

            {/* Support Link */}
            <a
              href="/contact"
              className="inline-flex items-center gap-1 text-red-400/70 hover:text-red-400 text-xs transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error for form fields
 */
export function FieldError({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-red-400 text-sm mt-1 ${className}`}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
