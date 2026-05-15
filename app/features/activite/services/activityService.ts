import { useApi } from '@/composables/useApi'
import type { ActivityAnalytics, ActivityPeriod, FiscalExportFormat, FiscalExportType } from '@/features/activite/types/index'

export function activityService() {
  const api = useApi()

  async function fetchAnalytics(period: ActivityPeriod): Promise<ActivityAnalytics> {
    return api.get('/travelers/me/analytics', { params: { period } })
  }

  async function downloadFiscalExport(
    year: number,
    format: FiscalExportFormat,
    type: FiscalExportType,
  ): Promise<Blob> {
    return api.get('/travelers/me/fiscal-export', {
      params: { year, format, type },
      responseType: 'blob',
    })
  }

  return { fetchAnalytics, downloadFiscalExport }
}
