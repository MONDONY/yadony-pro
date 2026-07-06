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
