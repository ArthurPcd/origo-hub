'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog } from '@/lib/analytics';

function AnalyticsCore({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog on client side
    initPostHog();
  }, []);

  useEffect(() => {
    // Track page views manually for better control
    if (pathname) {
      // posthog.capture('$pageview') is handled automatically by PostHog
      // This effect is just to trigger re-initialization if needed
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AnalyticsCore>{children}</AnalyticsCore>
    </Suspense>
  );
}
