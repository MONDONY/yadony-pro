import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()

vi.mock('@/features/profil-public/services/publicProfileService', () => ({
  publicProfileService: () => ({ fetchPublicProfile: mockFetch }),
}))

async function importComposable() {
  const mod = await import('@/features/profil-public/composables/usePublicProfile')
  return mod.usePublicProfile
}

const profile = {
  userId: 'u1', displayName: 'Awa', avatarUrl: null, kycVerified: true, isProAccount: true,
  isKiloPro: true, completedBidsCount: 12, averageRating: 4.8, ratingCount: 9,
  memberSince: '2025-01-01', badges: [], contactMode: null, responseDelayHours: null,
}

describe('usePublicProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchProfile loads the public profile', async () => {
    mockFetch.mockResolvedValue(profile)
    const { profile: p, fetchProfile } = (await importComposable())()
    await fetchProfile('u1')
    expect(p.value?.displayName).toBe('Awa')
  })

  it('fetchProfile sets an error and skips the call when userId is empty', async () => {
    const { error, fetchProfile } = (await importComposable())()
    await fetchProfile('')
    expect(error.value).toBe('Profil indisponible.')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('sets an error when fetchProfile rejects', async () => {
    mockFetch.mockRejectedValue(new Error('x'))
    const { error, fetchProfile } = (await importComposable())()
    await fetchProfile('u1')
    expect(error.value).toBe('Impossible de charger ton profil public.')
  })
})
