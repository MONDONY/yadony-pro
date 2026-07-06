import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchAccount = vi.fn()
const mockCreateAccount = vi.fn()
const mockCreateOnboardingLink = vi.fn()
const mockRefreshAccount = vi.fn()

vi.mock('@/features/payout/services/payoutService', () => ({
  payoutService: () => ({
    fetchAccount: mockFetchAccount,
    createAccount: mockCreateAccount,
    createOnboardingLink: mockCreateOnboardingLink,
    refreshAccount: mockRefreshAccount,
  }),
}))

async function importComposable() {
  const mod = await import('@/features/payout/composables/usePayout')
  return mod.usePayout
}

describe('usePayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('starts with a neutral "setup" descriptor when no account is loaded', async () => {
    const { descriptor } = (await importComposable())()
    expect(descriptor.value.action).toBe('setup')
    expect(descriptor.value.tone).toBe('neutral')
  })

  it('fetchAccount loads the account and derives the descriptor', async () => {
    mockFetchAccount.mockResolvedValue({ stripeAccountId: 'a', stripeAccountStatus: 'ONBOARDING_COMPLETE' })
    const { account, descriptor, fetchAccount } = (await importComposable())()
    await fetchAccount()
    expect(account.value?.stripeAccountStatus).toBe('ONBOARDING_COMPLETE')
    expect(descriptor.value.action).toBe('none')
  })

  it('sets an error when fetchAccount rejects', async () => {
    mockFetchAccount.mockRejectedValue(new Error('x'))
    const { error, fetchAccount } = (await importComposable())()
    await fetchAccount()
    expect(error.value).toBe('Impossible de charger ton compte de paiement.')
  })

  it('startOnboarding creates the account first when none exists, then returns the link', async () => {
    mockCreateAccount.mockResolvedValue({ stripeAccountId: 'a', stripeAccountStatus: 'PENDING_ONBOARDING' })
    mockCreateOnboardingLink.mockResolvedValue({ url: 'https://connect.stripe.com/x' })
    const { startOnboarding } = (await importComposable())()
    const url = await startOnboarding()
    expect(mockCreateAccount).toHaveBeenCalledOnce()
    expect(mockCreateOnboardingLink).toHaveBeenCalledOnce()
    expect(url).toBe('https://connect.stripe.com/x')
  })

  it('startOnboarding does not recreate the account when one already exists', async () => {
    mockFetchAccount.mockResolvedValue({ stripeAccountId: 'a', stripeAccountStatus: 'PENDING_ONBOARDING' })
    mockCreateOnboardingLink.mockResolvedValue({ url: 'https://connect.stripe.com/y' })
    const { fetchAccount, startOnboarding } = (await importComposable())()
    await fetchAccount()
    const url = await startOnboarding()
    expect(mockCreateAccount).not.toHaveBeenCalled()
    expect(url).toBe('https://connect.stripe.com/y')
  })

  it('startOnboarding returns null and sets an error on failure', async () => {
    mockCreateAccount.mockRejectedValue(new Error('x'))
    const { startOnboarding, error } = (await importComposable())()
    const url = await startOnboarding()
    expect(url).toBeNull()
    expect(error.value).toBe('Impossible de démarrer la configuration des paiements. Veuillez réessayer.')
  })

  it('refresh re-pulls the account', async () => {
    mockRefreshAccount.mockResolvedValue({ stripeAccountId: 'a', stripeAccountStatus: 'ONBOARDING_COMPLETE' })
    const { account, refresh } = (await importComposable())()
    await refresh()
    expect(account.value?.stripeAccountStatus).toBe('ONBOARDING_COMPLETE')
  })

  it('refresh sets an error on failure', async () => {
    mockRefreshAccount.mockRejectedValue(new Error('x'))
    const { error, refresh } = (await importComposable())()
    await refresh()
    expect(error.value).toBe('Impossible d’actualiser le statut. Veuillez réessayer.')
  })
})
