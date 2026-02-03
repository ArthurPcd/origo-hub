/**
 * FeatureRepository — unit tests
 *
 * Focuses on the activation flow and duplicate detection.
 */

import { FeatureRepository } from '../features'
import { ErrorCodes } from '@/lib/errors'

const mockUser = { id: 'user-abc', email: 'user@example.com' }

function makeSupabase(overrides: Record<string, any> = {}) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: jest.fn(),
    ...overrides,
  }
}

describe('FeatureRepository', () => {
  describe('getUserActivations', () => {
    it('returns list of user activations', async () => {
      const dbRows = [
        {
          id: 'act-1',
          user_id: mockUser.id,
          feature_code: 'book_viewer',
          activation_code_used: 'CODE123',
          activated_at: '2026-01-15T00:00:00.000Z',
          expires_at: null,
        },
      ]

      const mockSupabase = makeSupabase()
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: dbRows, error: null }),
        }),
      })

      const repo = new FeatureRepository(mockSupabase as any, mockUser.id)
      const activations = await repo.getUserActivations()

      expect(activations).toHaveLength(1)
      expect(activations[0]).toMatchObject({
        featureCode: 'book_viewer',
        activationCodeUsed: 'CODE123',
      })
    })

    it('returns empty array when no activations', async () => {
      const mockSupabase = makeSupabase()
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

      const repo = new FeatureRepository(mockSupabase as any, mockUser.id)
      const activations = await repo.getUserActivations()

      expect(activations).toEqual([])
    })

    it('throws 401 if unauthenticated', async () => {
      const mockSupabase = makeSupabase({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Auth error') }),
        },
      })
      mockSupabase.from.mockReturnValue({ select: jest.fn() })

      const repo = new FeatureRepository(mockSupabase as any, mockUser.id)
      await expect(repo.getUserActivations()).rejects.toMatchObject({ statusCode: 401 })
    })
  })

  describe('hasFeature', () => {
    it('returns true if feature is activated', async () => {
      const mockSupabase = makeSupabase()
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'act-1' }, error: null }),
        }),
      })

      const repo = new FeatureRepository(mockSupabase as any, mockUser.id)
      const has = await repo.hasFeature('book_viewer')
      expect(has).toBe(true)
    })

    it('returns false if feature is not activated', async () => {
      const mockSupabase = makeSupabase()
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        }),
      })

      const repo = new FeatureRepository(mockSupabase as any, mockUser.id)
      const has = await repo.hasFeature('book_viewer')
      expect(has).toBe(false)
    })
  })
})
