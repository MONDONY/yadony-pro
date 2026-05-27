import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

const fakePrefs = {
  weightUnit: 'kg' as const,
  currencyCode: 'EUR' as const,
  pickupRadiusKm: 10,
  defaultPackageWeightKg: 23,
  minBidPriceEur: 0,
  contactMode: null,
  responseDelayHours: null,
}

describe('businessPrefsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchPreferences calls GET /users/me/business-preferences', async () => {
    mockApiFn.mockResolvedValue(fakePrefs)
    const { businessPrefsService } = await import('@/features/parametres/services/businessPrefsService')
    const svc = businessPrefsService()
    const result = await svc.fetchPreferences()
    expect(mockApiFn).toHaveBeenCalledWith('/users/me/business-preferences')
    expect(result).toEqual(fakePrefs)
  })

  it('savePreferences PUTs the preferences body', async () => {
    const next = { ...fakePrefs, pickupRadiusKm: 20, contactMode: 'both' as const }
    mockApiFn.mockResolvedValue(next)
    const { businessPrefsService } = await import('@/features/parametres/services/businessPrefsService')
    const svc = businessPrefsService()
    const result = await svc.savePreferences(next)
    expect(mockApiFn).toHaveBeenCalledWith('/users/me/business-preferences', { method: 'PUT', body: next })
    expect(result).toEqual(next)
  })
})
