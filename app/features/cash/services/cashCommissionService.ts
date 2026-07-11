// app/features/cash/services/cashCommissionService.ts
import { useApi } from '@/composables/useApi'

export interface CommissionMethod {
  brand: string
  last4: string
  expMonth: number
  expYear: number
  expirationStatus: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | string
}

export function cashCommissionService() {
  const api = useApi()

  /** Carte enregistrée pour prélever la commission des paiements cash (204 → null). */
  async function getMethod(): Promise<CommissionMethod | null> {
    const res = await api<CommissionMethod | undefined>('/traveler/commission-method', {})
    return res?.last4 ? res : null
  }

  async function detachMethod(): Promise<void> {
    await api<void>('/traveler/commission-method', { method: 'DELETE' })
  }

  return { getMethod, detachMethod }
}
