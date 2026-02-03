/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Prevents malicious websites from triggering actions on behalf of authenticated users.
 *
 * How it works:
 * 1. Generate a random token and store it in an HTTP-only cookie
 * 2. Client includes this token in critical action requests
 * 3. Server validates token matches the cookie before processing
 *
 * Protected actions:
 * - Account deletion
 * - Subscription cancellation
 * - Password changes
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const TOKEN_LENGTH = 32; // 256 bits

/**
 * Generate a new CSRF token and store it in a cookie
 *
 * Call this in page components or API routes that need CSRF protection
 *
 * @returns The generated CSRF token (to include in forms/requests)
 */
export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Get the current CSRF token from cookies
 *
 * Use this in server components to read the token
 *
 * @returns The CSRF token or null if not set
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Validate a CSRF token against the stored cookie
 *
 * Call this in API routes before processing critical actions
 *
 * @param token - The CSRF token from the client request
 * @returns true if valid, false otherwise
 */
export async function validateCSRFToken(token: string | null | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const storedToken = await getCSRFToken();

  if (!storedToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}

/**
 * Delete the CSRF token cookie
 *
 * Call this after successful critical action or on logout
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}
