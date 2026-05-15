import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    get: mockGet,
    post: mockPost,
  }),
}))

async function importService() {
  const mod = await import('@/features/demandes/services/matchingService')
  return mod.matchingService
}

describe('matchingService', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGet.mockReset()
    mockPost.mockReset()
  })

  it('fetchMatchingRequests calls GET /travelers/me/matching-requests', async () => {
    mockGet.mockResolvedValue([])
    const matchingService = await importService()
    const svc = matchingService()
    const result = await svc.fetchMatchingRequests()
    expect(mockGet).toHaveBeenCalledWith('/travelers/me/matching-requests')
    expect(result).toEqual([])
  })

  it('fetchMatchingRequests returns array of MatchingRequest', async () => {
    const fakeReqs = [
      { id: 'r1', tripId: 't1', tripCorridor: 'Paris → Dakar', matchScore: 95 },
    ]
    mockGet.mockResolvedValue(fakeReqs)
    const matchingService = await importService()
    const svc = matchingService()
    const result = await svc.fetchMatchingRequests()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r1')
  })

  it('inviteRequest calls POST /travelers/me/invite with payload', async () => {
    mockPost.mockResolvedValue({})
    const matchingService = await importService()
    const svc = matchingService()
    await svc.inviteRequest('req-1', 'trip-42')
    expect(mockPost).toHaveBeenCalledWith('/travelers/me/invite', {
      body: { requestId: 'req-1', announcementId: 'trip-42' },
    })
  })

  it('inviteRequest resolves without error on success', async () => {
    mockPost.mockResolvedValue({})
    const matchingService = await importService()
    const svc = matchingService()
    await expect(svc.inviteRequest('req-1', 'trip-42')).resolves.toBeUndefined()
  })

  it('inviteRequest propagates error on failure', async () => {
    mockPost.mockRejectedValue(new Error('Server error'))
    const matchingService = await importService()
    const svc = matchingService()
    await expect(svc.inviteRequest('req-1', 'trip-42')).rejects.toThrow('Server error')
  })
})
