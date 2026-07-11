// app/features/wallet/services/walletService.ts
import { useApi } from '@/composables/useApi'
import type { WalletBalance, WalletTopupResult, TopupMethod } from '@/features/wallet/types/index'

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

  return { getBalance, topup }
}
