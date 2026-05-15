// app/features/automations/composables/useAutomationHistory.ts
import { ref } from 'vue'
import { automationsService } from '@/features/automations/services/automationsService'
import type { AutomationHistoryEntry } from '@/features/automations/types/index'

export function useAutomationHistory() {
  const entries = ref<AutomationHistoryEntry[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = automationsService()

  async function fetchHistory(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      entries.value = await svc.listHistory()
    } catch {
      error.value = "Impossible de charger l'historique. Veuillez réessayer."
    } finally {
      isLoading.value = false
    }
  }

  return { entries, isLoading, error, fetchHistory }
}
