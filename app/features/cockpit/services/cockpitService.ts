// app/features/cockpit/services/cockpitService.ts
import { useApi } from '@/composables/useApi'
import type { Analytics, CalendarStats } from '@/features/cockpit/types/index'

export function cockpitService() {
  const api = useApi()

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

  return { fetchAnalytics, fetchCalendar, fetchAutomationTodayCount }
}
