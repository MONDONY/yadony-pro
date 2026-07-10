// tests/unit/features/cockpit/cockpitService.spec.ts
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

describe('cockpitService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('fetchStats calls GET /travelers/me/stats', async () => {
    const fakeStats = { totalRevenue: 2000, monthlyRevenue: 420.5, acceptanceRate: 0.67, ratingCount: 7 }
    mockApiFn.mockResolvedValue(fakeStats)
    const { cockpitService } = await import('@/features/cockpit/services/cockpitService')
    const svc = cockpitService()
    const result = await svc.fetchStats()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/stats')
    expect(result).toEqual(fakeStats)
  })

  it('fetchAnalytics calls GET /travelers/me/analytics', async () => {
    const fakeAnalytics = {
      revenueNetCurrentMonth: 420.5,
      averageRating: 4.8,
      colisGeres: 12,
      actionsRequises: 3,
    }
    mockApiFn.mockResolvedValue(fakeAnalytics)
    const { cockpitService } = await import('@/features/cockpit/services/cockpitService')
    const svc = cockpitService()
    const result = await svc.fetchAnalytics()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/analytics')
    expect(result).toEqual(fakeAnalytics)
  })

  it('fetchCalendar calls GET /travelers/me/calendar', async () => {
    const fakeCalendar = { activeTripsCount: 2, totalTripsThisMonth: 5 }
    mockApiFn.mockResolvedValue(fakeCalendar)
    const { cockpitService } = await import('@/features/cockpit/services/cockpitService')
    const svc = cockpitService()
    const result = await svc.fetchCalendar()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/calendar')
    expect(result).toEqual(fakeCalendar)
  })

  it('fetchAutomationTodayCount returns the count field from the response', async () => {
    mockApiFn.mockResolvedValue({ count: 7 })
    const { cockpitService } = await import('@/features/cockpit/services/cockpitService')
    const svc = cockpitService()
    const result = await svc.fetchAutomationTodayCount()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/automation-history/today-count')
    expect(result).toBe(7)
  })
})
