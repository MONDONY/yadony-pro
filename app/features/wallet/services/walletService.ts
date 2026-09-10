// app/features/wallet/services/walletService.ts
import { useApi } from '@/composables/useApi'
import type { WalletBalance, WalletCardTopupSession, WalletTopupResult, TopupMethod } from '@/features/wallet/types/index'

export function walletService() {
  const api = useApi()

  async function getBalance(page = 0): Promise<WalletBalance> {
    return api<WalletBalance>('/wallet/balance', { query: { page: String(page) } })
  }

  async function topup(amount: number, paymentMethod: TopupMethod): Promise<WalletTopupResult> {
    return api<WalletTopupResult>('/wallet/topup', {
      method: 'POST',
      body: { amount, paymentMethod },
    })
  }

  /** Recharge par carte depuis le web : le serveur ouvre une session Stripe Checkout. */
  async function createCardTopupSession(amount: number): Promise<WalletCardTopupSession> {
    return api<WalletCardTopupSession>('/wallet/topup/checkout-session', {
      method: 'POST',
      body: { amount },
    })
  }

  return { getBalance, topup, createCardTopupSession }
}
