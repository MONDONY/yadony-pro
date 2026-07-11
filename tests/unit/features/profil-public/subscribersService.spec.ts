// tests/unit/features/profil-public/subscribersService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

describe('subscribersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('getMySubscribers interroge GET /me/subscribers', async () => {
    mockApiFn.mockResolvedValue([
      { senderId: 'u2', displayName: 'Alice Ba', subscribedAt: '2026-06-10T08:00:00' },
    ])
    const { subscribersService } = await import('@/features/profil-public/services/subscribersService')
    const res = await subscribersService().getMySubscribers()
    expect(mockApiFn).toHaveBeenCalledWith('/me/subscribers', {})
    expect(res).toHaveLength(1)
    expect(res[0].displayName).toBe('Alice Ba')
  })
})
