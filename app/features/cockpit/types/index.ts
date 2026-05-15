// app/features/cockpit/types/index.ts

export type UrgentActionSeverity = 'red' | 'orange' | 'blue' | 'green'

export interface Analytics {
  revenueNetCurrentMonth: number
  averageRating: number
  colisGeres: number
  actionsRequises: number
}

export interface CalendarStats {
  activeTripsCount: number
  totalTripsThisMonth: number
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
