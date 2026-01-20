import { ZodError } from 'zod'
import {
  sanitizeInput,
  validateBriefPrompt,
  isValidCreditPackage,
  generateBriefSchema,
  buyCreditSchema,
  csrfActionSchema,
} from '../validation'

// ---------------------------------------------------------------------------
// sanitizeInput
// ---------------------------------------------------------------------------
describe('sanitizeInput', () => {
  it('returns the input unchanged when it is already clean', () => {
    expect(sanitizeInput('Hello world')).toBe('Hello world')
  })

  it('strips HTML tags but keeps inner text content', () => {
    // sanitizeInput removes tag markup, not the text between tags
    expect(sanitizeInput('<script>alert(1)</script>Hello')).toBe('alert(1)Hello')
  })

  it('strips nested / self-closing HTML tags but keeps inner text', () => {
    // The function strips tag syntax; text nodes remain
    expect(sanitizeInput('<b>bold</b> and <img src="x"/>')).toBe('bold and')
  })

  it('collapses 3+ consecutive newlines to 2', () => {
    const input = 'line1\n\n\n\nline2'
    expect(sanitizeInput(input)).toBe('line1\n\nline2')
  })

  it('collapses 3+ consecutive spaces to 2', () => {
    const input = 'foo    bar'
    expect(sanitizeInput(input)).toBe('foo  bar')
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('   hello   ')).toBe('hello')
  })

  it('handles an empty string without throwing', () => {
    expect(sanitizeInput('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// generateBriefSchema
// ---------------------------------------------------------------------------
describe('generateBriefSchema', () => {
  it('accepts a valid prompt', () => {
    const result = generateBriefSchema.safeParse({ prompt: 'Build a SaaS app' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty prompt', () => {
    const result = generateBriefSchema.safeParse({ prompt: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a prompt exceeding 5000 characters', () => {
    const result = generateBriefSchema.safeParse({ prompt: 'a'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('accepts a prompt exactly at the 5000 character limit', () => {
    const result = generateBriefSchema.safeParse({ prompt: 'a'.repeat(5000) })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateBriefPrompt
// ---------------------------------------------------------------------------
describe('validateBriefPrompt', () => {
  it('returns a clean, trimmed string for valid input', () => {
    const result = validateBriefPrompt('  My brief idea  ')
    expect(result).toBe('My brief idea')
  })

  it('strips HTML tags from the prompt', () => {
    const result = validateBriefPrompt('<b>Important</b> brief')
    expect(result).toBe('Important brief')
  })

  it('throws a ZodError when the prompt is empty', () => {
    expect(() => validateBriefPrompt('')).toThrow(ZodError)
  })

  it('throws a ZodError when the prompt is too long', () => {
    expect(() => validateBriefPrompt('a'.repeat(5001))).toThrow(ZodError)
  })

  it('throws a ZodError when input is not a string', () => {
    expect(() => validateBriefPrompt(42)).toThrow(ZodError)
  })

  it('throws a ZodError when input is null', () => {
    expect(() => validateBriefPrompt(null)).toThrow(ZodError)
  })
})

// ---------------------------------------------------------------------------
// buyCreditSchema
// ---------------------------------------------------------------------------
describe('buyCreditSchema', () => {
  const validPackages = [5, 10, 25, 50, 100]

  it.each(validPackages)('accepts valid credit package: %i', (credits) => {
    const result = buyCreditSchema.safeParse({ credits })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid credit amount (e.g. 15)', () => {
    const result = buyCreditSchema.safeParse({ credits: 15 })
    expect(result.success).toBe(false)
  })

  it('rejects zero credits', () => {
    const result = buyCreditSchema.safeParse({ credits: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative credits', () => {
    const result = buyCreditSchema.safeParse({ credits: -10 })
    expect(result.success).toBe(false)
  })

  it('rejects a float credit value', () => {
    const result = buyCreditSchema.safeParse({ credits: 10.5 })
    expect(result.success).toBe(false)
  })

  it('rejects a string instead of number', () => {
    const result = buyCreditSchema.safeParse({ credits: '10' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// csrfActionSchema
// ---------------------------------------------------------------------------
describe('csrfActionSchema', () => {
  it('accepts a valid non-empty CSRF token', () => {
    const result = csrfActionSchema.safeParse({ csrfToken: 'abc123' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty CSRF token', () => {
    const result = csrfActionSchema.safeParse({ csrfToken: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing CSRF token field', () => {
    const result = csrfActionSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isValidCreditPackage
// ---------------------------------------------------------------------------
describe('isValidCreditPackage', () => {
  it('returns true for each valid package size', () => {
    expect(isValidCreditPackage(5)).toBe(true)
    expect(isValidCreditPackage(10)).toBe(true)
    expect(isValidCreditPackage(25)).toBe(true)
    expect(isValidCreditPackage(50)).toBe(true)
    expect(isValidCreditPackage(100)).toBe(true)
  })

  it('returns false for an arbitrary number not in the list', () => {
    expect(isValidCreditPackage(7)).toBe(false)
    expect(isValidCreditPackage(0)).toBe(false)
    expect(isValidCreditPackage(-5)).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isValidCreditPackage('10')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isValidCreditPackage(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isValidCreditPackage(undefined)).toBe(false)
  })
})
