// tests/unit/features/ratings/ratingsService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/ratings/services/ratingsService')
  return mod.ratingsService
}

describe('ratingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('rateSender POSTe /ratings/traveler-to-sender avec bidId, stars et comment', async () => {
    mockApiFn.mockResolvedValue({ id: 'r1', stars: 5 })
    const svc = (await importService())()
    await svc.rateSender('bid-1', 5, 'Très ponctuel')
    expect(mockApiFn).toHaveBeenCalledWith('/ratings/traveler-to-sender', {
      method: 'POST',
      body: { bidId: 'bid-1', stars: 5, comment: 'Très ponctuel' },
    })
  })

  it('rateSender envoie comment null quand vide', async () => {
    mockApiFn.mockResolvedValue({ id: 'r1', stars: 4 })
    const svc = (await importService())()
    await svc.rateSender('bid-1', 4, '')
    expect(mockApiFn).toHaveBeenCalledWith('/ratings/traveler-to-sender', {
      method: 'POST',
      body: { bidId: 'bid-1', stars: 4, comment: null },
    })
  })

  it('getPendingRating renvoie la notation en attente', async () => {
    mockApiFn.mockResolvedValue({
      bidId: 'bid-9', otherPartyName: 'Alice', otherPartyId: 'u2',
      deliveredAt: '2026-07-10T10:00:00', isTravelerRating: true,
    })
    const svc = (await importService())()
    const pending = await svc.getPendingRating()
    expect(mockApiFn).toHaveBeenCalledWith('/ratings/pending', {})
    expect(pending?.bidId).toBe('bid-9')
  })

  it('getPendingRating renvoie null sur 204 (corps vide)', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    const pending = await svc.getPendingRating()
    expect(pending).toBeNull()
  })

  it('getPendingRating renvoie null si le back échoue', async () => {
    mockApiFn.mockRejectedValue(new Error('boom'))
    const svc = (await importService())()
    const pending = await svc.getPendingRating()
    expect(pending).toBeNull()
  })

  it('getMyReceivedRatings interroge GET /ratings/me/received avec pagination', async () => {
    mockApiFn.mockResolvedValue({
      averageRating: 4.6, ratingCount: 12, distribution: { 5: 8, 4: 3, 3: 1 },
      ratings: [{ stars: 5, comment: 'Top', createdAt: '2026-07-01', excluded: false, authorName: 'Alice', authorAvatarUrl: null, departureCity: 'Paris', arrivalCity: 'Dakar' }],
      page: 0, totalPages: 1,
    })
    const svc = (await importService())()
    const res = await svc.getMyReceivedRatings(0, 20)
    expect(mockApiFn).toHaveBeenCalledWith('/ratings/me/received', { query: { page: '0', size: '20' } })
    expect(res.averageRating).toBe(4.6)
    expect(res.ratings).toHaveLength(1)
  })
})
