// app/features/cancellation/services/cancellationService.ts
// Toute la logique d'annulation/incident vit ici (miroir du package back `cancellation/`).
import { useApi } from '@/composables/useApi'
import type { ReturnStatus } from '@/features/cancellation/types/index'

export function cancellationService() {
  const api = useApi()

  /** L'expéditeur ne s'est pas présenté à la remise (colis ACCEPTED). */
  async function reportNoShow(bidId: string): Promise<void> {
    await api<void>(`/cancellations/bids/${bidId}/report-noshow`, { method: 'POST' })
  }

  /** Le voyageur annule un colis déjà remis (HANDED_OVER/IN_TRANSIT) → retour à organiser. */
  async function cancelAfterHandover(bidId: string): Promise<void> {
    await api(`/bids/${bidId}/cancel-after-handover`, { method: 'POST' })
  }

  /** Confirme le retour du colis avec le code à 6 chiffres fourni par l'expéditeur. */
  async function confirmReturn(bidId: string, returnCode: string): Promise<ReturnStatus> {
    return api<ReturnStatus>(`/cancellations/bids/${bidId}/confirm-return`, {
      method: 'POST',
      body: { returnCode },
    })
  }

  return { reportNoShow, cancelAfterHandover, confirmReturn }
}
