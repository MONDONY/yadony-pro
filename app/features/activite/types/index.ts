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
  grossRevenue: number
  commission: number
  netRevenue: number
}

export interface ActivityAnalytics {
  period: ActivityPeriod
  kpis: ActivityKpi[]
  transactions: TransactionRow[]
}

export type FiscalExportFormat = 'pdf' | 'csv'
export type FiscalExportType = 'summary' | 'transactions' | 'dac7'
