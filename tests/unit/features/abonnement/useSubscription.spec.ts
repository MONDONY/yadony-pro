import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ProSubscription } from '@/features/abonnement/types/index'

const mockFetchSubscription = vi.fn()
const mockCreateCheckoutSession = vi.fn()
const mockCreatePortalSession = vi.fn()

vi.mock('@/features/abonnement/services/subscriptionService', () => ({
  subscriptionService: () => ({
    fetchSubscription: mockFetchSubscription,
    createCheckoutSession: mockCreateCheckoutSession,
    createPortalSession: mockCreatePortalSession,
  }),
}))

const activeSubscription: ProSubscription = {
  active: true,
  status: 'ACTIVE',
  source: 'STRIPE',
  billingCycle: 'MONTHLY',
  currentPeriodEnd: '2026-09-28T00:00:00Z',
  cancelAtPeriodEnd: false,
  graceExpiresAt: null,
}

function problemError(code: string | null, detail: string | null = null) {
  return { data: { code, detail } }
}

async function importComposable() {
  const mod = await import('@/features/abonnement/composables/useSubscription')
  return mod.useSubscription
}

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('initializes with no subscription and idle state', async () => {
    const useSubscription = await importComposable()
    const { subscription, isLoading, actionLoading, error } = useSubscription()
    expect(subscription.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(actionLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('fetchSubscription loads the subscription and toggles isLoading', async () => {
    mockFetchSubscription.mockResolvedValue(activeSubscription)
    const useSubscription = await importComposable()
    const { subscription, isLoading, fetchSubscription } = useSubscription()
    const p = fetchSubscription()
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
    expect(subscription.value).toEqual(activeSubscription)
  })

  it('sets a generic error message when fetchSubscription rejects', async () => {
    mockFetchSubscription.mockRejectedValue(new Error('network'))
    const useSubscription = await importComposable()
    const { error, fetchSubscription } = useSubscription()
    await fetchSubscription()
    expect(error.value).toBe('Impossible de charger votre abonnement. Veuillez réessayer.')
  })

  it('subscribe returns the checkout URL on success and toggles actionLoading', async () => {
    mockCreateCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.com/session/abc' })
    const useSubscription = await importComposable()
    const { actionLoading, subscribe } = useSubscription()
    const p = subscribe('MONTHLY')
    expect(actionLoading.value).toBe(true)
    const url = await p
    expect(actionLoading.value).toBe(false)
    expect(url).toBe('https://checkout.stripe.com/session/abc')
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith('MONTHLY')
  })

  it('subscribe returns null and maps subscription-already-active to a French message', async () => {
    mockCreateCheckoutSession.mockRejectedValue(problemError('subscription-already-active'))
    const useSubscription = await importComposable()
    const { error, subscribe } = useSubscription()
    const url = await subscribe('MONTHLY')
    expect(url).toBeNull()
    expect(error.value).toBe(
      'Votre abonnement est déjà en cours. Rendez-vous sur la page de gestion de votre abonnement.',
    )
  })

  it('subscribe returns null and maps billing-not-configured to a jargon-free message', async () => {
    mockCreateCheckoutSession.mockRejectedValue(problemError('billing-not-configured'))
    const useSubscription = await importComposable()
    const { error, subscribe } = useSubscription()
    const url = await subscribe('YEARLY')
    expect(url).toBeNull()
    expect(error.value).toBe("L'abonnement n'est pas encore ouvert.")
  })

  it('openPortal returns the portal URL on success', async () => {
    mockCreatePortalSession.mockResolvedValue({ url: 'https://billing.stripe.com/portal/xyz' })
    const useSubscription = await importComposable()
    const { openPortal } = useSubscription()
    const url = await openPortal()
    expect(url).toBe('https://billing.stripe.com/portal/xyz')
  })

  it('openPortal returns null and maps no-stripe-customer to a French message', async () => {
    mockCreatePortalSession.mockRejectedValue(problemError('no-stripe-customer'))
    const useSubscription = await importComposable()
    const { error, openPortal } = useSubscription()
    const url = await openPortal()
    expect(url).toBeNull()
    expect(error.value).toBe("Aucun abonnement payant n'est rattaché à votre compte.")
  })

  it('falls back to the backend detail when the code is unknown but a clean detail is provided', async () => {
    mockCreateCheckoutSession.mockRejectedValue(
      problemError('other-code', 'Le service est temporairement indisponible.'),
    )
    const useSubscription = await importComposable()
    const { error, subscribe } = useSubscription()
    await subscribe('MONTHLY')
    expect(error.value).toBe('Le service est temporairement indisponible.')
  })

  it('rejects a technical-looking detail and falls back to the generic message', async () => {
    mockCreateCheckoutSession.mockRejectedValue(
      problemError('other-code', '[GET] https://api.dony.io/billing/checkout-session: 500'),
    )
    const useSubscription = await importComposable()
    const { error, subscribe } = useSubscription()
    await subscribe('MONTHLY')
    expect(error.value).toBe('Impossible de démarrer la souscription. Veuillez réessayer.')
  })

  it('falls back to a generic message when the error code is unknown', async () => {
    mockCreateCheckoutSession.mockRejectedValue(problemError('some-unmapped-code'))
    const useSubscription = await importComposable()
    const { error, subscribe } = useSubscription()
    await subscribe('MONTHLY')
    expect(error.value).toBe('Impossible de démarrer la souscription. Veuillez réessayer.')
  })

  it('openPortal falls back to a generic message on a network failure without a known code', async () => {
    mockCreatePortalSession.mockRejectedValue(new Error('network'))
    const useSubscription = await importComposable()
    const { error, openPortal } = useSubscription()
    const url = await openPortal()
    expect(url).toBeNull()
    expect(error.value).toBe("Impossible d'ouvrir la gestion de l'abonnement. Veuillez réessayer.")
  })
})
