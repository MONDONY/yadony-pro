// app/features/wallet/composables/useWalletRefund.ts
import { ref } from 'vue'
import { walletService } from '@/features/wallet/services/walletService'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import type { EligibleTopup, RefundRequestSummary } from '@/features/wallet/types/index'

/** Remboursement du solde d'un portefeuille vers le moyen de paiement d'origine. */
export function useWalletRefund(onRequested?: () => void) {
  const svc = walletService()

  const eligible = ref<EligibleTopup[]>([])
  const selected = ref<string[]>([])
  const requests = ref<RefundRequestSummary[]>([])
  const isLoading = ref(false)
  const isRequesting = ref(false)
  const error = ref<string | null>(null)

  async function loadEligible(currency: string): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      eligible.value = await svc.listEligibleTopups(currency)
      selected.value = eligible.value.map((t) => t.id)
    } catch {
      eligible.value = []
      error.value = 'Impossible de charger les recharges remboursables.'
    } finally {
      isLoading.value = false
    }
  }

  async function loadRequests(): Promise<void> {
    try {
      requests.value = await svc.listRefundRequests()
    } catch {
      requests.value = []
    }
  }

  function toggle(id: string): void {
    selected.value = selected.value.includes(id)
      ? selected.value.filter((s) => s !== id)
      : [...selected.value, id]
  }

  /** Demande le remboursement des recharges cochées ; retourne la demande créée ou null. */
  async function request(currency: string): Promise<RefundRequestSummary | null> {
    if (selected.value.length === 0) return null
    isRequesting.value = true
    error.value = null
    try {
      const created = await svc.requestRefund(currency, selected.value)
      requests.value = [created, ...requests.value]
      eligible.value = []
      selected.value = []
      onRequested?.()
      return created
    } catch (e) {
      const { detail } = extractProblem(e)
      error.value = detail && !TECHNICAL_ERROR_PATTERN.test(detail)
        ? detail
        : 'Impossible de demander le remboursement. Réessaie.'
      return null
    } finally {
      isRequesting.value = false
    }
  }

  return { eligible, selected, requests, isLoading, isRequesting, error, loadEligible, loadRequests, toggle, request }
}
