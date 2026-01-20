import { ZodError, ZodIssueCode } from 'zod'

// ---------------------------------------------------------------------------
// Mock next/server so tests run outside the Next.js runtime
// ---------------------------------------------------------------------------
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

import {
  ApiError,
  ErrorCodes,
  handleApiError,
  createErrorResponse,
  sanitizeErrorMessage,
} from '../errors'

// Helper to get the response body returned by handleApiError / createErrorResponse
// (the mock returns a plain object with {body, status})
function parse(response: ReturnType<typeof handleApiError>) {
  // Our mock returns {body, status}
  return response as unknown as { body: Record<string, unknown>; status: number }
}

// ---------------------------------------------------------------------------
// ApiError class
// ---------------------------------------------------------------------------
describe('ApiError', () => {
  it('sets name to ApiError', () => {
    const err = new ApiError(400, 'bad request')
    expect(err.name).toBe('ApiError')
  })

  it('stores statusCode and message', () => {
    const err = new ApiError(404, 'not found', ErrorCodes.RESOURCE_NOT_FOUND)
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('not found')
    expect(err.code).toBe(ErrorCodes.RESOURCE_NOT_FOUND)
  })

  it('is an instance of Error', () => {
    expect(new ApiError(500, 'oops')).toBeInstanceOf(Error)
  })

  it('stores optional details', () => {
    const details = { field: 'email' }
    const err = new ApiError(422, 'unprocessable', undefined, details)
    expect(err.details).toEqual(details)
  })
})

// ---------------------------------------------------------------------------
// ErrorCodes constants
// ---------------------------------------------------------------------------
describe('ErrorCodes', () => {
  it('defines all expected error code keys', () => {
    const expectedKeys = [
      'UNAUTHORIZED',
      'FORBIDDEN',
      'INVALID_CSRF_TOKEN',
      'VALIDATION_ERROR',
      'INVALID_INPUT',
      'MISSING_FIELD',
      'RATE_LIMIT_EXCEEDED',
      'INSUFFICIENT_CREDITS',
      'PLAN_LIMIT_REACHED',
      'RESOURCE_NOT_FOUND',
      'DUPLICATE_ENTRY',
      'STRIPE_ERROR',
      'CLAUDE_API_ERROR',
      'EMAIL_ERROR',
      'DATABASE_ERROR',
      'INTERNAL_ERROR',
      'SERVICE_UNAVAILABLE',
    ]
    for (const key of expectedKeys) {
      expect(ErrorCodes).toHaveProperty(key)
    }
  })

  it('error code values match their key names', () => {
    for (const [key, value] of Object.entries(ErrorCodes)) {
      expect(value).toBe(key)
    }
  })
})

// ---------------------------------------------------------------------------
// handleApiError — ApiError branch
// ---------------------------------------------------------------------------
describe('handleApiError — ApiError', () => {
  it('uses the ApiError statusCode', () => {
    const { status } = parse(handleApiError(new ApiError(403, 'forbidden')))
    expect(status).toBe(403)
  })

  it('includes the error message and code in the body', () => {
    const { body } = parse(
      handleApiError(new ApiError(401, 'unauthorized', ErrorCodes.UNAUTHORIZED))
    )
    expect(body.error).toBe('unauthorized')
    expect(body.code).toBe(ErrorCodes.UNAUTHORIZED)
  })

  it('includes requestId in the body when provided', () => {
    const { body } = parse(
      handleApiError(new ApiError(400, 'bad'), 'req-123')
    )
    expect(body.requestId).toBe('req-123')
  })
})

// ---------------------------------------------------------------------------
// handleApiError — ZodError branch
// ---------------------------------------------------------------------------
describe('handleApiError — ZodError', () => {
  function makeZodError(message: string): ZodError {
    return new ZodError([
      {
        code: ZodIssueCode.custom,
        message,
        path: ['field'],
      },
    ])
  }

  it('returns status 400', () => {
    const { status } = parse(handleApiError(makeZodError('field required')))
    expect(status).toBe(400)
  })

  it('returns VALIDATION_ERROR code', () => {
    const { body } = parse(handleApiError(makeZodError('field required')))
    expect(body.code).toBe(ErrorCodes.VALIDATION_ERROR)
  })

  it('includes the first Zod issue message', () => {
    const { body } = parse(handleApiError(makeZodError('must be a number')))
    expect(body.error).toBe('must be a number')
  })
})

// ---------------------------------------------------------------------------
// handleApiError — StripeError branch
// ---------------------------------------------------------------------------
describe('handleApiError — StripeError', () => {
  it('returns status 500 for a StripeError', () => {
    const stripeErr = new Error('card declined')
    stripeErr.name = 'StripeError'
    const { status } = parse(handleApiError(stripeErr))
    expect(status).toBe(500)
  })

  it('returns STRIPE_ERROR code', () => {
    const stripeErr = new Error('card declined')
    stripeErr.name = 'StripeError'
    const { body } = parse(handleApiError(stripeErr))
    expect(body.code).toBe(ErrorCodes.STRIPE_ERROR)
  })

  it('does not leak the raw Stripe error message to the client in production', () => {
    const original = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    const stripeErr = new Error('sk_live_secret_key_exposed')
    stripeErr.name = 'StripeError'
    const { body } = parse(handleApiError(stripeErr))
    expect(body.error).not.toContain('sk_live')
    Object.defineProperty(process.env, 'NODE_ENV', { value: original, configurable: true })
  })
})

// ---------------------------------------------------------------------------
// handleApiError — Supabase / postgres branch
// ---------------------------------------------------------------------------
describe('handleApiError — database errors', () => {
  it('returns status 500 for supabase errors', () => {
    const { status } = parse(handleApiError(new Error('supabase connection refused')))
    expect(status).toBe(500)
  })

  it('returns DATABASE_ERROR code', () => {
    const { body } = parse(handleApiError(new Error('postgres syntax error')))
    expect(body.code).toBe(ErrorCodes.DATABASE_ERROR)
  })
})

// ---------------------------------------------------------------------------
// handleApiError — generic Error branch
// ---------------------------------------------------------------------------
describe('handleApiError — generic Error', () => {
  it('returns status 500', () => {
    const { status } = parse(handleApiError(new Error('something broke')))
    expect(status).toBe(500)
  })

  it('returns INTERNAL_ERROR code', () => {
    const { body } = parse(handleApiError(new Error('something broke')))
    expect(body.code).toBe(ErrorCodes.INTERNAL_ERROR)
  })
})

// ---------------------------------------------------------------------------
// handleApiError — unknown (non-Error) branch
// ---------------------------------------------------------------------------
describe('handleApiError — unknown value', () => {
  it('handles a plain string error', () => {
    const { status, body } = parse(handleApiError('plain string error'))
    expect(status).toBe(500)
    expect(body.code).toBe(ErrorCodes.INTERNAL_ERROR)
  })

  it('handles null without throwing', () => {
    expect(() => handleApiError(null)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// createErrorResponse
// ---------------------------------------------------------------------------
describe('createErrorResponse', () => {
  it('sets the correct HTTP status', () => {
    const { status } = parse(createErrorResponse('not found', 404))
    expect(status).toBe(404)
  })

  it('includes the error message in the body', () => {
    const { body } = parse(createErrorResponse('not found', 404))
    expect(body.error).toBe('not found')
  })

  it('includes the code when provided', () => {
    const { body } = parse(
      createErrorResponse('not found', 404, ErrorCodes.RESOURCE_NOT_FOUND)
    )
    expect(body.code).toBe(ErrorCodes.RESOURCE_NOT_FOUND)
  })

  it('includes requestId when provided', () => {
    const { body } = parse(
      createErrorResponse('bad input', 400, undefined, 'req-abc')
    )
    expect(body.requestId).toBe('req-abc')
  })

  it('omits code when not provided', () => {
    const { body } = parse(createErrorResponse('oops', 500))
    expect(body.code).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// sanitizeErrorMessage
// ---------------------------------------------------------------------------
describe('sanitizeErrorMessage', () => {
  // Tests run in the Jest (test) environment, so NODE_ENV is 'test'.
  // sanitizeErrorMessage treats non-development as production-like.
  // We temporarily set NODE_ENV to control the branch.

  describe('production mode (sanitization active)', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      })
    })
    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true,
      })
    })

    it('maps "User not found" to the generic auth message', () => {
      expect(sanitizeErrorMessage('User not found')).toBe('Invalid email or password')
    })

    it('maps "Invalid password" to the generic auth message', () => {
      expect(sanitizeErrorMessage('Invalid password')).toBe('Invalid email or password')
    })

    it('maps "No API key" to a configuration error message', () => {
      expect(sanitizeErrorMessage('No API key')).toBe('Service configuration error')
    })

    it('maps "Invalid API key" to a configuration error message', () => {
      expect(sanitizeErrorMessage('Invalid API key')).toBe('Service configuration error')
    })

    it('maps "Email already exists" to a registration message', () => {
      expect(sanitizeErrorMessage('Email already exists')).toBe(
        'This email is already registered'
      )
    })

    it('maps "Connection failed" to a temporary unavailability message', () => {
      expect(sanitizeErrorMessage('Connection failed')).toBe(
        'Service temporarily unavailable'
      )
    })

    it('returns a generic fallback for unknown errors', () => {
      expect(sanitizeErrorMessage('totally unknown error xyz')).toBe(
        'An error occurred. Please try again.'
      )
    })

    it('performs case-insensitive partial matching (e.g. contains "user not found")', () => {
      expect(sanitizeErrorMessage('ERROR: User Not Found in table')).toBe(
        'Invalid email or password'
      )
    })
  })

  describe('development mode (full error returned)', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      })
    })
    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        configurable: true,
      })
    })

    it('returns the original error message without sanitizing', () => {
      expect(sanitizeErrorMessage('User not found')).toBe('User not found')
    })

    it('returns raw internal details as-is', () => {
      const raw = 'postgres: relation "users" does not exist'
      expect(sanitizeErrorMessage(raw)).toBe(raw)
    })
  })
})
