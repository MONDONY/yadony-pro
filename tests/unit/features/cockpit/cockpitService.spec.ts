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
})
