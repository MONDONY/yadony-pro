// tests/unit/features/cockpit/useCockpit.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetchAnalytics = vi.fn()
const mockFetchCalendar = vi.fn()
const mockListBids = vi.fn()

vi.mock('@/features/cockpit/services/cockpitService', () => ({
  cockpitService: () => ({
    fetchAnalytics: mockFetchAnalytics,
    fetchCalendar: mockFetchCalendar,
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
  revenueNetCurrentMonth: 420.5,
  averageRating: 4.8,
  colisGeres: 12,
  actionsRequises: 3,
}

const fakeCalendar = { activeTripsCount: 2, totalTripsThisMonth: 5 }

const nowIso = new Date().toISOString()
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
    const useCockpit = await importUseCockpit()
    const { isLoading, fetchAll } = useCockpit()
    expect(isLoading.value).toBe(false)
    const promise = fetchAll()
    expect(isLoading.value).toBe(true)
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
})
