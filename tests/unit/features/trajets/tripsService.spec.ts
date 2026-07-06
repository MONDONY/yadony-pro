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
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/my', { query: {} })
    expect(result.content).toEqual([])
  })

  it('listTrips maps ACTIFS filter to status=ACTIVE', async () => {
    mockApiFn.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 })
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    await svc.listTrips({ filter: 'ACTIFS', page: 0, size: 20 })
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/my', {
      query: { status: 'ACTIVE', page: '0', size: '20' },
    })
  })

  it('createAnnouncement POSTs to /announcements', async () => {
    const fakeTrip = {
      id: 'trip-1', travelerId: 'u1', departureCity: 'Paris', arrivalCity: 'Dakar',
      departureDate: '2026-06-01', departureTime: null, arrivalTime: null, transportMode: 'PLANE',
      pickupAddress: { label: '12 rue de la Paix', lat: 48.86, lng: 2.33 },
      deliveryAddress: { label: 'Aéroport CDG', lat: 49.01, lng: 2.55 },
      availableKg: 15, totalKg: 15, pricePerKg: 7, status: 'ACTIVE',
      pendingBidCount: 0, confirmedParcelCount: 0, senderNote: null,
      acceptedContentTypes: [], refusedTypes: [], acceptedPaymentMethods: ['STRIPE'],
      cashAccepted: false, createdAt: '2026-05-01T12:00:00', updatedAt: '2026-05-01T12:00:00',
    }
    mockApiFn.mockResolvedValue(fakeTrip)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const payload = {
      departureCity: 'Paris', arrivalCity: 'Dakar',
      departureDate: '2026-06-01', departureTime: null, arrivalTime: null, transportMode: 'PLANE' as const,
      pickupAddress: { label: '12 rue de la Paix', lat: 48.86, lng: 2.33 },
      deliveryAddress: { label: 'Aéroport CDG', lat: 49.01, lng: 2.55 },
      availableKg: 15, pricePerKg: 7, description: null,
      acceptedContentTypes: [], refusedTypes: [], acceptedPaymentMethods: ['STRIPE'],
    }
    const result = await svc.createAnnouncement(payload)
    expect(mockApiFn).toHaveBeenCalledWith('/announcements', { method: 'POST', body: payload })
    expect(result.id).toBe('trip-1')
    expect(result.availableWeightKg).toBe(15)
  })

  it('getTemplates fetches 10 most recent announcements', async () => {
    const minimalTrip = {
      id: 't1', travelerId: 'u1', departureCity: 'Paris', arrivalCity: 'Dakar',
      departureDate: '2026-06-01', departureTime: null, arrivalTime: null, transportMode: 'PLANE',
      pickupAddress: { label: 'Gare du Nord', lat: 48.88, lng: 2.36 },
      deliveryAddress: { label: 'AIBD', lat: 14.73, lng: -17.49 },
      availableKg: 10, totalKg: 10, pricePerKg: 8, status: 'ACTIVE',
      pendingBidCount: 0, confirmedParcelCount: 0, senderNote: null,
      acceptedContentTypes: [], refusedTypes: [], acceptedPaymentMethods: ['STRIPE'],
      cashAccepted: false, createdAt: '2026-05-01T12:00:00', updatedAt: '2026-05-01T12:00:00',
    }
    mockApiFn.mockResolvedValue({ content: [minimalTrip], totalElements: 1, totalPages: 1, number: 0, size: 10 })
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    const result = await svc.getTemplates()
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/my', { query: { size: '10', sort: 'createdAt,desc' } })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t1')
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

  it('getAnnouncement derives cashAccepted from acceptedPaymentMethods when the flag is absent (regression)', async () => {
    const fakeDetail = {
      id: 'trip-cash', travelerId: 'user-1', departureCity: 'Lyon', arrivalCity: 'Bamako',
      departureDate: '2026-06-08', departureTime: null, arrivalTime: '18:00',
      pickupAddress: { label: 'Part-Dieu', lat: 45.76, lng: 4.86 },
      deliveryAddress: { label: 'Hamdallaye', lat: 12.63, lng: -8.0 },
      availableKg: 23, totalKg: 23, pricePerKg: 8,
      transportMode: 'PLANE', status: 'ACTIVE', pendingBidCount: 0, confirmedParcelCount: 0,
      senderNote: null, acceptedContentTypes: [], refusedTypes: [],
      acceptedPaymentMethods: ['STRIPE', 'CASH'],
      // cashAccepted volontairement absent (ancien backend détail)
      createdAt: '2026-05-27T12:00:00', updatedAt: '2026-05-27T12:00:00', bidsCount: 0, traveler: null,
    }
    mockApiFn.mockResolvedValue(fakeDetail)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const result = await tripsService().getAnnouncement('trip-cash')
    expect(result.cashAccepted).toBe(true)
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

  it('confirmDelivery POSTs the 6-digit code to /tracking/:id/confirm-delivery', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    await svc.confirmDelivery('bid-99', '123456')
    expect(mockApiFn).toHaveBeenCalledWith('/tracking/bid-99/confirm-delivery', {
      method: 'POST',
      body: { confirmationCode: '123456' },
    })
  })

  it('postTrackingEvent POSTs the event to /tracking/events', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const { tripsService } = await import('@/features/trajets/services/tripsService')
    const svc = tripsService()
    await svc.postTrackingEvent('bid-99', 'DEPART')
    expect(mockApiFn).toHaveBeenCalledWith('/tracking/events', {
      method: 'POST',
      body: { bidId: 'bid-99', eventType: 'DEPART' },
    })
  })
})
