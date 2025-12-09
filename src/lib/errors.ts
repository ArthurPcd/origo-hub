/**
 * Centralized Error Handling for API Routes
 *
 * Prevents information leakage through error messages while maintaining
 * debugging capability in development.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Custom API error class with status code and error code
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Common error codes for consistent error handling
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CSRF_TOKEN: 'INVALID_CSRF_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Business Logic
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // External Services
  STRIPE_ERROR: 'STRIPE_ERROR',
  CLAUDE_API_ERROR: 'CLAUDE_API_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Centralized error handler for API routes
 *
 * Logs full error details server-side while returning sanitized
 * error messages to the client.
 *
 * @param error - The error that occurred
 * @param requestId - Optional request ID for correlation
 * @returns NextResponse with appropriate error message and status
 */
export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log full error server-side (never sent to client)
  if (requestId) {
    console.error(`[${requestId}] API Error:`, error);
  } else {
    console.error('API Error:', error);
  }

  // Known ApiError - use provided message
  if (error instanceof ApiError) {
    const errorObj: Record<string, any> = {
      error: error.message,
      code: error.code,
    };
    if (requestId) errorObj.requestId = requestId;
    if (isDevelopment && error.details) errorObj.details = error.details;
    return NextResponse.json(errorObj, { status: error.statusCode });
  }

  // Zod validation error - extract first error message
  if (error instanceof ZodError) {
    const errors = error.issues || [];
    const firstError = errors[0];
    const errorObj: Record<string, any> = {
      error: firstError?.message || 'Validation error',
      code: ErrorCodes.VALIDATION_ERROR,
    };
    if (requestId) errorObj.requestId = requestId;
    if (isDevelopment && errors.length) errorObj.details = errors;
    return NextResponse.json(errorObj, { status: 400 });
  }

  // Stripe errors - don't leak Stripe internals
  if (error instanceof Error && error.name === 'StripeError') {
    return NextResponse.json(
      {
        error: 'Payment processing error. Please try again.',
        code: ErrorCodes.STRIPE_ERROR,
        ...(requestId && { requestId }),
        ...(isDevelopment && { details: error.message }),
      },
      { status: 500 }
    );
  }

  // Supabase errors - don't leak database schema
  if (
    error instanceof Error &&
    (error.message.includes('supabase') || error.message.includes('postgres'))
  ) {
    const errorObj: Record<string, any> = {
      error: 'Database error. Please try again.',
      code: ErrorCodes.DATABASE_ERROR,
    };
    if (requestId) errorObj.requestId = requestId;
    if (isDevelopment) errorObj.details = error.message;
    return NextResponse.json(errorObj, { status: 500 });
  }

  // Generic Error - log details but return safe message
  if (error instanceof Error) {
    const errorObj: Record<string, any> = {
      error: isDevelopment
        ? error.message
        : 'An unexpected error occurred. Please try again.',
      code: ErrorCodes.INTERNAL_ERROR,
    };
    if (requestId) errorObj.requestId = requestId;
    if (isDevelopment && error.stack) errorObj.stack = error.stack;
    return NextResponse.json(errorObj, { status: 500 });
  }

  // Unknown error type - minimal information leakage
  const unknownObj: Record<string, any> = {
    error: 'An unexpected error occurred. Please try again.',
    code: ErrorCodes.INTERNAL_ERROR,
  };
  if (requestId) unknownObj.requestId = requestId;
  if (isDevelopment) unknownObj.details = String(error);
  return NextResponse.json(unknownObj, { status: 500 });
}

/**
 * Create a standardized error response
 *
 * Use this for known error conditions
 */
export function createErrorResponse(
  message: string,
  statusCode: number,
  code?: string,
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(code && { code }),
      ...(requestId && { requestId }),
    },
    { status: statusCode }
  );
}

/**
 * Sanitize error messages to prevent information leakage
 *
 * Common patterns that leak sensitive info:
 * - "User not found" vs "Invalid password" (reveals account existence)
 * - Stack traces
 * - Database schema details
 * - API key errors
 */
export function sanitizeErrorMessage(error: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // In development, return full error
  if (isDevelopment) {
    return error;
  }

  // Sanitize common error patterns
  const sanitizationRules: Record<string, string> = {
    'User not found': 'Invalid email or password',
    'Invalid password': 'Invalid email or password',
    'Email already exists': 'This email is already registered',
    'No API key': 'Service configuration error',
    'Invalid API key': 'Service configuration error',
    'Database error': 'An error occurred. Please try again.',
    'Connection failed': 'Service temporarily unavailable',
  };

  // Check for exact matches
  if (error in sanitizationRules) {
    return sanitizationRules[error];
  }

  // Check for partial matches (case-insensitive)
  const lowerError = error.toLowerCase();
  for (const [pattern, replacement] of Object.entries(sanitizationRules)) {
    if (lowerError.includes(pattern.toLowerCase())) {
      return replacement;
    }
  }

  // Default: generic error message
  return 'An error occurred. Please try again.';
}
