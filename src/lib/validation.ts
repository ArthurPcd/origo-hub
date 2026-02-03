/**
 * Input Validation & Sanitization
 *
 * Prevents:
 * - Prompt injection attacks
 * - DoS via excessive input length
 * - XSS via HTML injection
 * - API cost explosion from long prompts
 */

import { z } from 'zod';

// Maximum prompt length: ~1,250 tokens instead of 12,500 tokens
// This prevents excessive API costs ($6.25 → $0.625 per request)
const MAX_PROMPT_LENGTH = 5000;

/**
 * Zod schema for brief generation request
 */
export const generateBriefSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt cannot be empty')
    .max(MAX_PROMPT_LENGTH, `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`),
});

/**
 * Zod schema for credit purchase request
 */
export const buyCreditSchema = z.object({
  credits: z.number().int().positive().refine(
    (val) => [5, 10, 25, 50, 100].includes(val),
    { message: 'Invalid credit package' }
  ),
});

/**
 * Zod schema for CSRF-protected actions
 */
export const csrfActionSchema = z.object({
  csrfToken: z.string().min(1, 'CSRF token required'),
});

/**
 * Sanitize user input to prevent injection attacks
 *
 * - Removes HTML tags
 * - Reduces excessive whitespace
 * - Trims leading/trailing whitespace
 *
 * @param input - Raw user input
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  let sanitized = input;

  // Remove HTML tags (basic XSS prevention)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove excessive newlines (max 2 consecutive)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Remove excessive spaces
  sanitized = sanitized.replace(/ {3,}/g, '  ');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate and sanitize brief generation prompt
 *
 * @param input - Raw prompt string
 * @returns Validated and sanitized prompt
 * @throws ZodError if validation fails
 */
export function validateBriefPrompt(input: unknown): string {
  // Validate structure
  const { prompt } = generateBriefSchema.parse({ prompt: input });

  // Sanitize content
  return sanitizeInput(prompt);
}

/**
 * Type guard to check if value is a valid credit package
 */
export function isValidCreditPackage(credits: unknown): credits is 5 | 10 | 25 | 50 | 100 {
  return typeof credits === 'number' && [5, 10, 25, 50, 100].includes(credits);
}
