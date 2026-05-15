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
})
