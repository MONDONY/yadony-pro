// tests/unit/features/wallet/walletService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/wallet/services/walletService')
  return mod.walletService
}

describe('walletService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('getBalance interroge GET /wallet/balance', async () => {
    mockApiFn.mockResolvedValue({
      balance: 42.5, currency: 'EUR',
      transactions: [{ type: 'TOPUP', amount: 20, balanceAfter: 42.5, paymentRef: 'pi_1', createdAt: '2026-07-01T10:00:00Z' }],
    })
    const svc = (await importService())()
    const res = await svc.getBalance()
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/balance', { query: { page: '0' } })
    expect(res.balance).toBe(42.5)
    expect(res.transactions).toHaveLength(1)
  })

  it('topup POSTe le montant et la méthode', async () => {
    mockApiFn.mockResolvedValue({ clientSecret: null, redirectUrl: 'https://wave.example/pay' })
    const svc = (await importService())()
    const res = await svc.topup(25, 'WAVE')
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/topup', {
      method: 'POST',
      body: { amount: 25, paymentMethod: 'WAVE' },
    })
    expect(res.redirectUrl).toBe('https://wave.example/pay')
  })

  it('createCardTopupSession POSTe le montant sur /wallet/topup/checkout-session', async () => {
    mockApiFn.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/cs_test' })
    const svc = (await importService())()
    const res = await svc.createCardTopupSession(25)
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/topup/checkout-session', {
      method: 'POST',
      body: { amount: 25 },
    })
    expect(res.url).toBe('https://checkout.stripe.com/c/pay/cs_test')
  })
})

describe('walletService — mobile money et remboursement', () => {
  async function svc() {
    vi.resetModules()
    const { walletService } = await import('@/features/wallet/services/walletService')
    return walletService()
  }

  it('cherche les réseaux par POST, le numéro dans le corps', async () => {
    mockApiFn.mockResolvedValue({ providers: [] })
    await (await svc()).getMobileMoneyProviders('+221771234567')
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/topup/providers', { method: 'POST', body: { phoneNumber: '+221771234567' } })
  })

  it('lance une recharge MOBILE_MONEY avec numéro et réseau', async () => {
    mockApiFn.mockResolvedValue({ topupId: 't' })
    await (await svc()).startMobileMoneyTopup({ amount: 5000, phoneNumber: '+221771234567', provider: 'WAVE_SEN' })
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/topup', {
      method: 'POST',
      body: { amount: 5000, paymentMethod: 'MOBILE_MONEY', phoneNumber: '+221771234567', provider: 'WAVE_SEN' },
    })
  })

  it('relit le statut, liste les recharges remboursables et les demandes', async () => {
    mockApiFn.mockResolvedValue([])
    const s = await svc()
    await s.getTopupStatus('t1')
    await s.listEligibleTopups('XOF')
    await s.listRefundRequests()
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/topup/t1/status', {})
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/XOF/refund-eligible-topups', {})
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/refund-requests', {})
  })

  it('demande un remboursement pour les recharges choisies', async () => {
    mockApiFn.mockResolvedValue({ id: 'r' })
    await (await svc()).requestRefund('EUR', ['a', 'b'])
    expect(mockApiFn).toHaveBeenCalledWith('/wallet/EUR/refund-request', { method: 'POST', body: { transactionIds: ['a', 'b'] } })
  })
})
