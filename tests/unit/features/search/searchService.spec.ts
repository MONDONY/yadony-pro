// tests/unit/features/search/searchService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/search/services/searchService')
  return mod.searchService
}

const bidsPage = {
  content: [
    {
      id: 'bid-1', announcementId: 'trip-9', senderId: 's1', senderName: 'Alice Ba',
      weightKg: 5, declaredValueEur: 100, description: 'Vêtements', contentCategory: null,
      status: 'IN_TRANSIT', departureCity: 'Paris', arrivalCity: 'Dakar',
      departureDate: '2026-08-01', pricePerKg: 8, createdAt: '2026-07-01', paymentMethod: null,
    },
  ],
  totalElements: 1, totalPages: 1, number: 0, size: 5,
}

const tripsPage = {
  content: [
    {
      id: 'trip-9', travelerId: 't1', departureCity: 'Paris', arrivalCity: 'Dakar',
      departureDate: '2026-08-01', departureTime: null, arrivalTime: null,
      pickupAddress: { label: 'CDG', lat: 0, lng: 0 }, deliveryAddress: { label: 'DKR', lat: 0, lng: 0 },
      availableKg: 10, totalKg: 20, pricePerKg: 8, transportMode: 'PLANE', status: 'ACTIVE',
      pendingBidCount: 0, confirmedParcelCount: 2, senderNote: null,
      acceptedContentTypes: [], refusedTypes: [], acceptedPaymentMethods: [], cashAccepted: false,
      createdAt: '2026-07-01', updatedAt: '2026-07-01',
    },
  ],
  totalElements: 1, totalPages: 1, number: 0, size: 5,
}

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('searchBids interroge GET /travelers/me/bids avec q et size limité', async () => {
    mockApiFn.mockResolvedValue(bidsPage)
    const svc = (await importService())()
    const results = await svc.searchBids('Alice')
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/bids', { query: { q: 'Alice', size: '5' } })
    expect(results).toEqual([
      {
        id: 'bid-1',
        type: 'colis',
        title: 'Alice Ba — Vêtements',
        subtitle: 'Paris → Dakar · En transit',
        to: '/colis?bid=bid-1',
      },
    ])
  })

  it('searchTrips interroge GET /announcements/my avec q et size limité', async () => {
    mockApiFn.mockResolvedValue(tripsPage)
    const svc = (await importService())()
    const results = await svc.searchTrips('Dakar')
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/my', { query: { q: 'Dakar', size: '5' } })
    expect(results).toEqual([
      {
        id: 'trip-9',
        type: 'trajet',
        title: 'Paris → Dakar',
        subtitle: '1 août 2026 · 2 colis confirmés',
        to: '/trajets/trip-9',
      },
    ])
  })

  it('searchTracking interroge GET /tracking/search avec number', async () => {
    mockApiFn.mockResolvedValue({
      trackingNumber: 'DON-42X', bidId: 'bid-7', departureCity: 'Paris', arrivalCity: 'Abidjan',
      currentStep: 'IN_TRANSIT', stepLabel: 'En transit', paymentStatus: 'ESCROWED',
    })
    const svc = (await importService())()
    const result = await svc.searchTracking('DON-42X')
    expect(mockApiFn).toHaveBeenCalledWith('/tracking/search', { query: { number: 'DON-42X' } })
    expect(result).toEqual({
      id: 'bid-7',
      type: 'tracking',
      title: 'DON-42X',
      subtitle: 'Paris → Abidjan · En transit',
      to: '/colis?bid=bid-7',
    })
  })

  it('searchTracking renvoie null quand le code est introuvable', async () => {
    mockApiFn.mockRejectedValue(new Error('404'))
    const svc = (await importService())()
    const result = await svc.searchTracking('INCONNU')
    expect(result).toBeNull()
  })

  it('searchAll agrège les trois sources et tolère les échecs partiels', async () => {
    mockApiFn.mockImplementation((path: string) => {
      if (path === '/travelers/me/bids') return Promise.resolve(bidsPage)
      if (path === '/announcements/my') return Promise.reject(new Error('boom'))
      if (path === '/tracking/search') return Promise.reject(new Error('404'))
      return Promise.reject(new Error('inattendu'))
    })
    const svc = (await importService())()
    const results = await svc.searchAll('DON-42X')
    expect(results.colis).toHaveLength(1)
    expect(results.trajets).toEqual([])
    expect(results.tracking).toBeNull()
  })

  it("searchAll ne tente pas le tracking quand la requête ne ressemble pas à un code", async () => {
    mockApiFn.mockImplementation((path: string) => {
      if (path === '/tracking/search') return Promise.reject(new Error('ne devrait pas être appelé'))
      return Promise.resolve({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5 })
    })
    const svc = (await importService())()
    await svc.searchAll('Alice Ba')
    const trackingCalls = mockApiFn.mock.calls.filter(([p]) => p === '/tracking/search')
    expect(trackingCalls).toHaveLength(0)
  })
})
