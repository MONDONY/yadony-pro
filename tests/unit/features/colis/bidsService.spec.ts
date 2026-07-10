import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

let mockCommissionRate = 0.12
vi.mock('@/composables/useCommissionRate', () => ({
  useCommissionRate: () => ({ getRate: async () => mockCommissionRate }),
}))

describe('bidsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCommissionRate = 0.12
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

  const backendBid = (over: Record<string, unknown> = {}) => ({
    id: 'b1',
    announcementId: 'a1',
    senderId: 's1',
    senderName: 'abou',
    senderTotalShipments: 3,
    weightKg: 10,
    declaredValueEur: 100,
    description: 'Vêtements',
    contentCategory: null,
    status: 'COMPLETED',
    departureCity: 'Paris',
    arrivalCity: 'Abidjan',
    departureDate: '2026-06-10',
    pricePerKg: 8,
    createdAt: '2026-06-01',
    paymentMethod: null,
    trackingNumber: 'DON-X',
    trackingToken: null,
    ...over,
  })

  async function mapFirst(over: Record<string, unknown> = {}) {
    mockApiFn.mockResolvedValue({
      content: [backendBid(over)],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
    })
    const { bidsService } = await import('@/features/colis/services/bidsService')
    return (await bidsService().listBids()).content[0]
  }

  it('calcule poids et revenus quand le poids est présent', async () => {
    const bid = await mapFirst()
    expect(bid.weightKg).toBe(10)
    expect(bid.paymentAmountEuros).toBe(80) // 8 €/kg × 10 kg
    expect(bid.earningsEuros).toBe(70.4) // 80 × 0,88 (commission 12 %)
    expect(bid.sender.name).toBe('abou')
  })

  it('laisse poids et revenus à null quand le poids est absent (évite NaN)', async () => {
    const bid = await mapFirst({ weightKg: null })
    expect(bid.weightKg).toBeNull()
    expect(bid.paymentAmountEuros).toBeNull()
    expect(bid.earningsEuros).toBeNull()
  })

  it('laisse poids à null quand le champ weightKg est absent du DTO', async () => {
    const bid = await mapFirst({ weightKg: undefined })
    expect(bid.weightKg).toBeNull()
    expect(bid.earningsEuros).toBeNull()
  })

  it('utilise le taux de commission dynamique (pas de 0,88 en dur)', async () => {
    mockCommissionRate = 0.2
    const bid = await mapFirst()
    expect(bid.earningsEuros).toBe(64) // 80 × (1 − 0,20)
  })

  it('applique aussi le taux dynamique sur acceptBid', async () => {
    mockCommissionRate = 0.2
    mockApiFn.mockResolvedValue(backendBid())
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const bid = await bidsService().acceptBid('b1')
    expect(bid.earningsEuros).toBe(64)
  })
})
