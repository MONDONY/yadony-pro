// app/features/wallet/services/walletService.ts
import { useApi } from '@/composables/useApi'
import type {
  EligibleTopup, MobileMoneyProviders, MobileMoneyTopupRequest, MobileMoneyTopupStarted,
  MobileMoneyTopupState, RefundRequestSummary, WalletBalance, WalletCardTopupSession,
  WalletTopupResult, TopupMethod,
} from '@/features/wallet/types/index'

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

  /** Réseaux mobile money utilisables depuis ce numéro (POST : le numéro ne voyage jamais dans l'URL). */
  async function getMobileMoneyProviders(phoneNumber: string): Promise<MobileMoneyProviders> {
    return api<MobileMoneyProviders>('/wallet/topup/providers', { method: 'POST', body: { phoneNumber } })
  }

  async function startMobileMoneyTopup(req: MobileMoneyTopupRequest): Promise<MobileMoneyTopupStarted> {
    return api<MobileMoneyTopupStarted>('/wallet/topup', {
      method: 'POST',
      body: { amount: req.amount, paymentMethod: 'MOBILE_MONEY', phoneNumber: req.phoneNumber, provider: req.provider },
    })
  }

  async function getTopupStatus(topupId: string): Promise<MobileMoneyTopupState> {
    return api<MobileMoneyTopupState>(`/wallet/topup/${topupId}/status`, {})
  }

  async function listEligibleTopups(currency: string): Promise<EligibleTopup[]> {
    return api<EligibleTopup[]>(`/wallet/${currency}/refund-eligible-topups`, {})
  }

  /** Sans identifiant, le serveur rembourse tout ce qui est remboursable dans la devise. */
  async function requestRefund(currency: string, transactionIds: string[] = []): Promise<RefundRequestSummary> {
    return api<RefundRequestSummary>(`/wallet/${currency}/refund-request`, {
      method: 'POST',
      body: { transactionIds },
    })
  }

  async function listRefundRequests(): Promise<RefundRequestSummary[]> {
    return api<RefundRequestSummary[]>('/wallet/refund-requests', {})
  }

  return {
    getBalance, topup, createCardTopupSession, getMobileMoneyProviders, startMobileMoneyTopup,
    getTopupStatus, listEligibleTopups, requestRefund, listRefundRequests,
  }
}
