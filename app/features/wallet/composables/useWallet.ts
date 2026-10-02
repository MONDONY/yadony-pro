// app/features/wallet/composables/useWallet.ts
import { ref } from 'vue'
import { walletService } from '@/features/wallet/services/walletService'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import type { CardTopupOutcome, WalletCurrencyBalance, WalletTransaction, TopupMethod } from '@/features/wallet/types/index'

export function useWallet() {
  const balance = ref<number | null>(null)
  const currency = ref('EUR')
  const transactions = ref<WalletTransaction[]>([])
  const balances = ref<WalletCurrencyBalance[]>([])
  const estimatedTotal = ref<number | null>(null)
  const estimateComplete = ref(true)
  const isLoading = ref(false)
  const isToppingUp = ref(false)
  const error = ref<string | null>(null)

  const svc = walletService()

  async function fetchBalance(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const res = await svc.getBalance()
      balance.value = Number(res.balance)
      currency.value = res.currency
      transactions.value = res.transactions
      balances.value = (res.balances ?? []).map((b) => ({ ...b, balance: Number(b.balance) }))
      estimatedTotal.value = res.estimatedTotal == null ? null : Number(res.estimatedTotal)
      estimateComplete.value = res.estimateComplete ?? true
    } catch {
      error.value = 'Impossible de charger ton portefeuille.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Lance une recharge générique et renvoie l'URL de redirection éventuelle.
   *
   * Plus appelée par le portail : la carte passe par `startCardTopup` (Stripe Checkout)
   * et le mobile money par `useMobileMoneyTopup`. Les anciens rails Wave et Orange Money
   * sont refusés par le backend (422 « mobile-money-topup-retired »).
   */
  async function startTopup(amount: number, method: TopupMethod): Promise<string | null> {
    isToppingUp.value = true
    try {
      const res = await svc.topup(amount, method)
      return res.redirectUrl ?? null
    } finally {
      isToppingUp.value = false
    }
  }

  /**
   * Recharge par carte depuis le portail : le serveur ouvre une session Stripe
   * Checkout hébergée et renvoie son URL. Un 404 signifie un serveur qui ne
   * connaît pas encore cette recharge : l'écran renvoie alors vers l'app mobile
   * au lieu d'afficher une erreur.
   */
  async function startCardTopup(amount: number): Promise<CardTopupOutcome> {
    isToppingUp.value = true
    try {
      const session = await svc.createCardTopupSession(amount)
      if (!session?.url) return { status: 'error', message: 'Impossible de préparer la recharge. Réessaie.' }
      return { status: 'redirect', url: session.url }
    } catch (e) {
      const status = (e as { status?: number; response?: { status?: number } } | null)?.status
        ?? (e as { response?: { status?: number } } | null)?.response?.status
      if (status === 404 || status === 405) return { status: 'unavailable' }
      const problem = extractProblem(e)
      const message = problem.detail && !TECHNICAL_ERROR_PATTERN.test(problem.detail)
        ? problem.detail
        : 'Impossible de préparer la recharge. Réessaie.'
      return { status: 'error', message }
    } finally {
      isToppingUp.value = false
    }
  }

  return { balance, currency, transactions, balances, estimatedTotal, estimateComplete, isLoading, isToppingUp, error, fetchBalance, startTopup, startCardTopup }
}
