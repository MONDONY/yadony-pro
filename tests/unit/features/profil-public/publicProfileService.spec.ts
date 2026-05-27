import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

describe('publicProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchPublicProfile calls GET /users/{id}/profile-public', async () => {
    mockApiFn.mockResolvedValue({ userId: 'u1', displayName: 'Awa' })
    const { publicProfileService } = await import('@/features/profil-public/services/publicProfileService')
    const svc = publicProfileService()
    const result = await svc.fetchPublicProfile('u1')
    expect(mockApiFn).toHaveBeenCalledWith('/users/u1/profile-public')
    expect(result.displayName).toBe('Awa')
  })
})
