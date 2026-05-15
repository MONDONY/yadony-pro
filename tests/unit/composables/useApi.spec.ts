import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

interface FetchOptions {
  baseURL: string
  onRequest: (ctx: { options: { headers: Record<string, string> } }) => void
  onResponseError: (ctx: { response: { status: number } }) => void
}

let capturedOpts: FetchOptions | null = null

vi.stubGlobal('useRuntimeConfig', () => ({
  public: { apiBaseUrl: 'http://localhost:8080/api/v1' },
}))

vi.stubGlobal('$fetch', {
  create: (opts: FetchOptions) => {
    capturedOpts = opts
    return vi.fn()
  },
})

vi.stubGlobal('navigateTo', vi.fn())

describe('useApi', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    capturedOpts = null
    const { _resetApiInstance } = await import('@/composables/useApi')
    _resetApiInstance()
  })

  it('builds a $fetch instance with apiBaseUrl', async () => {
    const { useApi } = await import('@/composables/useApi')
    useApi()
    expect(capturedOpts?.baseURL).toBe('http://localhost:8080/api/v1')
  })

  it('onRequest adds Authorization header when token is present', async () => {
    const auth = useAuthStore()
    auth.setSession('jwt-abc', {
      id: 'u1', phoneNumber: '+33', displayName: 'X',
      isProAccount: true, roles: ['ROLE_TRAVELER'], avatarUrl: null,
    })
    const { useApi } = await import('@/composables/useApi')
    useApi()
    const ctx = { options: { headers: {} as Record<string, string> } }
    capturedOpts!.onRequest(ctx)
    expect(ctx.options.headers.Authorization).toBe('Bearer jwt-abc')
  })

  it('onRequest does not add Authorization when token is null', async () => {
    const { useApi } = await import('@/composables/useApi')
    useApi()
    const ctx = { options: { headers: {} as Record<string, string> } }
    capturedOpts!.onRequest(ctx)
    expect(ctx.options.headers.Authorization).toBeUndefined()
  })

  it('onResponseError calls auth.clear and navigates to /login on 401', async () => {
    const navigateToMock = vi.mocked(navigateTo)
    const auth = useAuthStore()
    auth.setSession('token', {
      id: 'u', phoneNumber: '+33', displayName: 'X',
      isProAccount: true, roles: ['ROLE_TRAVELER'], avatarUrl: null,
    })
    const { useApi } = await import('@/composables/useApi')
    useApi()
    capturedOpts!.onResponseError({ response: { status: 401 } } as { response: { status: number } })
    expect(auth.isAuthenticated).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith('/login')
  })

  it('onResponseError does nothing on non-401 status', async () => {
    const navigateToMock = vi.mocked(navigateTo)
    navigateToMock.mockClear()
    const auth = useAuthStore()
    auth.setSession('token', {
      id: 'u', phoneNumber: '+33', displayName: 'X',
      isProAccount: true, roles: ['ROLE_TRAVELER'], avatarUrl: null,
    })
    const { useApi } = await import('@/composables/useApi')
    useApi()
    capturedOpts!.onResponseError({ response: { status: 403 } } as { response: { status: number } })
    expect(auth.isAuthenticated).toBe(true)
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('returns the same cached instance on second call', async () => {
    const { useApi } = await import('@/composables/useApi')
    const first = useApi()
    const second = useApi()
    expect(first).toBe(second)
  })
})
