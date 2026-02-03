import posthog from 'posthog-js';

// Initialize PostHog
export function initPostHog() {
  if (typeof window !== 'undefined') {
    // Only initialize on client side
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
    
    if (apiKey) {
      posthog.init(apiKey, {
        api_host: apiHost,
        autocapture: false, // We'll track events manually for better control
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: false,
      });
    }
  }
}

// Analytics event tracking
export const analytics = {
  // Track custom events
  track: (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture(event, properties);
    }
  },

  // Identify user
  identify: (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(userId, traits);
    }
  },

  // Set user properties
  setUserProperties: (properties: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.people.set(properties);
    }
  },

  // Reset on logout
  reset: () => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.reset();
    }
  },
};

// Event types (for type safety)
export const AnalyticsEvents = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  
  // Brief events
  BRIEF_STARTED: 'brief_started',
  BRIEF_CREATED: 'brief_created',
  BRIEF_VIEWED: 'brief_viewed',
  BRIEF_DELETED: 'brief_deleted',
  BRIEF_SHARED: 'brief_shared',
  
  // Export events
  PDF_DOWNLOADED: 'pdf_downloaded',
  PDF_EXPORT_FAILED: 'pdf_export_failed',
  
  // Upgrade events
  UPGRADE_MODAL_VIEWED: 'upgrade_modal_viewed',
  UPGRADE_CLICKED: 'upgrade_clicked',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  
  // Template events
  TEMPLATE_SELECTED: 'template_selected',
  TEMPLATE_VIEWED: 'template_viewed',
} as const;
