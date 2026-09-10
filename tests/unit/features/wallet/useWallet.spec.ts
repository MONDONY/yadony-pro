// tests/unit/features/wallet/useWallet.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSvc = {
  createCardTopupSession: vi.fn(),
  getBalance: vi.fn(),
  topup: vi.fn(),
}

vi.mock('@/features/wallet/services/walletService', () => ({
  walletService: () => mockSvc,
}))

async function importComposable() {
  const mod = await import('@/features/wallet/composables/useWallet')
  return mod.useWallet
}

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchBalance charge solde et transactions', async () => {
    mockSvc.getBalance.mockResolvedValue({ balance: 10, currency: 'EUR', transactions: [] })
    const { balance, currency, fetchBalance } = (await importComposable())()
    await fetchBalance()
    expect(balance.value).toBe(10)
    expect(currency.value).toBe('EUR')
  })

  it('fetchBalance pose une erreur en cas d’échec', async () => {
    mockSvc.getBalance.mockRejectedValue(new Error('boom'))
    const { error, fetchBalance } = (await importComposable())()
    await fetchBalance()
    expect(error.value).toBe('Impossible de charger ton portefeuille.')
  })

  it('startTopup renvoie l’URL de redirection pour Wave/Orange Money', async () => {
    mockSvc.topup.mockResolvedValue({ clientSecret: null, redirectUrl: 'https://wave.example/pay' })
    const { startTopup } = (await importComposable())()
    const url = await startTopup(25, 'WAVE')
    expect(mockSvc.topup).toHaveBeenCalledWith(25, 'WAVE')
    expect(url).toBe('https://wave.example/pay')
  })

  it('startCardTopup renvoie l’URL de la session Checkout', async () => {
    mockSvc.createCardTopupSession.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/cs_test' })
    const { startCardTopup, isToppingUp } = (await importComposable())()
    const outcome = await startCardTopup(25)
    expect(mockSvc.createCardTopupSession).toHaveBeenCalledWith(25)
    expect(outcome).toEqual({ status: 'redirect', url: 'https://checkout.stripe.com/c/pay/cs_test' })
    expect(isToppingUp.value).toBe(false)
  })

  it('startCardTopup signale un serveur qui ne connaît pas encore la recharge web', async () => {
    mockSvc.createCardTopupSession.mockRejectedValue({ status: 404, data: { detail: 'Not Found' } })
    const { startCardTopup } = (await importComposable())()
    expect(await startCardTopup(25)).toEqual({ status: 'unavailable' })
  })

  it('startCardTopup remonte le message lisible du serveur, sinon un message générique', async () => {
    mockSvc.createCardTopupSession.mockRejectedValue({ status: 502, data: { code: 'wallet-topup-stripe-error', detail: 'Impossible de préparer la recharge du wallet. Veuillez réessayer.' } })
    const { startCardTopup } = (await importComposable())()
    expect(await startCardTopup(25)).toEqual({ status: 'error', message: 'Impossible de préparer la recharge du wallet. Veuillez réessayer.' })
    mockSvc.createCardTopupSession.mockRejectedValue({ status: 500, data: { detail: '[POST] "https://api/x": 500' } })
    expect(await startCardTopup(25)).toEqual({ status: 'error', message: 'Impossible de préparer la recharge. Réessaie.' })
  })
})
