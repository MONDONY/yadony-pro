import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

describe('tripsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('listTrips calls /announcements with no query when filter is TOUS', async () => {
    mockApiFn.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 })
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const result = await svc.listTrips({ filter: 'TOUS' })
    expect(mockApiFn).toHaveBeenCalledWith('/announcements', { query: {} })
    expect(result.content).toEqual([])
  })

  it('listTrips maps ACTIFS filter to status=ACTIVE', async () => {
    mockApiFn.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 })
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    await svc.listTrips({ filter: 'ACTIFS', page: 0, size: 20 })
    expect(mockApiFn).toHaveBeenCalledWith('/announcements', {
      query: { status: 'ACTIVE', page: '0', size: '20' },
    })
  })

  it('createAnnouncement POSTs to /announcements', async () => {
    const fakeTrip = { id: 'trip-1', status: 'PUBLISHED' }
    mockApiFn.mockResolvedValue(fakeTrip)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const payload = {
      departureCityId: 'paris-id', departureCityLabel: 'Paris', departureLat: 48.85, departureLng: 2.35,
      arrivalCityId: 'dakar-id', arrivalCityLabel: 'Dakar', arrivalLat: 14.69, arrivalLng: -17.44,
      departureDate: '2026-06-01', departureTime: null, arrivalTime: null, transportMode: 'AVION' as const,
      pickupPlaceId: 'p1', pickupPlaceLabel: '12 rue de la Paix', pickupLat: 48.86, pickupLng: 2.33,
      dropoffPlaceId: 'p2', dropoffPlaceLabel: 'Aéroport CDG', dropoffLat: 49.01, dropoffLng: 2.55,
      availableWeightKg: 15, pricePerKg: 7, acceptedCategories: ['Vêtements'], refusedCategories: [],
      senderNote: null, cashAccepted: false, status: 'PUBLISHED' as const,
    }
    const result = await svc.createAnnouncement(payload)
    expect(mockApiFn).toHaveBeenCalledWith('/announcements', { method: 'POST', body: payload })
    expect(result).toEqual(fakeTrip)
  })

  it('getTemplates fetches 10 most recent announcements', async () => {
    const trips = [{ id: 't1' }, { id: 't2' }]
    mockApiFn.mockResolvedValue({ content: trips, totalElements: 2, totalPages: 1, number: 0, size: 10 })
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const result = await svc.getTemplates()
    expect(mockApiFn).toHaveBeenCalledWith('/announcements', { query: { size: '10', sort: 'createdAt,desc' } })
    expect(result).toEqual(trips)
  })

  it('getAnnouncement fetches GET /announcements/:id', async () => {
    const fakeDetail = {
      id: 'trip-42',
      travelerId: 'user-1',
      departureCity: 'Paris',
      arrivalCity: 'Dakar',
      departureDate: '2026-08-01',
      departureTime: '10:00',
      arrivalTime: null,
      pickupAddress: { label: '12 rue de la Paix', lat: 48.86, lng: 2.33 },
      deliveryAddress: { label: 'Aéroport CDG', lat: 49.01, lng: 2.55 },
      availableKg: 15,
      totalKg: 20,
      pricePerKg: 8,
      transportMode: 'PLANE',
      status: 'ACTIVE',
      pendingBidCount: 3,
      confirmedParcelCount: 1,
      senderNote: null,
      acceptedContentTypes: [],
      refusedTypes: [],
      acceptedPaymentMethods: ['STRIPE'],
      cashAccepted: false,
      createdAt: '2026-05-01T12:00:00',
      updatedAt: '2026-05-01T12:00:00',
      bidsCount: 4,
      traveler: null,
    }
    mockApiFn.mockResolvedValue(fakeDetail)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const result = await svc.getAnnouncement('trip-42')
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/trip-42', {})
    expect(result.id).toBe('trip-42')
    expect(result.availableWeightKg).toBe(15)
    expect(result.usedWeightKg).toBe(5)
  })

  it('updateAnnouncement sends PUT /announcements/:id', async () => {
    const fakeDetail = {
      id: 'trip-42', travelerId: 'u1', departureCity: 'Lyon', arrivalCity: 'Abidjan',
      departureDate: '2026-09-01', departureTime: null, arrivalTime: null,
      pickupAddress: { label: 'Gare de Lyon', lat: 45.74, lng: 4.83 },
      deliveryAddress: { label: 'Aéroport LYAB', lat: 45.73, lng: 5.08 },
      availableKg: 10, totalKg: 10, pricePerKg: 9, transportMode: 'TRAIN',
      status: 'ACTIVE', pendingBidCount: 0, confirmedParcelCount: 0,
      senderNote: null, acceptedContentTypes: [], refusedTypes: [],
      acceptedPaymentMethods: ['STRIPE'], cashAccepted: false,
      createdAt: '2026-05-01T12:00:00', updatedAt: '2026-05-01T12:00:00',
      bidsCount: 0, traveler: null,
    }
    mockApiFn.mockResolvedValue(fakeDetail)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const payload = {
      departureCity: 'Lyon', arrivalCity: 'Abidjan', departureDate: '2026-09-01',
      departureTime: null, arrivalTime: null, transportMode: 'TRAIN' as const,
      pickupAddress: { label: 'Gare de Lyon', lat: 45.74, lng: 4.83 },
      deliveryAddress: { label: 'Aéroport LYAB', lat: 45.73, lng: 5.08 },
      availableKg: 10, pricePerKg: 9, description: null,
      acceptedContentTypes: [], refusedTypes: [], acceptedPaymentMethods: ['STRIPE'],
    }
    const result = await svc.updateAnnouncement('trip-42', payload)
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/trip-42', { method: 'PUT', body: payload })
    expect(result.id).toBe('trip-42')
  })

  it('deleteAnnouncement sends DELETE /announcements/:id', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    await svc.deleteAnnouncement('trip-42')
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/trip-42', { method: 'DELETE' })
  })

  it('getAnnouncementBids fetches GET /announcements/:id/bids and maps response', async () => {
    const fakeBid = {
      id: 'bid-1', announcementId: 'trip-42', senderId: 'sender-1',
      senderName: 'Alice Martin', senderTotalShipments: 5,
      weightKg: 3, declaredValueEur: 50, description: 'Vêtements',
      contentCategory: null, status: 'PAYMENT_ESCROWED',
      departureCity: 'Paris', arrivalCity: 'Dakar',
      departureDate: '2026-08-01', pricePerKg: 8, createdAt: '2026-06-01T10:00:00',
      paymentMethod: 'STRIPE',
    }
    mockApiFn.mockResolvedValue([fakeBid])
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const result = await svc.getAnnouncementBids('trip-42')
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/trip-42/bids', {})
    expect(result).toHaveLength(1)
    expect(result[0].senderName).toBe('Alice Martin')
    expect(result[0].senderInitials).toBe('AM')
    expect(result[0].weightKg).toBe(3)
    expect(result[0].paymentAmountEuros).toBe(24)
    expect(result[0].earningsEuros).toBe(21.12)
  })

  it('acceptBid sends PUT /bids/:id/accept', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    await svc.acceptBid('bid-99')
    expect(mockApiFn).toHaveBeenCalledWith('/bids/bid-99/accept', { method: 'PUT' })
  })

  it('rejectBid sends PUT /bids/:id/reject', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    await svc.rejectBid('bid-99')
    expect(mockApiFn).toHaveBeenCalledWith('/bids/bid-99/reject', { method: 'PUT' })
  })
})
