import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useAuthStore, type AuthUser } from '@/stores/auth'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

const mockUser: AuthUser = {
  id: 'user-1',
  phoneNumber: '+33612345678',
  email: 'jean@example.com',
  displayName: 'Jean Dupont',
  isProAccount: true,
  roles: ['ROLE_TRAVELER'],
  avatarUrl: null,
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('starts unauthenticated with null token/user', () => {
    const store = useAuthStore()
    expect(store.idToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isProAccount).toBe(false)
  })

  it('setSession stores token and user, sets isAuthenticated', () => {
    const store = useAuthStore()
    store.setSession('fake-token', mockUser)
    expect(store.idToken).toBe('fake-token')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isProAccount).toBe(true)
  })

  it('isProAccount is false when user has isProAccount=false', () => {
    const store = useAuthStore()
    store.setSession('fake-token', { ...mockUser, isProAccount: false })
    expect(store.isProAccount).toBe(false)
  })

  it('clear() resets token and user', () => {
    const store = useAuthStore()
    store.setSession('fake-token', mockUser)
    store.clear()
    expect(store.idToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  describe('refreshUser', () => {
    it('does nothing when no token is present', async () => {
      const store = useAuthStore()
      await store.refreshUser()
      expect(mockApiFn).not.toHaveBeenCalled()
      expect(store.user).toBeNull()
    })

    it('replaces the profile with the result of GET /auth/me, keeping the current token', async () => {
      const store = useAuthStore()
      store.setSession('fake-token', { ...mockUser, isProAccount: false })
      const refreshedUser: AuthUser = { ...mockUser, isProAccount: true }
      mockApiFn.mockResolvedValue(refreshedUser)

      await store.refreshUser()

      expect(mockApiFn).toHaveBeenCalledWith('/auth/me')
      expect(store.idToken).toBe('fake-token')
      expect(store.user).toEqual(refreshedUser)
      expect(store.isProAccount).toBe(true)
    })

    it('keeps the current session when the refresh call fails', async () => {
      const store = useAuthStore()
      store.setSession('fake-token', mockUser)
      mockApiFn.mockRejectedValue(new Error('network error'))

      await expect(store.refreshUser()).resolves.toBeUndefined()

      expect(store.idToken).toBe('fake-token')
      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
    })
  })
})
