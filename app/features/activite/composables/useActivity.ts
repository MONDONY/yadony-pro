import { ref } from 'vue'
import { activityService } from '@/features/activite/services/activityService'
import type { ActivityAnalytics, ActivityPeriod, FiscalExportFormat, FiscalExportType } from '@/features/activite/types/index'

export function useActivity() {
  const analytics = ref<ActivityAnalytics | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const period = ref<ActivityPeriod>('month')
  const isExporting = ref(false)

  const svc = activityService()

  async function fetchAnalytics(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      analytics.value = await svc.fetchAnalytics(period.value)
    } catch {
      error.value = "Impossible de charger les données d'activité. Veuillez réessayer."
    } finally {
      isLoading.value = false
    }
  }

  async function setPeriod(p: ActivityPeriod): Promise<void> {
    period.value = p
    await fetchAnalytics()
  }

  async function exportFiscal(format: FiscalExportFormat, type: FiscalExportType): Promise<void> {
    isExporting.value = true
    error.value = null
    try {
      const year = new Date().getFullYear()
      const blob = await svc.downloadFiscalExport(year, format, type)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dony-export-${year}-${type}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      error.value = "Impossible de générer l'export. Veuillez réessayer."
    } finally {
      isExporting.value = false
    }
  }

  return { analytics, isLoading, error, period, isExporting, fetchAnalytics, setPeriod, exportFiscal }
}
