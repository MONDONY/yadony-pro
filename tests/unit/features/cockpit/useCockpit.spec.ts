// tests/unit/features/cockpit/useCockpit.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetchStats = vi.fn()
const mockFetchAutomationTodayCount = vi.fn()
const mockListBids = vi.fn()

vi.mock('@/features/cockpit/services/cockpitService', () => ({
  cockpitService: () => ({
    fetchStats: mockFetchStats,
    fetchAnalytics: vi.fn(),
    fetchCalendar: vi.fn(),
    fetchAutomationTodayCount: mockFetchAutomationTodayCount,
  }),
}))

vi.mock('@/features/colis/services/bidsService', () => ({
  bidsService: () => ({
    listBids: mockListBids,
    acceptBid: vi.fn(),
    rejectBid: vi.fn(),
  }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

const fakeStats = {
  monthlyRevenue: 420.5,
  totalRevenue: 2000,
  monthlyTrips: 3,
  monthlyParcelsDelivered: 12,
  acceptanceRate: 0.67,
  averageRating: 4.8,
  topDestinations: [],
  totalTripsCompleted: 9,
  activeTrips: 2,
  totalParcelsDelivered: 15,
  parcelsInTransit: 1,
  ratingCount: 7,
}

const in2h = new Date(Date.now() + 2 * 3600 * 1000).toISOString()
const ago25h = new Date(Date.now() - 25 * 3600 * 1000).toISOString()

const fakePendingBid = {
  id: 'bid-pending-1',
  status: 'PENDING' as const,
  tripId: 'trip-1',
  tripCorridor: 'Paris → Dakar',
  tripDepartureDate: '2026-06-01',
  sender: { id: 'u1', name: 'Alice', avatarInitials: 'AL', rating: 4.5, totalSentParcels: 5 },
  weightKg: 5,
  contentDescription: 'Vêtements',
  declaredValueEuros: 100,
  earningsEuros: 30,
  paymentStatus: 'PENDING' as const,
  paymentAmountEuros: 35,
  history: [],
  createdAt: ago25h,
  expiresAt: in2h,
}

async function importUseCockpit() {
  const mod = await import('@/features/cockpit/composables/useCockpit')
  return mod.useCockpit
}

describe('useCockpit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
    mockFetchStats.mockResolvedValue(fakeStats)
    mockFetchAutomationTodayCount.mockResolvedValue(0)
    mockListBids.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 })
  })

  it('initializes with null stats and empty urgentActions', async () => {
    const useCockpit = await importUseCockpit()
    const { stats, urgentActions } = useCockpit()
    expect(stats.value).toBeNull()
    expect(urgentActions.value).toEqual([])
  })

  it('fetchAll populates stats (tout-temps)', async () => {
    const useCockpit = await importUseCockpit()
    const { stats, fetchAll } = useCockpit()
    await fetchAll()
    expect(stats.value).toEqual(fakeStats)
  })

  it('fetchAll sets isLoading true during fetch and false after', async () => {
    let resolve: (v: unknown) => void
    mockFetchStats.mockReturnValue(new Promise((r) => (resolve = r)))
    const useCockpit = await importUseCockpit()
    const { isLoading, fetchAll } = useCockpit()
    expect(isLoading.value).toBe(false)
    const promise = fetchAll()
    expect(isLoading.value).toBe(true)
    resolve!(fakeStats)
    await promise
    expect(isLoading.value).toBe(false)
  })

  it('fetchAll sets error when any request rejects', async () => {
    mockFetchStats.mockRejectedValue(new Error('Network'))
    const useCockpit = await importUseCockpit()
    const { error, fetchAll } = useCockpit()
    await fetchAll()
    expect(error.value).toBe('Impossible de charger le tableau de bord. Veuillez réessayer.')
  })

  it('urgentActions includes red action for bid expiring in < 4h', async () => {
    mockListBids.mockResolvedValue({ content: [fakePendingBid], totalElements: 1, totalPages: 1, number: 0, size: 50 })
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    const redAction = urgentActions.value.find((a) => a.severity === 'red')
    expect(redAction).toBeDefined()
    expect(redAction!.label).toContain('expir')
  })

  it('urgentActions includes orange action for bid pending > 24h', async () => {
    mockListBids.mockResolvedValue({
      content: [{ ...fakePendingBid, expiresAt: null }],
      totalElements: 1, totalPages: 1, number: 0, size: 50,
    })
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    expect(urgentActions.value.find((a) => a.severity === 'orange')).toBeDefined()
  })

  it('urgentActions always includes blue and green actions', async () => {
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    expect(urgentActions.value.some((a) => a.severity === 'blue')).toBe(true)
    expect(urgentActions.value.some((a) => a.severity === 'green')).toBe(true)
  })

  it('green action says "Bon travail" when monthly revenue > 0', async () => {
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    expect(urgentActions.value.find((a) => a.severity === 'green')?.detail).toContain('Bon travail')
  })

  it('green action says "Aucun virement" when monthly revenue is 0', async () => {
    mockFetchStats.mockResolvedValue({ ...fakeStats, monthlyRevenue: 0 })
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    expect(urgentActions.value.find((a) => a.severity === 'green')?.detail).toContain('Aucun virement')
  })

  it('kpis returns 9 all-time KpiData objects', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    expect(kpis.value).toHaveLength(9)
  })

  it('kpis is empty before fetchAll', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis } = useCockpit()
    expect(kpis.value).toEqual([])
  })

  it('kpis exposes all-time totals (revenue, trips, parcels)', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const byId = (id: string) => kpis.value.find((k) => k.id === id)
    expect(byId('revenue-total')?.value).toContain('€')
    expect(byId('trips-completed')?.value).toBe('9')
    expect(byId('active-trips')?.value).toBe('2')
    expect(byId('parcels-delivered')?.value).toBe('15')
    expect(byId('parcels-transit')?.value).toBe('1')
  })

  it('kpis acceptance rate is formatted as percent (67%)', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    expect(kpis.value.find((k) => k.id === 'acceptance')?.value).toBe('67%')
  })

  it('kpis rating shows value + rating count', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const rating = kpis.value.find((k) => k.id === 'rating')
    expect(rating?.value).toBe('4.8/5')
    expect(rating?.subLabel).toBe('7 avis')
  })

  it('kpis actions trend is up when pending bids > 0', async () => {
    mockListBids.mockResolvedValue({ content: [fakePendingBid], totalElements: 1, totalPages: 1, number: 0, size: 50 })
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    expect(kpis.value.find((k) => k.id === 'actions')?.trend).toBe('up')
  })

  it('kpis actions trend is neutral when no pending bids', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    expect(kpis.value.find((k) => k.id === 'actions')?.trend).toBe('neutral')
  })
})
