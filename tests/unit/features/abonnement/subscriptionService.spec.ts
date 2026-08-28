import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

const fakeSubscription = {
  active: true,
  status: 'ACTIVE' as const,
  source: 'STRIPE',
  billingCycle: 'MONTHLY' as const,
  currentPeriodEnd: '2026-09-28T00:00:00Z',
  cancelAtPeriodEnd: false,
  graceExpiresAt: null,
}

describe('subscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchSubscription calls GET /billing/subscription', async () => {
    mockApiFn.mockResolvedValue(fakeSubscription)
    const { subscriptionService } = await import('@/features/abonnement/services/subscriptionService')
    const svc = subscriptionService()
    const result = await svc.fetchSubscription()
    expect(mockApiFn).toHaveBeenCalledWith('/billing/subscription')
    expect(result).toEqual(fakeSubscription)
  })

  it('createCheckoutSession POSTs to /billing/checkout-session with the requested cycle', async () => {
    const fakeCheckoutUrl = { url: 'https://checkout.stripe.com/session-abc' }
    mockApiFn.mockResolvedValue(fakeCheckoutUrl)
    const { subscriptionService } = await import('@/features/abonnement/services/subscriptionService')
    const svc = subscriptionService()
    const result = await svc.createCheckoutSession('YEARLY')
    expect(mockApiFn).toHaveBeenCalledWith('/billing/checkout-session', {
      method: 'POST',
      query: { cycle: 'YEARLY' },
    })
    expect(result).toEqual(fakeCheckoutUrl)
  })

  it('createPortalSession POSTs to /billing/portal-session', async () => {
    const fakePortalUrl = { url: 'https://billing.stripe.com/portal-abc' }
    mockApiFn.mockResolvedValue(fakePortalUrl)
    const { subscriptionService } = await import('@/features/abonnement/services/subscriptionService')
    const svc = subscriptionService()
    const result = await svc.createPortalSession()
    expect(mockApiFn).toHaveBeenCalledWith('/billing/portal-session', { method: 'POST' })
    expect(result).toEqual(fakePortalUrl)
  })
})
