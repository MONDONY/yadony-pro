// tests/unit/lib/commissionGrid.spec.ts
//
// Vecteurs de référence recopiés tels quels du back (yadony-back,
// src/test/resources/commission/vectors.json) : le portage TypeScript doit rendre
// les mêmes montants, au centime. Seuls les vecteurs SANS réductions personnelles
// (taux spécial, code promo, bon) sont rejoués : le portail ne les connaît pas.
import { describe, it, expect } from 'vitest'
import vectorsFile from '../../fixtures/commission-vectors.json'
import {
  grossFromNet,
  minimumFor,
  netForGross,
  parseCommissionGrid,
  quoteCommission,
  senderTotalFromNet,
  type CommissionGrid,
} from '@/lib/commissionGrid'

interface Vector {
  case: string
  currency: string
  net?: string
  gross?: string
  reductions: Record<string, string>
  expected: {
    commission?: string
    gross?: string
    net?: string
    minimumApplied?: boolean
    error?: string
  }
}

const grid = vectorsFile.grid as CommissionGrid
const vectors = vectorsFile.vectors as Vector[]
const withoutReductions = vectors.filter((v) => Object.keys(v.reductions).length === 0)
const forward = withoutReductions.filter((v) => v.net !== undefined)
const inverse = withoutReductions.filter((v) => v.gross !== undefined)

describe('commissionGrid : vecteurs du back', () => {
  it('rejoue les vecteurs sans réductions personnelles (et seulement eux)', () => {
    expect(forward).toHaveLength(12)
    expect(inverse).toHaveLength(5)
    expect(withoutReductions.length).toBeLessThan(vectors.length)
  })

  it.each(forward.map((v) => [v.case, v] as const))('net vers brut : %s', (_name, v) => {
    const quote = quoteCommission(v.net!, v.currency, grid)
    expect(quote).not.toBeNull()
    expect(quote!.commission).toBe(Number(v.expected.commission))
    expect(quote!.gross).toBe(Number(v.expected.gross))
    expect(quote!.minimumApplied).toBe(v.expected.minimumApplied)
    expect(grossFromNet(v.net!, v.currency, grid)).toBe(Number(v.expected.gross))
  })

  it.each(inverse.map((v) => [v.case, v] as const))('brut vers net : %s', (_name, v) => {
    const result = netForGross(v.gross!, v.currency, grid)
    if (v.expected.error) {
      expect(v.expected.error).toBe('budget-below-commission-minimum')
      expect(result).toBeNull()
    } else {
      expect(result).toEqual({ net: Number(v.expected.net), commission: Number(v.expected.commission) })
    }
  })
})

describe('quoteCommission', () => {
  it('accepte un net en nombre et l’arrondit à l’unité mineure (HALF_UP)', () => {
    expect(quoteCommission(20, 'EUR', grid)?.gross).toBe(21.4)
    expect(quoteCommission(0.1 + 0.2, 'EUR', grid)?.net).toBe(0.3)
    expect(quoteCommission('10.005', 'EUR', grid)?.net).toBe(10.01)
  })

  it('rend null pour un net nul, négatif ou illisible', () => {
    expect(quoteCommission(0, 'EUR', grid)).toBeNull()
    expect(quoteCommission(-5, 'EUR', grid)).toBeNull()
    expect(quoteCommission('abc', 'EUR', grid)).toBeNull()
    expect(quoteCommission(Number.NaN, 'EUR', grid)).toBeNull()
  })

  it('rend null pour une devise inconnue ou sans minimum dans la grille', () => {
    expect(quoteCommission(20, 'JPY', grid)).toBeNull()
    expect(quoteCommission(20, 'EUR', { ...grid, minimums: { XOF: '650' } })).toBeNull()
  })

  it('rend null pour une grille sans tranche ou aux tranches illisibles', () => {
    expect(quoteCommission(20, 'EUR', { ...grid, tiers: [] })).toBeNull()
    expect(quoteCommission(20, 'EUR', { ...grid, tiers: [{ fromEur: 'x', rate: '0.07' }] })).toBeNull()
  })

  it('trie les tranches par borne croissante', () => {
    const shuffled: CommissionGrid = { ...grid, tiers: [...grid.tiers].reverse() }
    expect(quoteCommission(150, 'EUR', shuffled)?.commission).toBe(10)
  })

  it('ne prélève ni minimum ni commission quand la tranche de départ est à 0 %', () => {
    const free: CommissionGrid = { ...grid, tiers: [{ fromEur: 0, rate: 0 }] }
    expect(quoteCommission(5, 'EUR', free)).toEqual({ net: 5, commission: 0, gross: 5, minimumApplied: false })
  })

  it('accepte les taux et bornes en nombres, notation exponentielle comprise', () => {
    const numeric: CommissionGrid = {
      tiers: [{ fromEur: 0, rate: 0.07 }, { fromEur: 100, rate: 1e-1 }],
      minimums: { EUR: 1 },
    }
    expect(quoteCommission(200, 'EUR', numeric)?.commission).toBe(17)
  })

  it('applique la parité fixe XOF et XAF aux bornes, sans arrondi', () => {
    // 100 € = 65 595,7 F CFA : la frontière de tranche n’est pas un entier.
    expect(quoteCommission(65596, 'XAF', grid)?.commission).toBe(4592) // 7 % de 65 595,7 + 6 % de 0,3
    expect(quoteCommission(100000, 'XOF', grid)?.commission).toBe(6656)
  })
})

describe('netForGross', () => {
  it('rend null pour un budget illisible ou nul', () => {
    expect(netForGross('abc', 'EUR', grid)).toBeNull()
    expect(netForGross(0, 'EUR', grid)).toBeNull()
    expect(netForGross(21.4, 'JPY', grid)).toBeNull()
  })

  it('retrouve le net de tous les montants bruts (aller-retour exact)', () => {
    for (const net of [0.5, 1, 14.28, 14.29, 99.99, 100, 100.01, 299.99, 300, 1234.56]) {
      const gross = grossFromNet(net, 'EUR', grid)!
      const back = netForGross(gross, 'EUR', grid)!
      expect(back.net).toBe(net)
    }
  })

  it('rend le plus grand net qui tient dans le budget', () => {
    // Le net rendu est le plus grand dont le total payé tient dans 6,09 € : un centime
    // de net en plus dépasserait le budget.
    const result = netForGross(6.09, 'EUR', grid)!
    expect(grossFromNet(result.net, 'EUR', grid)!).toBeLessThanOrEqual(6.09)
    expect(grossFromNet(result.net + 0.01, 'EUR', grid)!).toBeGreaterThan(6.09)
  })
})

describe('minimumFor', () => {
  it('rend le minimum de la devise', () => {
    expect(minimumFor(grid, 'EUR')).toBe(1)
    expect(minimumFor(grid, 'xof')).toBe(650)
    expect(minimumFor(grid, 'USD')).toBe(1.1)
  })

  it('rend null sans grille, sans minimum pour la devise ou à zéro', () => {
    expect(minimumFor(null, 'EUR')).toBeNull()
    expect(minimumFor({ ...grid, minimums: {} }, 'EUR')).toBeNull()
    expect(minimumFor({ ...grid, minimums: { EUR: 0 } }, 'EUR')).toBeNull()
  })
})

describe('senderTotalFromNet', () => {
  it('passe par la grille quand elle est en vigueur', () => {
    expect(senderTotalFromNet(20, 'EUR', { grid, rate: null })).toBe(21.4)
    expect(senderTotalFromNet(20, 'EUR', { grid, rate: 0.5 })).toBe(21.4)
  })

  it('retombe sur le taux unique sans grille, arrondi à la devise', () => {
    expect(senderTotalFromNet(100, 'EUR', { grid: null, rate: 0.05 })).toBe(105)
    expect(senderTotalFromNet(1001, 'XOF', { grid: null, rate: 0.05 })).toBe(1051)
    // Ordre du back (PriceBreakdown.fromNet) : commission arrondie HALF_UP, puis somme.
    expect(senderTotalFromNet(10.1, 'EUR', { grid: null, rate: 0.05 })).toBe(10.61) // 0,505 arrondi à 0,51
    expect(senderTotalFromNet(0.1 + 0.2, 'EUR', { grid: null, rate: 0.05 })).toBe(0.32) // net 0,30, commission 0,015 arrondie à 0,02
    expect(senderTotalFromNet(5001, 'XOF', { grid: null, rate: 0.05 })).toBe(5251) // 250,05 arrondi à 250
    expect(senderTotalFromNet(10, 'JPY', { grid: null, rate: 0.05 })).toBe(10.5)
  })

  it('rend null sans grille ni taux, ou pour un net illisible', () => {
    expect(senderTotalFromNet(100, 'EUR', { grid: null, rate: null })).toBeNull()
    expect(senderTotalFromNet(Number.NaN, 'EUR', { grid, rate: null })).toBeNull()
    expect(senderTotalFromNet(-1, 'EUR', { grid: null, rate: 0.05 })).toBeNull()
  })

  it('rend null quand la grille ne permet pas le calcul', () => {
    expect(senderTotalFromNet(100, 'EUR', { grid: { ...grid, tiers: [] }, rate: 0.05 })).toBeNull()
  })
})

describe('parseCommissionGrid', () => {
  const view = {
    gridId: 'g1',
    effectiveFrom: '2026-11-20T00:00:00',
    tiers: [
      { fromEur: 0, rate: 0.07 },
      { fromEur: 100, rate: 0.06 },
    ],
    minimums: { eur: 1.0, XOF: 650 },
  }

  it('lit la grille en vigueur de la réponse', () => {
    const parsed = parseCommissionGrid({ current: view, next: null })
    expect(parsed).toEqual({
      gridId: 'g1',
      effectiveFrom: '2026-11-20T00:00:00',
      tiers: view.tiers,
      minimums: { EUR: 1, XOF: 650 },
    })
    expect(quoteCommission(100, 'EUR', parsed!)?.commission).toBe(7)
  })

  it('rend null sans grille en vigueur', () => {
    expect(parseCommissionGrid({ current: null, next: view })).toBeNull()
    expect(parseCommissionGrid({})).toBeNull()
    expect(parseCommissionGrid(null)).toBeNull()
    expect(parseCommissionGrid('x')).toBeNull()
    expect(parseCommissionGrid([])).toBeNull()
  })

  it('rend null pour une charge mal formée', () => {
    expect(parseCommissionGrid({ current: { ...view, tiers: [] } })).toBeNull()
    expect(parseCommissionGrid({ current: { ...view, tiers: 'x' } })).toBeNull()
    expect(parseCommissionGrid({ current: { ...view, minimums: null } })).toBeNull()
    expect(parseCommissionGrid({ current: { ...view, tiers: [{ fromEur: 0 }] } })).toBeNull()
    expect(parseCommissionGrid({ current: { ...view, tiers: [null] } })).toBeNull()
  })

  it('ignore les minimums illisibles et l’identité absente', () => {
    const parsed = parseCommissionGrid({ current: { tiers: view.tiers, minimums: { EUR: 1, USD: 'x', CAD: null } } })
    expect(parsed?.minimums).toEqual({ EUR: 1 })
    expect(parsed?.gridId).toBeUndefined()
    expect(parsed?.effectiveFrom).toBeUndefined()
  })
})
