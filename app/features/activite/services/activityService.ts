import { useApi } from '@/composables/useApi'
import type {
  ActivityAnalytics, ActivityPeriod, FiscalExportFormat, FiscalExportType,
  KgSoldDetails, RevenueDetails, SummaryPeriod, TripsSummary,
} from '@/features/activite/types/index'

export function activityService() {
  const api = useApi()

  async function fetchAnalytics(period: ActivityPeriod): Promise<ActivityAnalytics> {
    return api<ActivityAnalytics>('/travelers/me/analytics', { query: { period } })
  }

  async function downloadFiscalExport(
    year: number,
    format: FiscalExportFormat,
    type: FiscalExportType,
  ): Promise<Blob> {
    return api<Blob>('/travelers/me/fiscal-export', {
      query: { year, format, type },
      responseType: 'blob',
    })
  }

  async function fetchSummary(period: SummaryPeriod): Promise<TripsSummary> {
    return api<TripsSummary>('/travelers/me/trips-summary', { query: { period } })
  }

  async function fetchRevenueDetails(period: SummaryPeriod): Promise<RevenueDetails> {
    return api<RevenueDetails>('/travelers/me/trips-summary/revenues', { query: { period } })
  }

  async function fetchKgSoldDetails(period: SummaryPeriod): Promise<KgSoldDetails> {
    return api<KgSoldDetails>('/travelers/me/trips-summary/kg-sold', { query: { period } })
  }

  return { fetchAnalytics, downloadFiscalExport, fetchSummary, fetchRevenueDetails, fetchKgSoldDetails }
}
