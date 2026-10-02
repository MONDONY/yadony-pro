export type ActivityPeriod = 'month' | 'quarter' | 'year'

export interface ActivityKpi {
  id: string
  label: string
  value: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

export interface TransactionRow {
  tripId: string
  corridor: string
  departureDate: string
  parcelCount: number
  /** Montants en unités MINEURES de `currency` (centimes EUR, unité pleine XOF). */
  grossRevenue: number
  commission: number
  netRevenue: number
  /** Devise de l'annonce — absente d'un backend pas encore déployé : repli EUR. */
  currency?: string
}

export interface ActivityAnalytics {
  period: ActivityPeriod
  kpis: ActivityKpi[]
  transactions: TransactionRow[]
}

export type FiscalExportFormat = 'pdf' | 'csv'
export type FiscalExportType = 'summary' | 'transactions' | 'dac7'

/** Périodes du résumé d'activité (`GET /travelers/me/trips-summary*`). */
export type SummaryPeriod = '7d' | '30d' | '12m'

export interface TripsSummary {
  activeTrips: number
  kgSold: number
  /** Dans `revenueCurrency` ; estimé quand `revenueConverted` est vrai. */
  revenue: number
  tripsPublished: number
  parcelsSent: number
  period: SummaryPeriod
  revenueCurrency: string
  revenueConverted: boolean
}

export type RevenueRail = 'CARD' | 'MOBILE_MONEY' | 'CASH'

export interface RevenueItem {
  tripId: string
  departureCity: string
  arrivalCity: string
  date: string
  weightKg: number
  rail: RevenueRail
  /** En unités principales de la devise du groupe. */
  amount: number
}

export interface RevenueGroup {
  currency: string
  total: number
  deliveries: number
  items: RevenueItem[]
}

export interface RevenueDetails {
  period: SummaryPeriod
  deliveries: number
  groups: RevenueGroup[]
}

export interface KgSoldTrip {
  tripId: string
  departureCity: string
  arrivalCity: string
  date: string
  parcels: number
  kg: number
}

export interface KgSoldDetails {
  period: SummaryPeriod
  totalKg: number
  parcels: number
  trips: KgSoldTrip[]
}
