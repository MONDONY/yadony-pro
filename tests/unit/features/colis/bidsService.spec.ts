import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

describe('bidsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('listBids calls GET /travelers/me/bids with empty query by default', async () => {
    mockApiFn.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 })
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const svc = bidsService()
    const result = await svc.listBids()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/bids', { query: {} })
    expect(result.content).toEqual([])
  })

  it('listBids appends status query param when statusFilter is not TOUS', async () => {
    mockApiFn.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 })
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const svc = bidsService()
    await svc.listBids({ statusFilter: 'PENDING' })
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/bids', {
      query: { status: 'PENDING' },
    })
  })

  it('listBids appends tripId query param when provided', async () => {
    mockApiFn.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 })
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const svc = bidsService()
    await svc.listBids({ tripId: 'trip-42' })
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/bids', {
      query: { tripId: 'trip-42' },
    })
  })

  it('acceptBid calls PUT /bids/:id/accept', async () => {
    mockApiFn.mockResolvedValue({ id: 'bid-1', status: 'ACCEPTED' })
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const svc = bidsService()
    await svc.acceptBid('bid-1')
    expect(mockApiFn).toHaveBeenCalledWith('/bids/bid-1/accept', { method: 'PUT' })
  })

  it('rejectBid calls PUT /bids/:id/reject', async () => {
    mockApiFn.mockResolvedValue({ id: 'bid-1', status: 'REFUSED' })
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const svc = bidsService()
    await svc.rejectBid('bid-1')
    expect(mockApiFn).toHaveBeenCalledWith('/bids/bid-1/reject', { method: 'PUT' })
  })
})
