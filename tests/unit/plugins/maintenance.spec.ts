import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'

const apiMock = vi.fn()
vi.mock('@/composables/useApi', () => ({ useApi: () => apiMock }))
vi.stubGlobal('defineNuxtPlugin', (fn: () => void) => fn)

import { useAuthStore } from '@/stores/auth'
import { useMaintenanceStore } from '@/stores/maintenance'

const off = { enabled: false, message: null, estimatedEndAt: null, exempt: false }
const on = { ...off, enabled: true }

describe('plugin maintenance', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    apiMock.mockReset()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  async function install() {
    const mod = await import('@/plugins/maintenance.client')
    ;(mod.default as unknown as () => void)()
    return mod
  }

  it('lit l’état au chargement puis toutes les 60 s, 30 s en maintenance', async () => {
    apiMock.mockResolvedValue(off)
    const { IDLE_POLL_MS, ACTIVE_POLL_MS } = await install()
    await vi.waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1))

    apiMock.mockResolvedValue(on)
    await vi.advanceTimersByTimeAsync(IDLE_POLL_MS)
    expect(apiMock).toHaveBeenCalledTimes(2)
    expect(useMaintenanceStore().active).toBe(true)

    apiMock.mockResolvedValue(off)
    await vi.advanceTimersByTimeAsync(ACTIVE_POLL_MS)
    expect(useMaintenanceStore().active).toBe(false)
  })

  it('relit au retour sur l’onglet et quand la session change', async () => {
    apiMock.mockResolvedValue(off)
    await install()
    await vi.waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1))

    // Les écouteurs `document` des tests précédents restent : on compte l'écart.
    let before = apiMock.mock.calls.length
    document.dispatchEvent(new Event('visibilitychange'))
    expect(apiMock.mock.calls.length).toBeGreaterThan(before)

    before = apiMock.mock.calls.length
    useAuthStore().setSession('t', {
      id: 'u', phoneNumber: null, displayName: 'X', isProAccount: true, roles: [], avatarUrl: null,
    })
    await nextTick()
    expect(apiMock.mock.calls.length).toBeGreaterThan(before)
  })
})
