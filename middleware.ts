import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './src/lib/i18n/config';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://js.stripe.com https://r.stripe.com https://m.stripe.com https://q.stripe.com https://stripe.com https://b.stripecdn.com https://errors.stripe.com https://app.posthog.com https://us.posthog.com https://*.sentry.io https://*.clerk.accounts.dev https://clerk.origo-beta.xyz https://*.clerk.com https://challenges.cloudflare.com",
  "worker-src blob: 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' data: blob: https://*.supabase.co https://api.anthropic.com https://vercel.live https://api.stripe.com https://r.stripe.com https://m.stripe.com https://q.stripe.com https://stripe.com https://checkout.stripe.com https://b.stripecdn.com https://errors.stripe.com https://collector-pxvl48pwoc.px-cdn.net https://collector-pxvl48pwoc.px-cloud.net https://collector-pxvl48pwoc.pxchk.net https://payments-eu.amazon.com https://payevents-eu.amazon.com https://apay-us.amazon.com https://apay-eu.amazon.com https://app.posthog.com https://us.posthog.com https://*.ingest.sentry.io https://*.clerk.accounts.dev https://clerk.origo-beta.xyz https://*.clerk.com https://api.clerk.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://stripe.com https://checkout.stripe.com https://b.stripecdn.com https://*.clerk.accounts.dev https://clerk.origo-beta.xyz https://*.clerk.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://payments-eu.amazon.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // 'same-origin' breaks Clerk OAuth popup flows (Google/GitHub).
  // 'same-origin-allow-popups' preserves cross-origin isolation for the main window
  // while still letting the auth popup communicate back via postMessage/window.closed.
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return response;
}

// Public pages — listed explicitly for each locale prefix.
// With localePrefix: 'as-needed', English has no prefix (/login),
// other locales are prefixed (/fr/login, /de/login, etc.)
const PUBLIC_PAGES = [
  'login',
  'signup',
  'forgot-password',
  'reset-password',
  'pricing',
  'legal',
  'privacy',
  'contact-sales',
];

const allLocales = 'en|de|es|fr|it|ru|zh';

const isPublicRoute = createRouteMatcher([
  // Root landing pages (no prefix + all explicit locale prefixes)
  '/',
  `/(${allLocales})`,

  // English (no prefix) public pages
  ...PUBLIC_PAGES.map((p) => `/${p}(.*)`),

  // All locale prefixed public pages (includes /en/login, /fr/login, etc.)
  ...PUBLIC_PAGES.map((p) => `/(${allLocales})/${p}(.*)`),

  // Shared & auth callback routes (all locales)
  '/share/(.*)',
  '/auth/(.*)',
  `/(${allLocales})/share/(.*)`,
  `/(${allLocales})/auth/(.*)`,

  // API public endpoints
  '/api/webhooks(.*)',
  '/api/contact-sales',
  '/api/telegram/webhook(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const isApi = request.nextUrl.pathname.startsWith('/api/');

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Skip i18n middleware for API routes — it would corrupt JSON responses
  const intlResponse = isApi ? null : intlMiddleware(request);
  const response = intlResponse ?? NextResponse.next();

  return applySecurityHeaders(response as NextResponse);
});

export const config = {
  matcher: [
    // Root
    '/',
    // All locale prefixes (including /en/ for explicit access)
    '/(en|de|es|fr|it|ru|zh)/:path*',
    // API routes — Clerk middleware must run here so auth() has session context in route handlers
    '/api/(.*)',
    // Everything else except Next.js internals and static files
    '/((?!auth|share|_next|_vercel|.*\\..*).*)',
  ],
};
