// app/features/cockpit/services/cockpitService.ts
import { useApi } from '@/composables/useApi'
import type { Analytics, CalendarStats, TravelerStats } from '@/features/cockpit/types/index'

export function cockpitService() {
  const api = useApi()

  // Vue d'ensemble tout-temps du cockpit (revenus totaux, trajets, colis, taux…).
  async function fetchStats(): Promise<TravelerStats> {
    return api<TravelerStats>('/travelers/me/stats')
  }

  async function fetchAnalytics(): Promise<Analytics> {
    return api<Analytics>('/travelers/me/analytics')
  }

  async function fetchCalendar(): Promise<CalendarStats> {
    return api<CalendarStats>('/travelers/me/calendar')
  }

  async function fetchAutomationTodayCount(): Promise<number> {
    const result = await api<{ count: number }>('/travelers/me/automation-history/today-count')
    return result.count
  }

  return { fetchStats, fetchAnalytics, fetchCalendar, fetchAutomationTodayCount }
}
