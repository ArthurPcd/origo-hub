/**
 * EmptyState - Generic empty state component
 *
 * Usage: No data, no results, empty folders, etc.
 */

interface EmptyStateProps {
  /**
   * Icon to display (SVG element)
   */
  icon?: React.ReactNode;

  /**
   * Title text
   */
  title: string;

  /**
   * Description text (optional)
   */
  description?: string;

  /**
   * Action button (optional)
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
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

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-12',
      icon: 'w-12 h-12 mb-4',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-16 sm:py-24',
      icon: 'w-16 h-16 mb-6',
      title: 'text-lg sm:text-xl',
      description: 'text-sm sm:text-base',
    },
    lg: {
      container: 'py-24 sm:py-32',
      icon: 'w-20 h-20 mb-8',
      title: 'text-xl sm:text-2xl',
      description: 'text-base sm:text-lg',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 ${sizes.container} ${className}`}
    >
      {/* Icon */}
      {icon && (
        <div
          className={`rounded-full bg-surface border border-edge flex items-center justify-center text-muted ${sizes.icon}`}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h2 className={`font-semibold text-foreground mb-2 ${sizes.title}`}>
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p className={`text-muted mb-8 max-w-md ${sizes.description}`}>
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation ${
            action.variant === 'secondary'
              ? 'border border-edge hover:border-accent text-foreground hover:text-accent'
              : 'bg-accent hover:bg-accent-hover active:bg-accent-hover text-black'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Preset: No briefs
 */
export function NoBriefsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      }
      title="No briefs yet"
      description="Create your first brief to get started"
      action={{
        label: 'Create New Brief',
        onClick: onCreate,
      }}
    />
  );
}

/**
 * Preset: Empty folder
 */
export function EmptyFolder({ folderName }: { folderName?: string }) {
  return (
    <EmptyState
      icon={
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      }
      title={folderName ? `No briefs in ${folderName}` : 'No briefs in this folder'}
      description="Briefs you add to this folder will appear here"
      size="md"
    />
  );
}

/**
 * Preset: No search results
 */
export function NoSearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      }
      title="No results found"
      description={query ? `No briefs match "${query}"` : 'Try adjusting your search'}
      size="sm"
    />
  );
}
