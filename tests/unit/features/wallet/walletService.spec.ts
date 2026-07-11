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
})
