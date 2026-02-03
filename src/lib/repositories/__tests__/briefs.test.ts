/**
 * BriefRepository — unit tests
 *
 * All Supabase calls are mocked so these tests run without a real DB.
 */

import { BriefRepository } from '../briefs'

const mockUser = { id: 'user-123', email: 'test@example.com' }

function makeMockSupabase(overrides: Record<string, any> = {}) {
  const base = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: jest.fn(),
  }
  return { ...base, ...overrides }
}

describe('BriefRepository', () => {
  describe('mapDbToBrief (via list)', () => {
    it('maps snake_case DB row to camelCase Brief', async () => {
      const dbRow = {
        id: 'brief-1',
        title: 'Test Brief',
        project_type: 'web',
        answers: { projectType: 'web', clientInfo: 'Acme', goals: '', targetAudience: '', deliverables: '', timeline: '', budget: '', constraints: '' },
        content: '# Brief content',
        created_at: '2026-01-01T00:00:00.000Z',
        folder_id: 'folder-1',
        skin_id: null,
        custom_logo_url: null,
        custom_title: null,
        book_viewer_enabled: false,
      }

      const mockSupabase = makeMockSupabase()
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [dbRow], error: null }),
          }),
        }),
      })

      const repo = new BriefRepository(mockSupabase as any, mockUser.id)
      const briefs = await repo.list()

      expect(briefs).toHaveLength(1)
      expect(briefs[0]).toMatchObject({
        id: 'brief-1',
        title: 'Test Brief',
        projectType: 'web',
        content: '# Brief content',
        createdAt: '2026-01-01T00:00:00.000Z',
        folderId: 'folder-1',
        bookViewerEnabled: false,
      })
    })
  })

  describe('list', () => {
    it('returns empty array when no briefs exist', async () => {
      const mockSupabase = makeMockSupabase()
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      })

      const repo = new BriefRepository(mockSupabase as any, mockUser.id)
      const briefs = await repo.list()

      expect(briefs).toEqual([])
    })

    it('throws 401 when user is not authenticated', async () => {
      const mockSupabase = makeMockSupabase({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') }),
        },
      })
      mockSupabase.from.mockReturnValue({ select: jest.fn() })

      const repo = new BriefRepository(mockSupabase as any, mockUser.id)

      await expect(repo.list()).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it('throws on DB error', async () => {
      const mockSupabase = makeMockSupabase()
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      })

      const repo = new BriefRepository(mockSupabase as any, mockUser.id)
      await expect(repo.list()).rejects.toBeDefined()
    })
  })
})
