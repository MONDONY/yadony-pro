// tests/unit/features/ratings/useRatings.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSvc = {
  rateSender: vi.fn(),
  getPendingRating: vi.fn(),
  getMyReceivedRatings: vi.fn(),
}

vi.mock('@/features/ratings/services/ratingsService', () => ({
  ratingsService: () => mockSvc,
}))

async function importComposable() {
  const mod = await import('@/features/ratings/composables/useRatings')
  return mod.useRatings
}

const summary = {
  averageRating: 4.5, ratingCount: 2, distribution: { 5: 1, 4: 1 },
  ratings: [], page: 0, totalPages: 1,
}

describe('useRatings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchPending charge la notation en attente', async () => {
    mockSvc.getPendingRating.mockResolvedValue({ bidId: 'b1', otherPartyName: 'Alice', otherPartyId: 'u2', deliveredAt: '2026-07-10', isTravelerRating: true })
    const useRatings = (await importComposable())
    const { pending, fetchPending } = useRatings()
    await fetchPending()
    expect(pending.value?.bidId).toBe('b1')
  })

  it('fetchReceived charge le résumé des notes reçues', async () => {
    mockSvc.getMyReceivedRatings.mockResolvedValue(summary)
    const { received, fetchReceived } = (await importComposable())()
    await fetchReceived()
    expect(received.value?.averageRating).toBe(4.5)
  })

  it('fetchReceived pose une erreur en cas d’échec', async () => {
    mockSvc.getMyReceivedRatings.mockRejectedValue(new Error('boom'))
    const { error, fetchReceived } = (await importComposable())()
    await fetchReceived()
    expect(error.value).toBe('Impossible de charger tes notes.')
  })

  it('submitRating note puis recharge la notation en attente', async () => {
    mockSvc.rateSender.mockResolvedValue(undefined)
    mockSvc.getPendingRating.mockResolvedValue(null)
    const { pending, submitRating, isSubmitting } = (await importComposable())()
    expect(isSubmitting.value).toBe(false)
    await submitRating('b1', 5, 'Nickel')
    expect(mockSvc.rateSender).toHaveBeenCalledWith('b1', 5, 'Nickel')
    expect(mockSvc.getPendingRating).toHaveBeenCalled()
    expect(pending.value).toBeNull()
  })
})
