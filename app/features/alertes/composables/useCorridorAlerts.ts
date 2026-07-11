// app/features/alertes/composables/useCorridorAlerts.ts
import { ref } from 'vue'
import { alertsService } from '@/features/alertes/services/alertsService'
import type { CorridorAlert, CreateCorridorAlertPayload } from '@/features/alertes/types/index'

export function useCorridorAlerts() {
  const alerts = ref<CorridorAlert[]>([])
  const isLoading = ref(false)
  const isMutating = ref(false)
  const error = ref<string | null>(null)

  const svc = alertsService()

  async function fetchAlerts(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      alerts.value = await svc.listAlerts()
    } catch {
      error.value = 'Impossible de charger tes alertes.'
    } finally {
      isLoading.value = false
    }
  }

  async function addAlert(payload: CreateCorridorAlertPayload): Promise<void> {
    isMutating.value = true
    try {
      await svc.createAlert(payload)
      await fetchAlerts()
    } finally {
      isMutating.value = false
    }
  }

  async function toggle(alert: CorridorAlert): Promise<void> {
    isMutating.value = true
    try {
      await svc.toggleAlert(alert)
      await fetchAlerts()
    } finally {
      isMutating.value = false
    }
  }

  async function remove(id: string): Promise<void> {
    isMutating.value = true
    try {
      await svc.deleteAlert(id)
      await fetchAlerts()
    } finally {
      isMutating.value = false
    }
  }

  return { alerts, isLoading, isMutating, error, fetchAlerts, addAlert, toggle, remove }
}
