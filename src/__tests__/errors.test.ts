import { ZodError, z } from 'zod';

// Mock next/server before importing the module under test
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}));

import {
  ApiError,
  ErrorCodes,
  handleApiError,
  createErrorResponse,
  sanitizeErrorMessage,
} from '@/lib/errors';

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------
describe('ApiError', () => {
  it('constructs with required fields', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('ApiError');
    expect(err.code).toBeUndefined();
    expect(err.details).toBeUndefined();
  });

  it('constructs with optional code and details', () => {
    const err = new ApiError(400, 'Bad request', 'VALIDATION_ERROR', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('is an instance of Error', () => {
    const err = new ApiError(500, 'Server error');
    expect(err).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// ErrorCodes
// ---------------------------------------------------------------------------
describe('ErrorCodes', () => {
  it('contains all expected authentication codes', () => {
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCodes.INVALID_CSRF_TOKEN).toBe('INVALID_CSRF_TOKEN');
  });

  it('contains all expected validation codes', () => {
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT');
    expect(ErrorCodes.MISSING_FIELD).toBe('MISSING_FIELD');
  });

  it('contains all expected business logic codes', () => {
    expect(ErrorCodes.INSUFFICIENT_CREDITS).toBe('INSUFFICIENT_CREDITS');
    expect(ErrorCodes.PLAN_LIMIT_REACHED).toBe('PLAN_LIMIT_REACHED');
    expect(ErrorCodes.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
    expect(ErrorCodes.DUPLICATE_ENTRY).toBe('DUPLICATE_ENTRY');
  });

  it('contains all expected external service codes', () => {
    expect(ErrorCodes.STRIPE_ERROR).toBe('STRIPE_ERROR');
    expect(ErrorCodes.CLAUDE_API_ERROR).toBe('CLAUDE_API_ERROR');
    expect(ErrorCodes.EMAIL_ERROR).toBe('EMAIL_ERROR');
    expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR');
  });

  it('contains generic error codes', () => {
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(ErrorCodes.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
  });
});

// ---------------------------------------------------------------------------
// handleApiError
// ---------------------------------------------------------------------------
describe('handleApiError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles ApiError with correct status code', () => {
    const err = new ApiError(403, 'Forbidden', ErrorCodes.FORBIDDEN);
    const response = handleApiError(err) as { body: unknown; status: number };
    expect(response.status).toBe(403);
    expect((response.body as { error: string }).error).toBe('Forbidden');
    expect((response.body as { code: string }).code).toBe(ErrorCodes.FORBIDDEN);
  });

  it('handles ZodError with 400 status', () => {
    const schema = z.object({ name: z.string().min(1) });
    let zodError: ZodError | null = null;
    try {
      schema.parse({ name: '' });
    } catch (e) {
      zodError = e as ZodError;
    }
    expect(zodError).not.toBeNull();
    const response = handleApiError(zodError!) as { body: unknown; status: number };
    expect(response.status).toBe(400);
    expect((response.body as { code: string }).code).toBe(ErrorCodes.VALIDATION_ERROR);
  });

  it('handles Stripe-named error with 500 status', () => {
    const stripeErr = new Error('Your card was declined');
    stripeErr.name = 'StripeError';
    const response = handleApiError(stripeErr) as { body: unknown; status: number };
    expect(response.status).toBe(500);
    expect((response.body as { code: string }).code).toBe(ErrorCodes.STRIPE_ERROR);
  });

  it('handles Supabase error by message keyword', () => {
    const dbErr = new Error('supabase connection timeout');
    const response = handleApiError(dbErr) as { body: unknown; status: number };
    expect(response.status).toBe(500);
    expect((response.body as { code: string }).code).toBe(ErrorCodes.DATABASE_ERROR);
  });

  it('handles postgres error by message keyword', () => {
    const pgErr = new Error('postgres duplicate key violation');
    const response = handleApiError(pgErr) as { body: unknown; status: number };
    expect(response.status).toBe(500);
    expect((response.body as { code: string }).code).toBe(ErrorCodes.DATABASE_ERROR);
  });

  it('handles a generic Error with 500 status', () => {
    const genericErr = new Error('Something went wrong');
    const response = handleApiError(genericErr) as { body: unknown; status: number };
    expect(response.status).toBe(500);
    expect((response.body as { code: string }).code).toBe(ErrorCodes.INTERNAL_ERROR);
  });

  it('handles unknown (non-Error) values with 500 status', () => {
    const response = handleApiError('raw string error') as { body: unknown; status: number };
    expect(response.status).toBe(500);
    expect((response.body as { code: string }).code).toBe(ErrorCodes.INTERNAL_ERROR);
  });

  it('logs with requestId when provided', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    handleApiError(new Error('oops'), 'req-123');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('req-123'),
      expect.any(Error)
    );
  });
});

// ---------------------------------------------------------------------------
// createErrorResponse
// ---------------------------------------------------------------------------
describe('createErrorResponse', () => {
  it('creates a response with message and status', () => {
    const response = createErrorResponse('Not found', 404) as { body: unknown; status: number };
    expect(response.status).toBe(404);
    expect((response.body as { error: string }).error).toBe('Not found');
  });

  it('includes code when provided', () => {
    const response = createErrorResponse(
      'Unauthorized',
      401,
      ErrorCodes.UNAUTHORIZED
    ) as { body: unknown; status: number };
    expect((response.body as { code: string }).code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('includes requestId when provided', () => {
    const response = createErrorResponse(
      'Bad request',
      400,
      undefined,
      'req-456'
    ) as { body: unknown; status: number };
    expect((response.body as { requestId: string }).requestId).toBe('req-456');
  });
});

// ---------------------------------------------------------------------------
// sanitizeErrorMessage
// ---------------------------------------------------------------------------
describe('sanitizeErrorMessage', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe('in development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('returns the original error message unchanged', () => {
      expect(sanitizeErrorMessage('User not found')).toBe('User not found');
    });

    it('returns stack trace details unchanged', () => {
      expect(sanitizeErrorMessage('Invalid API key: sk-1234')).toBe('Invalid API key: sk-1234');
    });
  });

  describe('in production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('sanitizes "User not found"', () => {
      expect(sanitizeErrorMessage('User not found')).toBe('Invalid email or password');
    });

    it('sanitizes "Invalid password"', () => {
      expect(sanitizeErrorMessage('Invalid password')).toBe('Invalid email or password');
    });

    it('sanitizes "Email already exists"', () => {
      expect(sanitizeErrorMessage('Email already exists')).toBe(
        'This email is already registered'
      );
    });

    it('sanitizes "No API key"', () => {
      expect(sanitizeErrorMessage('No API key')).toBe('Service configuration error');
    });

    it('sanitizes "Invalid API key"', () => {
      expect(sanitizeErrorMessage('Invalid API key')).toBe('Service configuration error');
    });

    it('sanitizes "Database error"', () => {
      expect(sanitizeErrorMessage('Database error')).toBe('An error occurred. Please try again.');
    });

    it('sanitizes "Connection failed"', () => {
      expect(sanitizeErrorMessage('Connection failed')).toBe('Service temporarily unavailable');
    });

    it('returns generic message for unknown errors', () => {
      expect(sanitizeErrorMessage('Some completely unknown error xyz')).toBe(
        'An error occurred. Please try again.'
      );
    });

    it('handles case-insensitive partial matches', () => {
      expect(sanitizeErrorMessage('user not found in database')).toBe('Invalid email or password');
    });
  });
});
