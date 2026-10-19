import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

const gridContext = {
  grid: { tiers: [{ fromEur: 0, rate: 0.07 }, { fromEur: 100, rate: 0.06 }], minimums: { EUR: 1, XOF: 650 } },
  rate: null,
}
let mockContext: { grid: typeof gridContext.grid | null; rate: number | null } = { grid: null, rate: 0.05 }
vi.mock('@/composables/useCommissionContext', () => ({
  useCommissionContext: () => ({ getContext: async () => mockContext }),
}))

describe('bidsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = { grid: null, rate: 0.05 }
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

  it('listBids ne fabrique pas de note d\'expéditeur : rating null', async () => {
    mockApiFn.mockResolvedValue({
      content: [{
        id: 'b1', announcementId: 't1', senderId: 's1', senderName: 'Fatou', status: 'PENDING',
        departureCity: 'Paris', arrivalCity: 'Dakar', departureDate: '2026-08-01', createdAt: '2026-07-01T10:00:00',
        weightKg: 5, pricePerKg: 8, currency: 'EUR',
      }],
      totalElements: 1, totalPages: 1, number: 0, size: 50,
    })
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const result = await bidsService().listBids()
    expect(result.content[0]!.sender.rating).toBeNull()
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

  it('sans montants du backend : net = prix × poids, total payé par le taux unique', async () => {
    const bid = await mapFirst()
    expect(bid.weightKg).toBe(10)
    expect(bid.earningsEuros).toBe(80) // 8 €/kg × 10 kg : le prix au kilo d'un bid EST le net
    expect(bid.paymentAmountEuros).toBe(84) // 80 × (1 + 5 %)
    expect(bid.sender.name).toBe('abou')
  })

  it('sous grille, le total payé se déduit de la grille (minimum compris)', async () => {
    mockContext = gridContext
    const bid = await mapFirst()
    expect(bid.earningsEuros).toBe(80)
    expect(bid.paymentAmountEuros).toBe(85.6) // 7 % de 80
    const small = await mapFirst({ weightKg: 0.5, pricePerKg: 4 }) // net 2 € : commission 0,14 € relevée au minimum
    expect(small.earningsEuros).toBe(2)
    expect(small.paymentAmountEuros).toBe(3)
  })

  it('laisse le total payé à null sans grille ni taux (jamais un montant inventé)', async () => {
    mockContext = { grid: null, rate: null }
    const bid = await mapFirst()
    expect(bid.earningsEuros).toBe(80)
    expect(bid.paymentAmountEuros).toBeNull()
  })

  it('préfère les montants calculés par le backend au produit local', async () => {
    // Bid négocié : 80 € au barème, mais l'accord est à 60 € brut / 52,80 € net.
    const bid = await mapFirst({ totalSenderAmountEur: 60, totalNetAmountEur: 52.8 })
    expect(bid.paymentAmountEuros).toBe(60)
    expect(bid.earningsEuros).toBe(52.8)
    expect(bid.currency).toBe('EUR')
  })

  it('porte la devise du bid et arrondit le repli local à sa précision', async () => {
    // 5 000 F CFA/kg × 3 kg = 15 000 net ; jamais de centime en XOF.
    const bid = await mapFirst({ currency: 'XOF', pricePerKg: 5000, weightKg: 3 })
    expect(bid.currency).toBe('XOF')
    expect(bid.earningsEuros).toBe(15000)
    expect(bid.paymentAmountEuros).toBe(15750) // 15 000 × (1 + 5 %)
    const odd = await mapFirst({ currency: 'XOF', pricePerKg: 5000.4, weightKg: 1 })
    expect(odd.earningsEuros).toBe(5000)
    mockContext = gridContext
    const grid = await mapFirst({ currency: 'XOF', pricePerKg: 5000, weightKg: 3 })
    expect(grid.paymentAmountEuros).toBe(16050) // 15 000 + 1 050 (7 % de 15 000)
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

  it('utilise le taux unique chargé (pas de taux en dur)', async () => {
    mockContext = { grid: null, rate: 0.2 }
    const bid = await mapFirst()
    expect(bid.paymentAmountEuros).toBe(96) // 80 × (1 + 20 %)
  })

  it('applique aussi le contexte de commission sur acceptBid et rejectBid', async () => {
    mockContext = { grid: null, rate: 0.2 }
    mockApiFn.mockResolvedValue(backendBid())
    const { bidsService } = await import('@/features/colis/services/bidsService')
    expect((await bidsService().acceptBid('b1')).paymentAmountEuros).toBe(96)
    expect((await bidsService().rejectBid('b1')).paymentAmountEuros).toBe(96)
  })

  it('getBid charge GET /bids/:id et mappe la réponse', async () => {
    mockApiFn.mockResolvedValue(backendBid())
    const { bidsService } = await import('@/features/colis/services/bidsService')
    const bid = await bidsService().getBid('b1')
    expect(mockApiFn).toHaveBeenCalledWith('/bids/b1', {})
    expect(bid.id).toBe('b1')
    expect(bid.sender.name).toBe('abou')
  })
})
