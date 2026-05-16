// tests/unit/features/cockpit/useCockpit.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetchAnalytics = vi.fn()
const mockFetchCalendar = vi.fn()
const mockFetchAutomationTodayCount = vi.fn()
const mockListBids = vi.fn()

vi.mock('@/features/cockpit/services/cockpitService', () => ({
  cockpitService: () => ({
    fetchAnalytics: mockFetchAnalytics,
    fetchCalendar: mockFetchCalendar,
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

const fakeAnalytics = {
  period: 'MONTH',
  kpis: [
    { id: 'revenue', label: 'Revenus nets', value: '420.50 €', trend: 'up', trendValue: null },
    { id: 'parcels', label: 'Colis gérés', value: '12', trend: 'up', trendValue: null },
    { id: 'rating', label: 'Note moyenne', value: '4.8', trend: 'up', trendValue: null },
  ],
}

const fakeCalendar = { activeTripsCount: 2, totalTripsThisMonth: 5 }

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
    mockFetchAnalytics.mockResolvedValue(fakeAnalytics)
    mockFetchCalendar.mockResolvedValue(fakeCalendar)
    mockFetchAutomationTodayCount.mockResolvedValue(0)
    mockListBids.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 })
  })

  it('initializes with null analytics, zero stats, empty urgentActions', async () => {
    const useCockpit = await importUseCockpit()
    const { analytics, calendarStats, urgentActions } = useCockpit()
    expect(analytics.value).toBeNull()
    expect(calendarStats.value).toBeNull()
    expect(urgentActions.value).toEqual([])
  })

  it('fetchAll populates analytics and calendarStats', async () => {
    const useCockpit = await importUseCockpit()
    const { analytics, calendarStats, fetchAll } = useCockpit()
    await fetchAll()
    expect(analytics.value).toEqual(fakeAnalytics)
    expect(calendarStats.value).toEqual(fakeCalendar)
  })

  it('fetchAll sets isLoading true during fetch and false after', async () => {
    let resolve: (v: unknown) => void
    mockFetchAnalytics.mockReturnValue(new Promise((r) => (resolve = r)))
    const useCockpit = await importUseCockpit()
    const { isLoading, fetchAll } = useCockpit()
    expect(isLoading.value).toBe(false)
    const promise = fetchAll()
    expect(isLoading.value).toBe(true)
    resolve!(fakeAnalytics)
    await promise
    expect(isLoading.value).toBe(false)
  })

  it('fetchAll sets error when any request rejects', async () => {
    mockFetchAnalytics.mockRejectedValue(new Error('Network'))
    const useCockpit = await importUseCockpit()
    const { error, fetchAll } = useCockpit()
    await fetchAll()
    expect(error.value).toBe('Impossible de charger le tableau de bord. Veuillez réessayer.')
  })

  it('urgentActions includes red action for bid expiring in < 4h', async () => {
    mockListBids.mockResolvedValue({
      content: [fakePendingBid],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
    })
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
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
    })
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    const orangeAction = urgentActions.value.find((a) => a.severity === 'orange')
    expect(orangeAction).toBeDefined()
  })

  it('urgentActions always includes blue (automated actions) and green (earnings) actions', async () => {
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    expect(urgentActions.value.some((a) => a.severity === 'blue')).toBe(true)
    expect(urgentActions.value.some((a) => a.severity === 'green')).toBe(true)
  })

  it('kpis returns 5 KpiData objects', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    expect(kpis.value).toHaveLength(5)
  })

  it('kpis returns placeholder dashes before fetchAll is called', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis } = useCockpit()
    expect(kpis.value.every((k) => k.value === '—')).toBe(true)
  })

  it('urgentActions uses plural label for multiple expiring bids', async () => {
    const bid1 = { ...fakePendingBid, id: 'b1' }
    const bid2 = { ...fakePendingBid, id: 'b2' }
    mockListBids.mockResolvedValue({ content: [bid1, bid2], totalElements: 2, totalPages: 1, number: 0, size: 50 })
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    const redAction = urgentActions.value.find((a) => a.severity === 'red')
    expect(redAction?.label).toContain('2 bids')
  })

  it('urgentActions uses plural label for multiple stale bids', async () => {
    const bid1 = { ...fakePendingBid, id: 'b1', expiresAt: null }
    const bid2 = { ...fakePendingBid, id: 'b2', expiresAt: null }
    mockListBids.mockResolvedValue({ content: [bid1, bid2], totalElements: 2, totalPages: 1, number: 0, size: 50 })
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    const orangeAction = urgentActions.value.find((a) => a.severity === 'orange')
    expect(orangeAction?.label).toContain('2 bids')
  })

  it('green action detail says "Bon travail" when revenue > 0', async () => {
    // fakeAnalytics revenue KPI value is '420.50 €' (non-zero)
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    const greenAction = urgentActions.value.find((a) => a.severity === 'green')
    expect(greenAction?.detail).toContain('Bon travail')
  })

  it('green action detail says no virement when revenue is 0', async () => {
    mockFetchAnalytics.mockResolvedValue({
      period: 'MONTH',
      kpis: fakeAnalytics.kpis.map((k) =>
        k.id === 'revenue' ? { ...k, value: '0.00 €' } : k,
      ),
    })
    const useCockpit = await importUseCockpit()
    const { urgentActions, fetchAll } = useCockpit()
    await fetchAll()
    const greenAction = urgentActions.value.find((a) => a.severity === 'green')
    expect(greenAction?.detail).toContain('Aucun virement')
  })

  it('kpis actions trend is up when actionsRequises > 0', async () => {
    mockListBids.mockResolvedValue({
      content: [fakePendingBid],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
    })
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const actionKpi = kpis.value.find((k) => k.id === 'actions')
    expect(actionKpi?.trend).toBe('up')
  })

  it('kpis actions trend is neutral when actionsRequises is 0', async () => {
    // default mockListBids returns empty content → 0 pending bids → trend neutral
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const actionKpi = kpis.value.find((k) => k.id === 'actions')
    expect(actionKpi?.trend).toBe('neutral')
  })

  it('kpis rating trend is up when averageRating >= 4.5', async () => {
    // fakeAnalytics rating KPI has trend 'up' (value '4.8')
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const ratingKpi = kpis.value.find((k) => k.id === 'rating')
    expect(ratingKpi?.trend).toBe('up')
  })

  it('kpis rating trend is down when averageRating < 4', async () => {
    mockFetchAnalytics.mockResolvedValue({
      period: 'MONTH',
      kpis: fakeAnalytics.kpis.map((k) =>
        k.id === 'rating' ? { ...k, value: '3.5', trend: 'down' } : k,
      ),
    })
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const ratingKpi = kpis.value.find((k) => k.id === 'rating')
    expect(ratingKpi?.trend).toBe('down')
  })

  it('kpis rating trend is neutral when 4 <= averageRating < 4.5', async () => {
    mockFetchAnalytics.mockResolvedValue({
      period: 'MONTH',
      kpis: fakeAnalytics.kpis.map((k) =>
        k.id === 'rating' ? { ...k, value: '4.2', trend: null } : k,
      ),
    })
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const ratingKpi = kpis.value.find((k) => k.id === 'rating')
    expect(ratingKpi?.trend).toBe('neutral')
  })

  it('kpis shows calendarStats values when data is loaded', async () => {
    const useCockpit = await importUseCockpit()
    const { kpis, fetchAll } = useCockpit()
    await fetchAll()
    const tripsKpi = kpis.value.find((k) => k.id === 'trips')
    expect(tripsKpi?.value).toBe('2 / 5')
  })
})
