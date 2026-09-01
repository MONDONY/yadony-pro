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
