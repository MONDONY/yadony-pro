// app/features/disputes/services/disputesService.ts
import { useApi } from '@/composables/useApi'
import type { Dispute } from '@/features/disputes/types/index'

export function disputesService() {
  const api = useApi()

  /** Litiges (lecture seule) où l'utilisateur courant est le voyageur. */
  async function getMyDisputes(): Promise<Dispute[]> {
    return api<Dispute[]>('/disputes/me', {})
  }

  return { getMyDisputes }
}
