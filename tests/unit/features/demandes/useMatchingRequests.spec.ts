import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchMatchingRequests = vi.fn()
const mockGetActiveTrips = vi.fn()

vi.mock('@/features/demandes/services/matchingService', () => ({
  matchingService: () => ({
    fetchMatchingRequests: mockFetchMatchingRequests,
  }),
}))

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({
    getActiveTrips: mockGetActiveTrips,
  }),
}))

async function importComposable() {
  const mod = await import('@/features/demandes/composables/useMatchingRequests')
  return mod.useMatchingRequests
}

const fakeRequests = [
  {
    id: 'req-1', tripId: 'trip-1', tripCorridor: 'Paris → Dakar',
    tripDepartureDate: '2026-06-15', tripAvailableKg: 20,
    senderName: 'Fatou D.', senderInitials: 'FD', senderRating: 4.8, senderTotalSent: 12,
    weightKg: 10, contentType: 'Vêtements', budgetPerKg: 8,
    messageExcerpt: 'Bonjour...', matchScore: 92, requestedAt: '2026-05-15T08:00:00Z',
  },
  {
    id: 'req-2', tripId: 'trip-1', tripCorridor: 'Paris → Dakar',
    tripDepartureDate: '2026-06-15', tripAvailableKg: 20,
    senderName: 'Mamadou S.', senderInitials: 'MS', senderRating: 4.5, senderTotalSent: 5,
    weightKg: 5, contentType: 'Électronique', budgetPerKg: 12,
    messageExcerpt: 'Urgent...', matchScore: 75, requestedAt: '2026-05-14T10:00:00Z',
  },
  {
    id: 'req-3', tripId: 'trip-2', tripCorridor: 'Lyon → Abidjan',
    tripDepartureDate: '2026-07-01', tripAvailableKg: 15,
    senderName: 'Awa K.', senderInitials: 'AK', senderRating: 4.9, senderTotalSent: 20,
    weightKg: 3, contentType: 'Alimentaire', budgetPerKg: 10,
    messageExcerpt: 'Pour ma famille...', matchScore: 88, requestedAt: '2026-05-13T09:00:00Z',
  },
]

describe('useMatchingRequests', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFetchMatchingRequests.mockReset()
    mockGetActiveTrips.mockReset()
  })

  it('initial state: requests empty, isLoading false, error null', async () => {
    mockFetchMatchingRequests.mockResolvedValue([])
    const useMatchingRequests = await importComposable()
    const { requests, isLoading, error } = useMatchingRequests()
    expect(requests.value).toEqual([])
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('fetchRequests populates requests on success', async () => {
    mockFetchMatchingRequests.mockResolvedValue(fakeRequests)
    const useMatchingRequests = await importComposable()
    const { requests, fetchRequests } = useMatchingRequests()
    await fetchRequests()
    expect(requests.value).toHaveLength(3)
  })

  it('activeTrips deduplicated from requests with correct matchCount', async () => {
    mockFetchMatchingRequests.mockResolvedValue(fakeRequests)
    const useMatchingRequests = await importComposable()
    const { fetchRequests, activeTrips } = useMatchingRequests()
    await fetchRequests()
    expect(activeTrips.value).toHaveLength(2)
    const trip1 = activeTrips.value.find(t => t.tripId === 'trip-1')
    expect(trip1?.matchCount).toBe(2)
    expect(trip1?.tripCorridor).toBe('Paris → Dakar')
    const trip2 = activeTrips.value.find(t => t.tripId === 'trip-2')
    expect(trip2?.matchCount).toBe(1)
  })

  it('hasActiveTrips true when requests contain at least one trip', async () => {
    mockFetchMatchingRequests.mockResolvedValue(fakeRequests)
    const useMatchingRequests = await importComposable()
    const { fetchRequests, hasActiveTrips } = useMatchingRequests()
    await fetchRequests()
    expect(hasActiveTrips.value).toBe(true)
  })

  it('hasActiveTrips false when 0 requests', async () => {
    mockFetchMatchingRequests.mockResolvedValue([])
    const useMatchingRequests = await importComposable()
    const { fetchRequests, hasActiveTrips } = useMatchingRequests()
    await fetchRequests()
    expect(hasActiveTrips.value).toBe(false)
  })

  it('fetchRequests sets error on failure', async () => {
    mockFetchMatchingRequests.mockRejectedValue(new Error('network'))
    const useMatchingRequests = await importComposable()
    const { error, fetchRequests } = useMatchingRequests()
    await fetchRequests()
    expect(error.value).toBe('Impossible de charger les demandes compatibles. Veuillez réessayer.')
  })
})
