// tests/unit/features/wallet/useWallet.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSvc = {
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
})
