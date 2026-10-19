// tests/unit/composables/useCommissionGrid.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quoteCommission } from '@/lib/commissionGrid'

const mockApi = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApi,
}))

const view = {
  gridId: 'g1',
  effectiveFrom: '2026-11-20T00:00:00',
  tiers: [
    { fromEur: 0, rate: 0.07 },
    { fromEur: 100, rate: 0.06 },
    { fromEur: 300, rate: 0.05 },
  ],
  minimums: { EUR: 1.0, XOF: 650 },
}

async function importComposable() {
  return import('@/composables/useCommissionGrid')
}

describe('useCommissionGrid', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
  })

  it('charge la grille en vigueur depuis GET /config/commission-grid', async () => {
    mockApi.mockResolvedValue({ current: view, next: null })
    const { useCommissionGrid } = await importComposable()
    const grid = await useCommissionGrid().getGrid()
    expect(mockApi).toHaveBeenCalledWith('/config/commission-grid')
    expect(grid?.gridId).toBe('g1')
    expect(quoteCommission(150, 'EUR', grid!)?.commission).toBe(10)
  })

  it('met la grille en cache : un seul appel pour plusieurs lecteurs', async () => {
    mockApi.mockResolvedValue({ current: view, next: null })
    const { useCommissionGrid } = await importComposable()
    await useCommissionGrid().getGrid()
    await useCommissionGrid().getGrid()
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('partage la requête en cours entre appels simultanés', async () => {
    mockApi.mockResolvedValue({ current: view, next: null })
    const { useCommissionGrid } = await importComposable()
    await Promise.all([useCommissionGrid().getGrid(), useCommissionGrid().getGrid()])
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('rend null et met en cache « pas de grille » quand current est null', async () => {
    mockApi.mockResolvedValue({ current: null, next: null })
    const { useCommissionGrid } = await importComposable()
    expect(await useCommissionGrid().getGrid()).toBeNull()
    expect(await useCommissionGrid().getGrid()).toBeNull()
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['statusCode', { statusCode: 404 }],
    ['status', { status: 404 }],
    ['response.status', { response: { status: 404 } }],
  ])('un back sans la route (404 via %s) vaut « pas de grille », mis en cache', async (_label, error) => {
    mockApi.mockRejectedValue(error)
    const { useCommissionGrid } = await importComposable()
    expect(await useCommissionGrid().getGrid()).toBeNull()
    expect(await useCommissionGrid().getGrid()).toBeNull()
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('une autre erreur rend null sans mettre en cache : retente au prochain appel', async () => {
    mockApi.mockRejectedValueOnce(new Error('network down'))
    mockApi.mockResolvedValue({ current: view, next: null })
    const { useCommissionGrid } = await importComposable()
    expect(await useCommissionGrid().getGrid()).toBeNull()
    expect((await useCommissionGrid().getGrid())?.gridId).toBe('g1')
    expect(mockApi).toHaveBeenCalledTimes(2)
  })

  it('une erreur nulle ou sans statut n’est pas prise pour un 404', async () => {
    mockApi.mockRejectedValueOnce(null)
    mockApi.mockResolvedValue({ current: view, next: null })
    const { useCommissionGrid } = await importComposable()
    expect(await useCommissionGrid().getGrid()).toBeNull()
    expect((await useCommissionGrid().getGrid())?.gridId).toBe('g1')
  })

  it('resetCommissionGridCache vide le cache', async () => {
    mockApi.mockResolvedValue({ current: view, next: null })
    const { useCommissionGrid, resetCommissionGridCache } = await importComposable()
    await useCommissionGrid().getGrid()
    resetCommissionGridCache()
    await useCommissionGrid().getGrid()
    expect(mockApi).toHaveBeenCalledTimes(2)
  })
})
