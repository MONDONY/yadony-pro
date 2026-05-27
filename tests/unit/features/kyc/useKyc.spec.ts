import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetchStatus = vi.fn()
const mockStartVerification = vi.fn()

vi.mock('@/features/kyc/services/kycService', () => ({
  kycService: () => ({
    fetchStatus: mockFetchStatus,
    startVerification: mockStartVerification,
  }),
}))

async function importComposable() {
  const mod = await import('@/features/kyc/composables/useKyc')
  return mod.useKyc
}

describe('useKyc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('starts with a neutral descriptor when no status is loaded', async () => {
    const useKyc = await importComposable()
    const { descriptor } = useKyc()
    expect(descriptor.value.tone).toBe('neutral')
    expect(descriptor.value.canVerify).toBe(true)
  })

  it('fetchStatus loads status and derives the descriptor', async () => {
    mockFetchStatus.mockResolvedValue({ kycStatus: 'VERIFIED', verificationStatus: 'verified' })
    const useKyc = await importComposable()
    const { status, descriptor, isLoading, fetchStatus } = useKyc()
    const p = fetchStatus()
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
    expect(status.value?.kycStatus).toBe('VERIFIED')
    expect(descriptor.value.tone).toBe('success')
  })

  it('sets an error when fetchStatus rejects', async () => {
    mockFetchStatus.mockRejectedValue(new Error('x'))
    const useKyc = await importComposable()
    const { error, fetchStatus } = useKyc()
    await fetchStatus()
    expect(error.value).toBe('Impossible de charger ton statut de vérification.')
  })

  it('startVerification returns the Stripe hosted URL on success', async () => {
    mockStartVerification.mockResolvedValue({ stripeUrl: 'https://verify.stripe.com/x', sessionId: 'vs', status: 's' })
    const useKyc = await importComposable()
    const { startVerification, isStarting } = useKyc()
    const p = startVerification()
    expect(isStarting.value).toBe(true)
    const url = await p
    expect(isStarting.value).toBe(false)
    expect(url).toBe('https://verify.stripe.com/x')
  })

  it('startVerification returns null and sets an error on failure', async () => {
    mockStartVerification.mockRejectedValue(new Error('x'))
    const useKyc = await importComposable()
    const { startVerification, error } = useKyc()
    const url = await startVerification()
    expect(url).toBeNull()
    expect(error.value).toBe('Impossible de démarrer la vérification. Veuillez réessayer.')
  })
})
