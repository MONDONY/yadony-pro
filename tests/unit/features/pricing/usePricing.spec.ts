import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchMarketPrice = vi.fn()
const mockGetGrid = vi.fn()
const mockFetchCorridors = vi.fn()

vi.mock('@/features/pricing/services/pricingService', () => ({
  pricingService: () => ({
    fetchMarketPrice: mockFetchMarketPrice,
    fetchCorridors: mockFetchCorridors,
  }),
}))

vi.mock('@/composables/useCommissionGrid', () => ({
  useCommissionGrid: () => ({ getGrid: mockGetGrid }),
}))

async function importComposable() {
  const mod = await import('@/features/pricing/composables/usePricing')
  return mod.usePricing
}

describe('usePricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('loadCommissionGrid expose la grille en vigueur', async () => {
    const grid = { tiers: [{ fromEur: 0, rate: 0.07 }], minimums: { EUR: 1 } }
    mockGetGrid.mockResolvedValue(grid)
    const { commissionGrid, loadCommissionGrid } = (await importComposable())()
    expect(commissionGrid.value).toBeNull()
    await loadCommissionGrid()
    expect(commissionGrid.value).toEqual(grid)
  })

  it('loadCommissionGrid reste à null sans grille (aucun taux de repli inventé)', async () => {
    mockGetGrid.mockResolvedValue(null)
    const { commissionGrid, loadCommissionGrid } = (await importComposable())()
    await loadCommissionGrid()
    expect(commissionGrid.value).toBeNull()
  })

  it('selectCorridor loads the market price for the corridor', async () => {
    mockFetchMarketPrice.mockResolvedValue({ median: 13, currency: 'EUR' })
    const { corridorKey, marketPrice, selectCorridor } = (await importComposable())()
    await selectCorridor('PARIS_DAKAR')
    expect(corridorKey.value).toBe('PARIS_DAKAR')
    expect(marketPrice.value?.median).toBe(13)
  })

  it('selectCorridor sets an error and clears the price on failure', async () => {
    mockFetchMarketPrice.mockRejectedValue(new Error('x'))
    const { marketPrice, error, selectCorridor } = (await importComposable())()
    await selectCorridor('PARIS_DAKAR')
    expect(marketPrice.value).toBeNull()
    expect(error.value).toBe('Impossible de récupérer le prix de marché pour ce corridor.')
  })

  it('loadCorridors expose les corridors du back', async () => {
    mockFetchCorridors.mockResolvedValue([
      { key: 'PARIS_DAKAR', label: 'Paris → Dakar' },
      { key: 'LYON_ABIDJAN', label: 'Lyon → Abidjan' },
    ])
    const { corridors, loadCorridors } = (await importComposable())()
    expect(corridors.value).toEqual([])
    await loadCorridors()
    expect(corridors.value).toHaveLength(2)
    expect(corridors.value[0]).toEqual({ key: 'PARIS_DAKAR', label: 'Paris → Dakar' })
  })
})
