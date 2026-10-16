import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

/** Code ProblemDetail du 503 renvoyé par le back pendant la maintenance. */
export const MAINTENANCE_PROBLEM_CODE = 'maintenance'

/** Réponse de `GET /config/maintenance`. */
export interface MaintenanceStatus {
  enabled: boolean
  message: string | null
  estimatedEndAt: string | null
  exempt: boolean
}

interface MaintenanceState {
  active: boolean
  message: string | null
  estimatedEndAt: string | null
  checking: boolean
}

/** Vrai pour le corps du 503 de maintenance (dony-back `MaintenanceFilter`). */
export function isMaintenanceProblem(status: number | undefined, data: unknown): boolean {
  return status === 503 && typeof data === 'object' && data !== null
    && (data as { code?: unknown }).code === MAINTENANCE_PROBLEM_CODE
}

/**
 * Mode maintenance piloté depuis le back-office : tant qu'il est actif, le portail
 * n'affiche plus que la page de maintenance (voir `app.vue`). Deux entrées l'ouvrent :
 * le 503 `maintenance` d'une requête (`useApi`) et la relecture de
 * `GET /config/maintenance` (`plugins/maintenance.client.ts`), qui fait foi : un
 * compte exempté n'est jamais bloqué, et c'est elle qui referme la page.
 */
export const useMaintenanceStore = defineStore('maintenance', {
  state: (): MaintenanceState => ({
    active: false,
    message: null,
    estimatedEndAt: null,
    checking: false,
  }),
  actions: {
    /** 503 reçu : page affichée tout de suite, la relecture affine ensuite. */
    showFromProblem(data: unknown) {
      const problem = (data ?? {}) as { estimatedEndAt?: unknown }
      this.active = true
      this.estimatedEndAt = typeof problem.estimatedEndAt === 'string' ? problem.estimatedEndAt : null
      void this.check()
    },
    apply(status: MaintenanceStatus) {
      const blocks = status.enabled && !status.exempt
      this.active = blocks
      this.message = blocks ? status.message : null
      this.estimatedEndAt = blocks ? status.estimatedEndAt : null
    },
    /** Relit l'état faisant foi ; une erreur réseau garde l'état courant. */
    async check() {
      try {
        this.apply(await useApi()<MaintenanceStatus>('/config/maintenance'))
      } catch {
        // Hors ligne ou back injoignable : rien ne change.
      }
    },
    async retry() {
      this.checking = true
      try {
        await this.check()
      } finally {
        this.checking = false
      }
    },
  },
})
