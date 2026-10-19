// tests/unit/composables/useCommissionContext.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetGrid = vi.fn()
const mockGetRate = vi.fn()

vi.mock('@/composables/useCommissionGrid', () => ({
  useCommissionGrid: () => ({ getGrid: mockGetGrid }),
}))
vi.mock('@/composables/useCommissionRate', () => ({
  useCommissionRate: () => ({ getRate: mockGetRate }),
}))

const grid = { tiers: [{ fromEur: 0, rate: 0.07 }], minimums: { EUR: 1 } }

describe('useCommissionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rend la grille en vigueur sans interroger le taux unique', async () => {
    mockGetGrid.mockResolvedValue(grid)
    const { useCommissionContext } = await import('@/composables/useCommissionContext')
    expect(await useCommissionContext().getContext()).toEqual({ grid, rate: null })
    expect(mockGetRate).not.toHaveBeenCalled()
  })

  it('retombe sur le taux unique sans grille', async () => {
    mockGetGrid.mockResolvedValue(null)
    mockGetRate.mockResolvedValue(0.05)
    const { useCommissionContext } = await import('@/composables/useCommissionContext')
    expect(await useCommissionContext().getContext()).toEqual({ grid: null, rate: 0.05 })
  })

  it('rend ni grille ni taux quand le back ne sert rien', async () => {
    mockGetGrid.mockResolvedValue(null)
    mockGetRate.mockResolvedValue(null)
    const { useCommissionContext } = await import('@/composables/useCommissionContext')
    expect(await useCommissionContext().getContext()).toEqual({ grid: null, rate: null })
  })
})
