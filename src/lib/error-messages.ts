/**
 * User-Friendly Error Messages
 *
 * Maps technical API errors to actionable, user-friendly messages
 */

export interface UserError {
  title: string;
  message: string;
  action?: string;
}

/**
 * Map error codes to user-friendly messages
 */
export const ERROR_MESSAGES: Record<string, UserError> = {
  // Authentication & Authorization
  UNAUTHORIZED: {
    title: 'Please log in',
    message: 'You need to be logged in to access this feature.',
    action: 'Go to login',
  },
  FORBIDDEN: {
    title: 'Access denied',
    message: "You don't have permission to perform this action.",
  },
  INVALID_CSRF_TOKEN: {
    title: 'Session expired',
    message: 'Your session has expired. Please refresh the page and try again.',
    action: 'Refresh page',
  },

  // Validation
  VALIDATION_ERROR: {
    title: 'Invalid input',
    message: 'Please check your input and try again.',
  },
  INVALID_INPUT: {
    title: 'Invalid input',
    message: 'The information you provided is not valid. Please check and try again.',
  },
  MISSING_FIELD: {
    title: 'Missing information',
    message: 'Please fill in all required fields.',
  },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    title: 'Too many requests',
    message: 'You\'re doing that too quickly. Please wait a moment and try again.',
    action: 'Wait and retry',
  },

  // Business Logic
  INSUFFICIENT_CREDITS: {
    title: 'Not enough credits',
    message: 'You don\'t have enough credits to generate a brief. Purchase more credits to continue.',
    action: 'Buy credits',
  },
  PLAN_LIMIT_REACHED: {
    title: 'Plan limit reached',
    message: 'You\'ve reached your monthly brief limit. Upgrade your plan or purchase additional credits.',
    action: 'Upgrade plan',
  },
  RESOURCE_NOT_FOUND: {
    title: 'Not found',
    message: 'The item you\'re looking for doesn\'t exist or has been deleted.',
    action: 'Go back',
  },

  // External Services
  STRIPE_ERROR: {
    title: 'Payment error',
    message: 'There was a problem processing your payment. Please try again or use a different payment method.',
    action: 'Try again',
  },
  CLAUDE_API_ERROR: {
    title: 'Generation failed',
    message: 'We couldn\'t generate your brief right now. Please try again in a moment.',
    action: 'Try again',
  },
  EMAIL_ERROR: {
    title: 'Email failed',
    message: 'We couldn\'t send the email. Please try again or contact support.',
    action: 'Try again',
  },
  DATABASE_ERROR: {
    title: 'Something went wrong',
    message: 'We encountered a problem saving your data. Please try again.',
    action: 'Try again',
  },

  // Generic
  INTERNAL_ERROR: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'Try again',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service unavailable',
    message: 'The service is temporarily unavailable. Please try again in a few minutes.',
    action: 'Try again',
  },
};

/**
 * Get user-friendly error message from error code or raw error
 */
export function getUserFriendlyError(
  error: string | { code?: string; error?: string; message?: string }
): UserError {
  // If error is an object, extract code or message
  if (typeof error === 'object') {
    const code = error.code;
    const message = error.error || error.message;

    // Try to match by code first
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }

    // Try to match by message
    if (message && typeof message === 'string') {
      return getUserFriendlyErrorFromMessage(message);
    }
  }

  // If error is a string, try to match it
  if (typeof error === 'string') {
    return getUserFriendlyErrorFromMessage(error);
  }

  // Fallback to generic error
  return ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Match error message to user-friendly message
 */
function getUserFriendlyErrorFromMessage(message: string): UserError {
  const lowerMessage = message.toLowerCase();

  // Rate limiting
  if (
    lowerMessage.includes('too many requests') ||
    lowerMessage.includes('rate limit')
  ) {
    return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }

  // Authentication
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('not authenticated') ||
    lowerMessage.includes('please log in')
  ) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }

  // CSRF
  if (
    lowerMessage.includes('csrf') ||
    lowerMessage.includes('security token')
  ) {
    return ERROR_MESSAGES.INVALID_CSRF_TOKEN;
  }

  // Credits/Limits
  if (
    lowerMessage.includes('limit reached') ||
    lowerMessage.includes('brief limit')
  ) {
    return ERROR_MESSAGES.PLAN_LIMIT_REACHED;
  }

  if (lowerMessage.includes('credits')) {
    return ERROR_MESSAGES.INSUFFICIENT_CREDITS;
  }

  // Payment
  if (
    lowerMessage.includes('payment') ||
    lowerMessage.includes('stripe') ||
    lowerMessage.includes('checkout')
  ) {
    return ERROR_MESSAGES.STRIPE_ERROR;
  }

  // Validation
  if (
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('validation')
  ) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }

  if (lowerMessage.includes('required') || lowerMessage.includes('missing')) {
    return ERROR_MESSAGES.MISSING_FIELD;
  }

  // Not found
  if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
    return ERROR_MESSAGES.RESOURCE_NOT_FOUND;
  }

  // Generic fallback
  return ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Get action handler for error actions
 */
export function getErrorActionHandler(action: string): (() => void) | undefined {
  switch (action) {
    case 'Go to login':
      return () => (window.location.href = '/login');
    case 'Refresh page':
      return () => window.location.reload();
    case 'Go back':
      return () => window.history.back();
    case 'Buy credits':
      return () => (window.location.href = '/account');
    case 'Upgrade plan':
      return () => (window.location.href = '/pricing');
    default:
      return undefined;
  }
}
