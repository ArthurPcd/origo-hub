/**
 * Skeleton Loaders - Content placeholders during loading
 *
 * Provides visual feedback while content loads
 */

/**
 * Base skeleton element
 */
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-edge rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for a brief card in the history list
 */
export function BriefCardSkeleton() {
  return (
    <div className="bg-surface border border-edge rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Date */}
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Project type */}
      <Skeleton className="h-4 w-1/2 mb-4" />

      {/* Content preview lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

/**
 * Skeleton for brief content page
 */
export function BriefContentSkeleton() {
  return (
    <div className="bg-surface border border-edge rounded-xl p-8 md:p-12">
      {/* Title */}
      <Skeleton className="h-8 w-2/3 mb-8" />

      {/* Sections */}
      <div className="space-y-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            {/* Section heading */}
            <Skeleton className="h-6 w-1/3 mb-4" />

            {/* Section content */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for pricing plan cards
 */
export function PricingCardSkeleton() {
  return (
    <div className="bg-surface border border-edge rounded-xl p-6">
      {/* Plan name */}
      <Skeleton className="h-6 w-1/2 mb-2" />

      {/* Price */}
      <Skeleton className="h-10 w-3/4 mb-4" />

      {/* Description */}
      <Skeleton className="h-4 w-full mb-6" />

      {/* Features list */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <Skeleton className="h-12 w-full mt-6 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for account page
 */
export function AccountPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-5 w-1/4" />
      </div>

      {/* Cards */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-surface border border-edge rounded-xl p-6">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Generic list skeleton
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-edge rounded-xl p-6">
          <Skeleton className="h-5 w-2/3 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}
