import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Enable browser XSS protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Content Security Policy (CSP)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://js.stripe.com https://r.stripe.com https://m.stripe.com https://q.stripe.com https://stripe.com https://b.stripecdn.com https://errors.stripe.com https://*.sentry.io https://clerk.origo-beta.xyz https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://vercel.live https://api.stripe.com https://r.stripe.com https://m.stripe.com https://q.stripe.com https://stripe.com https://checkout.stripe.com https://b.stripecdn.com https://errors.stripe.com https://collector-pxvl48pwoc.px-cdn.net https://collector-pxvl48pwoc.px-cloud.net https://collector-pxvl48pwoc.pxchk.net https://payments-eu.amazon.com https://payevents-eu.amazon.com https://apay-us.amazon.com https://apay-eu.amazon.com https://*.sentry.io https://*.ingest.sentry.io https://clerk.origo-beta.xyz https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://stripe.com https://checkout.stripe.com https://b.stripecdn.com https://vercel.live https://clerk.origo-beta.xyz https://*.clerk.accounts.dev https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com https://payments-eu.amazon.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
              "worker-src blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry for error monitoring
export default withSentryConfig(
  withNextIntl(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "origo-saas",
    project: "origo-creative-briefs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
);
