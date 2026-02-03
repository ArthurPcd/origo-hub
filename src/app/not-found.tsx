import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-base">
      <div className="text-center max-w-md">
        {/* 404 Number with gradient */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-accent to-accent-soft bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* Error message */}
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-black px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/brief/new"
            className="inline-flex items-center justify-center gap-2 border border-edge hover:border-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create a Brief
          </Link>
        </div>

        {/* Decorative element */}
        <div className="mt-12 flex justify-center gap-2 opacity-20">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
