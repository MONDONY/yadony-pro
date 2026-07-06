// app/features/pricing/types/index.ts

export interface MarketPrice {
  median: number | null
  currency: string
}

export interface CommissionRate {
  rate: number
}

export interface PricingCorridor {
  key: string
  label: string
}

export const PRICING_CORRIDORS: PricingCorridor[] = [
  { key: 'PARIS_DAKAR', label: 'Paris → Dakar' },
  { key: 'PARIS_ABIDJAN', label: 'Paris → Abidjan' },
  { key: 'PARIS_BAMAKO', label: 'Paris → Bamako' },
  { key: 'PARIS_DOUALA', label: 'Paris → Douala' },
  { key: 'LYON_ABIDJAN', label: 'Lyon → Abidjan' },
  { key: 'MARSEILLE_DAKAR', label: 'Marseille → Dakar' },
]

export type MarketComparison = 'above' | 'below' | 'aligned' | 'unknown'

/** Net revenue per kg after the platform commission. */
export function netPerKg(pricePerKg: number, commissionRate: number): number {
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0) return 0
  return Math.round(pricePerKg * (1 - commissionRate) * 100) / 100
}

/** Compares a price/kg to the market median (±5% considered aligned). */
export function compareToMarket(pricePerKg: number, median: number | null): MarketComparison {
  if (median === null || median <= 0 || !Number.isFinite(pricePerKg)) return 'unknown'
  const delta = (pricePerKg - median) / median
  if (Math.abs(delta) <= 0.05) return 'aligned'
  return delta > 0 ? 'above' : 'below'
}
