// app/features/alertes/services/alertsService.ts
import { useApi } from '@/composables/useApi'
import type { CorridorAlert, CreateCorridorAlertPayload } from '@/features/alertes/types/index'

// Côté dony-pro l'utilisateur est un voyageur : ses alertes cherchent des colis.
const DIRECTION = 'TRAVELER_WANTS_PACKAGES' as const

export function alertsService() {
  const api = useApi()

  async function listAlerts(): Promise<CorridorAlert[]> {
    return api<CorridorAlert[]>('/me/corridor-alerts', {
      query: { direction: DIRECTION },
    })
  }

  async function createAlert(payload: CreateCorridorAlertPayload): Promise<CorridorAlert> {
    return api<CorridorAlert>('/me/corridor-alerts', {
      method: 'POST',
      body: { ...payload, direction: DIRECTION, active: true },
    })
  }

  /** Active/désactive une alerte en renvoyant son corridor inchangé. */
  async function toggleAlert(alert: CorridorAlert): Promise<CorridorAlert> {
    return api<CorridorAlert>(`/me/corridor-alerts/${alert.id}`, {
      method: 'PUT',
      body: {
        departureCity: alert.departureCity,
        arrivalCity: alert.arrivalCity,
        dateFrom: alert.dateFrom,
        dateTo: alert.dateTo,
        minWeightKg: alert.minWeightKg,
        direction: alert.direction,
        active: !alert.active,
      },
    })
  }

  async function deleteAlert(id: string): Promise<void> {
    await api<void>(`/me/corridor-alerts/${id}`, { method: 'DELETE' })
  }

  return { listAlerts, createAlert, toggleAlert, deleteAlert }
}
