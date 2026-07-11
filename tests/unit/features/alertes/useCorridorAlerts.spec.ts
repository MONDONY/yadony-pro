// tests/unit/features/alertes/useCorridorAlerts.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSvc = {
  listAlerts: vi.fn(),
  createAlert: vi.fn(),
  toggleAlert: vi.fn(),
  deleteAlert: vi.fn(),
}

vi.mock('@/features/alertes/services/alertsService', () => ({
  alertsService: () => mockSvc,
}))

async function importComposable() {
  const mod = await import('@/features/alertes/composables/useCorridorAlerts')
  return mod.useCorridorAlerts
}

const alert = {
  id: 'a1', departureCity: 'Paris', arrivalCity: 'Dakar',
  dateFrom: null, dateTo: null, minWeightKg: 5,
  direction: 'TRAVELER_WANTS_PACKAGES' as const, active: true, matchCount: 3, createdAt: '2026-07-01',
}

describe('useCorridorAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchAlerts charge les alertes', async () => {
    mockSvc.listAlerts.mockResolvedValue([alert])
    const { alerts, isLoading, fetchAlerts } = (await importComposable())()
    const p = fetchAlerts()
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
    expect(alerts.value).toHaveLength(1)
  })

  it('fetchAlerts pose une erreur en cas d’échec', async () => {
    mockSvc.listAlerts.mockRejectedValue(new Error('boom'))
    const { error, fetchAlerts } = (await importComposable())()
    await fetchAlerts()
    expect(error.value).toBe('Impossible de charger tes alertes.')
  })

  it('addAlert crée puis recharge', async () => {
    mockSvc.createAlert.mockResolvedValue(alert)
    mockSvc.listAlerts.mockResolvedValue([alert])
    const { alerts, addAlert } = (await importComposable())()
    await addAlert({ departureCity: 'Paris', arrivalCity: 'Dakar', minWeightKg: 5, dateFrom: null, dateTo: null })
    expect(mockSvc.createAlert).toHaveBeenCalled()
    expect(alerts.value).toHaveLength(1)
  })

  it('toggle bascule l’alerte puis recharge', async () => {
    mockSvc.toggleAlert.mockResolvedValue({ ...alert, active: false })
    mockSvc.listAlerts.mockResolvedValue([{ ...alert, active: false }])
    const { alerts, toggle } = (await importComposable())()
    await toggle(alert)
    expect(mockSvc.toggleAlert).toHaveBeenCalledWith(alert)
    expect(alerts.value[0].active).toBe(false)
  })

  it('remove supprime puis recharge', async () => {
    mockSvc.deleteAlert.mockResolvedValue(undefined)
    mockSvc.listAlerts.mockResolvedValue([])
    const { alerts, remove } = (await importComposable())()
    await remove('a1')
    expect(mockSvc.deleteAlert).toHaveBeenCalledWith('a1')
    expect(alerts.value).toHaveLength(0)
  })
})
