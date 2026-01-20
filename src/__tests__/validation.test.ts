import { ZodError } from 'zod';
import {
  generateBriefSchema,
  buyCreditSchema,
  csrfActionSchema,
  sanitizeInput,
  validateBriefPrompt,
  isValidCreditPackage,
} from '@/lib/validation';

// ---------------------------------------------------------------------------
// generateBriefSchema
// ---------------------------------------------------------------------------
describe('generateBriefSchema', () => {
  it('accepts a valid prompt', () => {
    const result = generateBriefSchema.parse({ prompt: 'Create a landing page' });
    expect(result.prompt).toBe('Create a landing page');
  });

  it('rejects an empty prompt', () => {
    expect(() => generateBriefSchema.parse({ prompt: '' })).toThrow(ZodError);
  });

  it('rejects a prompt exceeding 5000 characters', () => {
    const longPrompt = 'a'.repeat(5001);
    expect(() => generateBriefSchema.parse({ prompt: longPrompt })).toThrow(ZodError);
  });

  it('accepts a prompt of exactly 5000 characters', () => {
    const maxPrompt = 'a'.repeat(5000);
    const result = generateBriefSchema.parse({ prompt: maxPrompt });
    expect(result.prompt).toHaveLength(5000);
  });
});

// ---------------------------------------------------------------------------
// buyCreditSchema
// ---------------------------------------------------------------------------
describe('buyCreditSchema', () => {
  it.each([5, 10, 25, 50, 100])('accepts valid credit package: %i', (credits) => {
    const result = buyCreditSchema.parse({ credits });
    expect(result.credits).toBe(credits);
  });

  it('rejects an invalid credit amount', () => {
    expect(() => buyCreditSchema.parse({ credits: 7 })).toThrow(ZodError);
  });

  it('rejects zero credits', () => {
    expect(() => buyCreditSchema.parse({ credits: 0 })).toThrow(ZodError);
  });

  it('rejects negative credits', () => {
    expect(() => buyCreditSchema.parse({ credits: -10 })).toThrow(ZodError);
  });

  it('rejects non-integer credits', () => {
    expect(() => buyCreditSchema.parse({ credits: 10.5 })).toThrow(ZodError);
  });

  it('rejects a string instead of a number', () => {
    expect(() => buyCreditSchema.parse({ credits: '10' })).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// csrfActionSchema
// ---------------------------------------------------------------------------
describe('csrfActionSchema', () => {
  it('accepts a valid CSRF token', () => {
    const result = csrfActionSchema.parse({ csrfToken: 'abc123' });
    expect(result.csrfToken).toBe('abc123');
  });

  it('rejects an empty CSRF token', () => {
    expect(() => csrfActionSchema.parse({ csrfToken: '' })).toThrow(ZodError);
  });

  it('rejects missing csrfToken field', () => {
    expect(() => csrfActionSchema.parse({})).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// sanitizeInput
// ---------------------------------------------------------------------------
describe('sanitizeInput', () => {
  it('removes HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
  });

  it('removes self-closing HTML tags', () => {
    expect(sanitizeInput('hello <br/> world')).toBe('hello  world');
  });

  it('collapses more than 2 consecutive newlines to 2', () => {
    expect(sanitizeInput('line1\n\n\n\nline2')).toBe('line1\n\nline2');
  });

  it('preserves exactly 2 consecutive newlines', () => {
    expect(sanitizeInput('line1\n\nline2')).toBe('line1\n\nline2');
  });

  it('collapses 3+ consecutive spaces to 2', () => {
    expect(sanitizeInput('word1   word2')).toBe('word1  word2');
  });

  it('preserves exactly 2 consecutive spaces', () => {
    expect(sanitizeInput('word1  word2')).toBe('word1  word2');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('returns empty string for an all-whitespace input', () => {
    expect(sanitizeInput('   ')).toBe('');
  });

  it('leaves clean text unchanged', () => {
    expect(sanitizeInput('Create a landing page for my SaaS')).toBe(
      'Create a landing page for my SaaS'
    );
  });
});

// ---------------------------------------------------------------------------
// validateBriefPrompt
// ---------------------------------------------------------------------------
describe('validateBriefPrompt', () => {
  it('returns sanitized prompt for valid input', () => {
    const result = validateBriefPrompt('  Create a <b>landing page</b>  ');
    expect(result).toBe('Create a landing page');
  });

  it('throws ZodError for empty string', () => {
    expect(() => validateBriefPrompt('')).toThrow(ZodError);
  });

  it('throws ZodError for prompt longer than 5000 characters', () => {
    expect(() => validateBriefPrompt('x'.repeat(5001))).toThrow(ZodError);
  });

  it('throws ZodError for non-string input', () => {
    expect(() => validateBriefPrompt(42)).toThrow(ZodError);
  });

  it('throws ZodError for null input', () => {
    expect(() => validateBriefPrompt(null)).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// isValidCreditPackage
// ---------------------------------------------------------------------------
describe('isValidCreditPackage', () => {
  it.each([5, 10, 25, 50, 100])('returns true for valid package: %i', (credits) => {
    expect(isValidCreditPackage(credits)).toBe(true);
  });

  it('returns false for an invalid number', () => {
    expect(isValidCreditPackage(7)).toBe(false);
  });

  it('returns false for zero', () => {
    expect(isValidCreditPackage(0)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isValidCreditPackage('10')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidCreditPackage(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidCreditPackage(undefined)).toBe(false);
  });
});
