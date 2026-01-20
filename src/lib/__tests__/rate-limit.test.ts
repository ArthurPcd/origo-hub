/**
 * rate-limit.ts — unit tests
 *
 * Tests the in-memory fallback path (no Upstash env vars set).
 */

// Ensure env vars are NOT set so we test the in-memory path
delete process.env.UPSTASH_REDIS_REST_URL
delete process.env.UPSTASH_REDIS_REST_TOKEN

import {
  checkGenerateRateLimit,
  checkActivateRateLimit,
  checkCheckoutRateLimit,
  checkRateLimit,
  addRateLimitHeaders,
} from '../rate-limit'

describe('checkRateLimit (legacy sync helper)', () => {
  it('allows requests within limit', () => {
    const id = `test-${Math.random()}`
    const result = checkRateLimit(id, 3, 60_000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('blocks after limit is exceeded', () => {
    const id = `test-${Math.random()}`
    checkRateLimit(id, 2, 60_000)
    checkRateLimit(id, 2, 60_000)
    const result = checkRateLimit(id, 2, 60_000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })
})

describe('checkGenerateRateLimit (async, in-memory)', () => {
  it('allows first request', async () => {
    const result = await checkGenerateRateLimit(`gen-${Math.random()}`)
    expect(result.success).toBe(true)
  })

  it('blocks after 5 requests', async () => {
    const id = `gen-${Math.random()}`
    for (let i = 0; i < 5; i++) await checkGenerateRateLimit(id)
    const result = await checkGenerateRateLimit(id)
    expect(result.success).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })
})

describe('checkActivateRateLimit (async, in-memory)', () => {
  it('allows first request', async () => {
    const result = await checkActivateRateLimit(`act-${Math.random()}`)
    expect(result.success).toBe(true)
  })
})

describe('checkCheckoutRateLimit (async, in-memory)', () => {
  it('allows first request', async () => {
    const result = await checkCheckoutRateLimit(`chk-${Math.random()}`)
    expect(result.success).toBe(true)
  })
})

describe('addRateLimitHeaders', () => {
  it('sets expected headers', () => {
    const headers = new Headers()
    addRateLimitHeaders(headers, { success: true, remaining: 4, resetTime: Date.now() + 60_000 }, 5)
    expect(headers.get('X-RateLimit-Limit')).toBe('5')
    expect(headers.get('X-RateLimit-Remaining')).toBe('4')
  })

  it('sets Retry-After when provided', () => {
    const headers = new Headers()
    addRateLimitHeaders(headers, { success: false, remaining: 0, resetTime: Date.now() + 30_000, retryAfter: 30 }, 5)
    expect(headers.get('Retry-After')).toBe('30')
  })
})
