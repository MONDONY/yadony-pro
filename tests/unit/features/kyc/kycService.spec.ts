import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

describe('kycService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchStatus calls GET /kyc/status', async () => {
    mockApiFn.mockResolvedValue({ kycStatus: 'VERIFIED', verificationStatus: 'verified' })
    const { kycService } = await import('@/features/kyc/services/kycService')
    const svc = kycService()
    const result = await svc.fetchStatus()
    expect(mockApiFn).toHaveBeenCalledWith('/kyc/status')
    expect(result.kycStatus).toBe('VERIFIED')
  })

  it('startVerification POSTs /kyc/session and returns the session', async () => {
    mockApiFn.mockResolvedValue({ stripeUrl: 'https://verify.stripe.com/x', sessionId: 'vs_1', status: 'requires_input' })
    const { kycService } = await import('@/features/kyc/services/kycService')
    const svc = kycService()
    const result = await svc.startVerification()
    expect(mockApiFn).toHaveBeenCalledWith('/kyc/session', { method: 'POST' })
    expect(result.stripeUrl).toBe('https://verify.stripe.com/x')
  })
})
