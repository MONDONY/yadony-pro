import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore, type AuthUser } from '@/stores/auth'

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)

const fakeUser = (isPro: boolean): AuthUser => ({
  id: 'u', phoneNumber: '+33', displayName: 'X',
  isProAccount: isPro, roles: ['ROLE_TRAVELER'], avatarUrl: null,
})

type Middleware = () => unknown

describe('pro-only middleware', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    navigateToMock.mockClear()
  })

  it('redirects to /upgrade when user is not pro', async () => {
    useAuthStore().setSession('t', fakeUser(false))
    const middleware = (await import('@/middleware/pro-only')).default as Middleware
    middleware()
    expect(navigateToMock).toHaveBeenCalledWith('/upgrade')
  })

  it('allows access when user is pro', async () => {
    useAuthStore().setSession('t', fakeUser(true))
    const middleware = (await import('@/middleware/pro-only')).default as Middleware
    middleware()
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
