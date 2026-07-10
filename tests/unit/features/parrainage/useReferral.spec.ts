import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
const mockRegenerate = vi.fn()

vi.mock('@/features/parrainage/services/referralService', () => ({
  referralService: () => ({ fetchReferral: mockFetch, regenerate: mockRegenerate }),
}))

async function importComposable() {
  const mod = await import('@/features/parrainage/composables/useReferral')
  return mod.useReferral
}

const info = { code: 'DONY-AB12', shareUrl: 'https://dony.app/r/DONY-AB12', totalInvited: 3, signedUp: 2, rewarded: 1, totalEarnedCents: 500 }

describe('useReferral', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchReferral loads the referral info', async () => {
    mockFetch.mockResolvedValue(info)
    const { referral, fetchReferral } = (await importComposable())()
    await fetchReferral()
    expect(referral.value?.code).toBe('DONY-AB12')
  })

  it('sets an error when fetchReferral rejects', async () => {
    mockFetch.mockRejectedValue(new Error('x'))
    const { error, fetchReferral } = (await importComposable())()
    await fetchReferral()
    expect(error.value).toBe('Impossible de charger ton programme de parrainage.')
  })

  it('regenerate updates the referral info', async () => {
    mockRegenerate.mockResolvedValue({ ...info, code: 'DONY-XY99' })
    const { referral, regenerate } = (await importComposable())()
    await regenerate()
    expect(referral.value?.code).toBe('DONY-XY99')
  })

  it('sets an error when regenerate rejects', async () => {
    mockRegenerate.mockRejectedValue(new Error('x'))
    const { error, regenerate } = (await importComposable())()
    await regenerate()
    expect(error.value).toBe('Impossible de régénérer ton code (délai d’attente ?). Réessaie plus tard.')
  })
})
