// tests/unit/features/alertes/alertsService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/alertes/services/alertsService')
  return mod.alertsService
}

const backendAlert = {
  id: 'a1', departureCity: 'Paris', arrivalCity: 'Dakar',
  departureCountryCode: 'FR', arrivalCountryCode: 'SN',
  dateFrom: null, dateTo: null, minWeightKg: 5, contentCategories: [],
  direction: 'TRAVELER_WANTS_PACKAGES', active: true, matchCount: 3,
  createdAt: '2026-07-01T10:00:00', centerLat: null, centerLng: null, radiusKm: null, centerLabel: null,
}

describe('alertsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('listAlerts interroge GET /me/corridor-alerts filtré voyageur', async () => {
    mockApiFn.mockResolvedValue([backendAlert])
    const svc = (await importService())()
    const res = await svc.listAlerts()
    expect(mockApiFn).toHaveBeenCalledWith('/me/corridor-alerts', {
      query: { direction: 'TRAVELER_WANTS_PACKAGES' },
    })
    expect(res[0].matchCount).toBe(3)
  })

  it('createAlert POSTe le corridor avec la direction voyageur', async () => {
    mockApiFn.mockResolvedValue(backendAlert)
    const svc = (await importService())()
    await svc.createAlert({ departureCity: 'Paris', arrivalCity: 'Dakar', minWeightKg: 5, dateFrom: null, dateTo: null })
    expect(mockApiFn).toHaveBeenCalledWith('/me/corridor-alerts', {
      method: 'POST',
      body: {
        departureCity: 'Paris',
        arrivalCity: 'Dakar',
        minWeightKg: 5,
        dateFrom: null,
        dateTo: null,
        direction: 'TRAVELER_WANTS_PACKAGES',
        active: true,
      },
    })
  })

  it('toggleAlert PUT l’alerte avec active inversé en conservant le corridor', async () => {
    mockApiFn.mockResolvedValue({ ...backendAlert, active: false })
    const svc = (await importService())()
    await svc.toggleAlert({
      id: 'a1', departureCity: 'Paris', arrivalCity: 'Dakar',
      dateFrom: null, dateTo: null, minWeightKg: 5,
      direction: 'TRAVELER_WANTS_PACKAGES', active: true, matchCount: 3, createdAt: '2026-07-01',
    })
    expect(mockApiFn).toHaveBeenCalledWith('/me/corridor-alerts/a1', {
      method: 'PUT',
      body: {
        departureCity: 'Paris',
        arrivalCity: 'Dakar',
        dateFrom: null,
        dateTo: null,
        minWeightKg: 5,
        direction: 'TRAVELER_WANTS_PACKAGES',
        active: false,
      },
    })
  })

  it('deleteAlert supprime via DELETE /me/corridor-alerts/:id', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.deleteAlert('a1')
    expect(mockApiFn).toHaveBeenCalledWith('/me/corridor-alerts/a1', { method: 'DELETE' })
  })
})
