import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/payout/services/payoutService')
  return mod.payoutService
}

describe('payoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchAccount calls GET /payments/connect/account', async () => {
    mockApiFn.mockResolvedValue({ stripeAccountId: 'acct_1', stripeAccountStatus: 'ONBOARDING_COMPLETE' })
    const svc = (await importService())()
    const result = await svc.fetchAccount()
    expect(mockApiFn).toHaveBeenCalledWith('/payments/connect/account')
    expect(result.stripeAccountStatus).toBe('ONBOARDING_COMPLETE')
  })

  it('createAccount POSTs /payments/connect/account', async () => {
    mockApiFn.mockResolvedValue({ stripeAccountId: 'acct_1', stripeAccountStatus: 'PENDING_ONBOARDING' })
    const svc = (await importService())()
    await svc.createAccount()
    expect(mockApiFn).toHaveBeenCalledWith('/payments/connect/account', { method: 'POST' })
  })

  it('createOnboardingLink POSTs /payments/connect/onboarding-link', async () => {
    mockApiFn.mockResolvedValue({ url: 'https://connect.stripe.com/setup/x' })
    const svc = (await importService())()
    const result = await svc.createOnboardingLink()
    expect(mockApiFn).toHaveBeenCalledWith('/payments/connect/onboarding-link', { method: 'POST' })
    expect(result.url).toContain('stripe.com')
  })

  it('refreshAccount POSTs /payments/connect/refresh', async () => {
    mockApiFn.mockResolvedValue({ stripeAccountId: 'acct_1', stripeAccountStatus: 'ONBOARDING_COMPLETE' })
    const svc = (await importService())()
    await svc.refreshAccount()
    expect(mockApiFn).toHaveBeenCalledWith('/payments/connect/refresh', { method: 'POST' })
  })
})

describe('payoutService — mobile money', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockApiFn.mockResolvedValue({})
  })

  async function svc() {
    const mod = await import('@/features/payout/services/payoutService')
    return mod.payoutService()
  }

  it('lit le compte, cherche les réseaux par POST et active avec numéro et réseaux', async () => {
    const s = await svc()
    await s.fetchMobileMoneyAccount()
    await s.lookupMobileMoneyProviders('+221771234567')
    await s.activateMobileMoney('+221771234567', ['WAVE_SEN'])
    expect(mockApiFn).toHaveBeenCalledWith('/payments/mobile-money/account')
    expect(mockApiFn).toHaveBeenCalledWith('/payments/mobile-money/providers', { method: 'POST', body: { phoneNumber: '+221771234567' } })
    expect(mockApiFn).toHaveBeenCalledWith('/payments/mobile-money/account', { method: 'POST', body: { phoneNumber: '+221771234567', providers: ['WAVE_SEN'] } })
  })

  it('met à jour les réseaux par PUT et désactive par DELETE', async () => {
    const s = await svc()
    await s.updateMobileMoneyProviders(['WAVE_SEN', 'ORANGE_SEN'])
    await s.disableMobileMoney()
    expect(mockApiFn).toHaveBeenCalledWith('/payments/mobile-money/account/providers', { method: 'PUT', body: { providers: ['WAVE_SEN', 'ORANGE_SEN'] } })
    expect(mockApiFn).toHaveBeenCalledWith('/payments/mobile-money/account', { method: 'DELETE' })
  })
})
