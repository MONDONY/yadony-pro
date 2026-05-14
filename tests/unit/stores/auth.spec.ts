import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useAuthStore, type AuthUser } from '@/stores/auth'

const mockUser: AuthUser = {
  id: 'user-1',
  phoneNumber: '+33612345678',
  displayName: 'Jean Dupont',
  isProAccount: true,
  roles: ['ROLE_TRAVELER'],
  avatarUrl: null,
}

describe('useAuthStore', () => {
  beforeEach(() => {
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
})
