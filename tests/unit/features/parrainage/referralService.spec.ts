import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/parrainage/services/referralService')
  return mod.referralService
}

const info = { code: 'YADONY-AB12', shareUrl: 'https://yadony.app/r/YADONY-AB12', totalInvited: 3, signedUp: 2, rewarded: 1, totalEarnedCents: 500 }

describe('referralService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchReferral calls GET /me/referral', async () => {
    mockApiFn.mockResolvedValue(info)
    const svc = (await importService())()
    const result = await svc.fetchReferral()
    expect(mockApiFn).toHaveBeenCalledWith('/me/referral')
    expect(result.code).toBe('YADONY-AB12')
  })

  it('regenerate POSTs /me/referral/regenerate', async () => {
    mockApiFn.mockResolvedValue({ ...info, code: 'YADONY-XY99' })
    const svc = (await importService())()
    const result = await svc.regenerate()
    expect(mockApiFn).toHaveBeenCalledWith('/me/referral/regenerate', { method: 'POST' })
    expect(result.code).toBe('YADONY-XY99')
  })
})
