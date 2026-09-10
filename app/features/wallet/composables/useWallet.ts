// app/features/wallet/composables/useWallet.ts
import { ref } from 'vue'
import { walletService } from '@/features/wallet/services/walletService'
import type { WalletTransaction, TopupMethod } from '@/features/wallet/types/index'

export function useWallet() {
  const balance = ref<number | null>(null)
  const currency = ref('EUR')
  const transactions = ref<WalletTransaction[]>([])
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
    } catch {
      error.value = 'Impossible de charger ton portefeuille.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Lance une recharge et renvoie l'URL de redirection éventuelle.
   *
   * Plus appelée par le portail : le backend refuse les rails Wave et Orange
   * Money (422 « mobile-money-topup-retired ») et répond à la carte par un
   * clientSecret de PaymentIntent que seul un SDK Stripe sait confirmer. La
   * recharge se fait depuis l'app mobile tant que Stripe.js n'est pas intégré.
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

  return { balance, currency, transactions, isLoading, isToppingUp, error, fetchBalance, startTopup }
}
