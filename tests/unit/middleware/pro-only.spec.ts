import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore, type AuthUser } from '@/stores/auth'

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn)

const mockApiFn = vi.fn()
vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

const fakeUser = (isPro: boolean): AuthUser => ({
  id: 'u', phoneNumber: '+33', displayName: 'X',
  isProAccount: isPro, roles: ['ROLE_TRAVELER'], avatarUrl: null,
})

type RouteLike = { query: Record<string, string> }
type Middleware = (to?: RouteLike) => unknown

async function importMiddleware() {
  return (await import('@/middleware/pro-only')).default as Middleware
}

describe('pro-only middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
  })

  it('redirects to /upgrade when user is not pro', async () => {
    useAuthStore().setSession('t', fakeUser(false))
    const middleware = await importMiddleware()
    await middleware()
    expect(navigateToMock).toHaveBeenCalledWith('/upgrade')
  })

  it('allows access when user is pro', async () => {
    useAuthStore().setSession('t', fakeUser(true))
    const middleware = await importMiddleware()
    await middleware()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  describe('retour de Stripe Checkout (?success=1)', () => {
    // Correctif 2 : si le webhook Stripe tarde encore après ce rafraîchissement,
    // le paramètre de succès DOIT survivre au renvoi vers /upgrade — sans quoi
    // la page de vente n'a aucun moyen de savoir qu'un paiement vient d'avoir
    // lieu, et rafficherait la grille tarifaire à un utilisateur qui vient
    // d'être débité, sans un mot (boucle fermée décrite en revue finale).
    it('refreshes the profile before deciding, and redirects to /upgrade preserving success=1 if it is not pro yet', async () => {
      useAuthStore().setSession('t', fakeUser(false))
      mockApiFn.mockResolvedValue(fakeUser(false))
      const middleware = await importMiddleware()

      await middleware({ query: { success: '1' } })

      expect(mockApiFn).toHaveBeenCalledWith('/auth/me')
      expect(navigateToMock).toHaveBeenCalledWith({ path: '/upgrade', query: { success: '1' } })
    })

    it('does not redirect once the refreshed profile is pro — the exact bug this middleware must avoid', async () => {
      useAuthStore().setSession('t', fakeUser(false))
      mockApiFn.mockResolvedValue(fakeUser(true))
      const middleware = await importMiddleware()

      await middleware({ query: { success: '1' } })

      expect(mockApiFn).toHaveBeenCalledWith('/auth/me')
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('does not call refreshUser when the user is already pro', async () => {
      useAuthStore().setSession('t', fakeUser(true))
      const middleware = await importMiddleware()

      await middleware({ query: { success: '1' } })

      expect(mockApiFn).not.toHaveBeenCalled()
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('does not call refreshUser when the success param is absent', async () => {
      useAuthStore().setSession('t', fakeUser(false))
      const middleware = await importMiddleware()

      await middleware({ query: {} })

      expect(mockApiFn).not.toHaveBeenCalled()
      expect(navigateToMock).toHaveBeenCalledWith('/upgrade')
    })
  })
})
