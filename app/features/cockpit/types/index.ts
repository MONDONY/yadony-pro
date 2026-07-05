// app/features/cockpit/types/index.ts

export type UrgentActionSeverity = 'red' | 'orange' | 'blue' | 'green'

export interface AnalyticsKpi {
  id: string
  label: string
  value: string
  trend?: string | null
  trendValue?: string | null
}

export interface Analytics {
  period: string
  kpis: AnalyticsKpi[]
}

export interface CalendarStats {
  activeTripsCount: number
  totalTripsThisMonth: number
}

export interface TravelerStatsDestination {
  from: string
  to: string
  count: number
}

/** Vue d'ensemble tout-temps du voyageur — miroir de TravelerStatsDto côté back. */
export interface TravelerStats {
  monthlyRevenue: number
  totalRevenue: number
  monthlyTrips: number
  monthlyParcelsDelivered: number
  acceptanceRate: number // ratio 0..1
  averageRating: number
  topDestinations: TravelerStatsDestination[]
  totalTripsCompleted: number
  activeTrips: number
  totalParcelsDelivered: number
  parcelsInTransit: number
  ratingCount: number
}

export interface UrgentAction {
  id: string
  severity: UrgentActionSeverity
  label: string
  detail: string
  actionLabel?: string
  actionHref?: string
}

export interface KpiData {
  id: string
  label: string
  value: string
  subLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}
