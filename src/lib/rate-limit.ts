/**
 * Rate limiter — Upstash Redis (production) with in-memory fallback (dev/local)
 *
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enable Redis mode.
 * Without those vars the module falls back to the in-memory implementation.
 */

/* ─── Upstash (production) ─── */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function buildRedisRatelimit(max: number, windowStr: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`) {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null
  }
  const redis = Redis.fromEnv()
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, windowStr),
    analytics: true,
  })
}

// Dedicated limiters (lazy-created once per cold start)
let _generateLimiter: Ratelimit | null | undefined = undefined
let _activateLimiter: Ratelimit | null | undefined = undefined
let _checkoutLimiter: Ratelimit | null | undefined = undefined

function generateLimiter() {
  if (_generateLimiter === undefined) _generateLimiter = buildRedisRatelimit(5, '1 m')
  return _generateLimiter
}
function activateLimiter() {
  if (_activateLimiter === undefined) _activateLimiter = buildRedisRatelimit(5, '15 m')
  return _activateLimiter
}
function checkoutLimiter() {
  if (_checkoutLimiter === undefined) _checkoutLimiter = buildRedisRatelimit(10, '1 m')
  return _checkoutLimiter
}

/* ─── In-memory fallback ─── */

interface MemEntry {
  count: number
  resetTime: number
}
const memStore = new Map<string, MemEntry>()
// setInterval is not available in all serverless/Edge runtimes — guard before calling
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of memStore) if (now > v.resetTime) memStore.delete(k)
  }, 5 * 60 * 1000)
}

function memCheck(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now > entry.resetTime) {
    memStore.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: max - 1, resetTime: now + windowMs }
  }
  if (entry.count >= max) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }
  entry.count++
  return { success: true, remaining: max - entry.count, resetTime: entry.resetTime }
}

/* ─── Public types ─── */

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/* ─── Public helpers ─── */

async function upstashCheck(
  limiter: Ratelimit,
  identifier: string,
  memFallback: () => RateLimitResult
): Promise<RateLimitResult> {
  try {
    const { success, remaining, reset, pending } = await limiter.limit(identifier)
    // Upstash analytics runs in the background — don't await
    void pending
    return {
      success,
      remaining,
      resetTime: reset,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
    }
  } catch {
    // Redis unreachable — degrade gracefully to in-memory fallback
    console.warn('[rate-limit] Upstash unavailable, falling back to in-memory limiter')
    return memFallback()
  }
}

/** 5 generate calls / minute */
export async function checkGenerateRateLimit(userId: string): Promise<RateLimitResult> {
  const lim = generateLimiter()
  if (lim) return upstashCheck(lim, `generate:${userId}`, () => memCheck(`generate:${userId}`, 5, 60_000))
  return memCheck(`generate:${userId}`, 5, 60_000)
}

/** 5 activation attempts / 15 min */
export async function checkActivateRateLimit(userId: string): Promise<RateLimitResult> {
  const lim = activateLimiter()
  if (lim) return upstashCheck(lim, `activate:${userId}`, () => memCheck(`activate:${userId}`, 5, 15 * 60_000))
  return memCheck(`activate:${userId}`, 5, 15 * 60_000)
}

/** 10 checkout requests / minute */
export async function checkCheckoutRateLimit(userId: string): Promise<RateLimitResult> {
  const lim = checkoutLimiter()
  if (lim) return upstashCheck(lim, `checkout:${userId}`, () => memCheck(`checkout:${userId}`, 10, 60_000))
  return memCheck(`checkout:${userId}`, 10, 60_000)
}

/* ─── Legacy compat (keeps existing callers working) ─── */

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60_000
): RateLimitResult {
  return memCheck(identifier, maxRequests, windowMs)
}

export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  maxRequests: number
): void {
  headers.set('X-RateLimit-Limit', maxRequests.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
  if (result.retryAfter) headers.set('Retry-After', result.retryAfter.toString())
}
