import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const apiMock = vi.fn()
vi.mock('@/composables/useApi', () => ({ useApi: () => apiMock }))

import { isMaintenanceProblem, useMaintenanceStore } from '@/stores/maintenance'

const status = (over = {}) => ({ enabled: true, message: 'Pause', estimatedEndAt: '2026-10-16T14:30:00Z', exempt: false, ...over })

describe('maintenance store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    apiMock.mockReset()
  })

  it('isMaintenanceProblem : seulement le 503 au code maintenance', () => {
    expect(isMaintenanceProblem(503, { code: 'maintenance' })).toBe(true)
    expect(isMaintenanceProblem(503, { code: 'service-busy' })).toBe(false)
    expect(isMaintenanceProblem(500, { code: 'maintenance' })).toBe(false)
    expect(isMaintenanceProblem(503, null)).toBe(false)
    expect(isMaintenanceProblem(503, 'html')).toBe(false)
  })

  it('check : maintenance active', async () => {
    apiMock.mockResolvedValue(status())
    const store = useMaintenanceStore()
    await store.check()
    expect(apiMock).toHaveBeenCalledWith('/config/maintenance')
    expect(store.active).toBe(true)
    expect(store.message).toBe('Pause')
    expect(store.estimatedEndAt).toBe('2026-10-16T14:30:00Z')
  })

  it('check : compte exempté jamais bloqué', async () => {
    apiMock.mockResolvedValue(status({ exempt: true }))
    const store = useMaintenanceStore()
    await store.check()
    expect(store.active).toBe(false)
    expect(store.message).toBeNull()
  })

  it('check : erreur réseau, état conservé', async () => {
    const store = useMaintenanceStore()
    store.active = true
    apiMock.mockRejectedValue(new Error('offline'))
    await store.check()
    expect(store.active).toBe(true)
  })

  it('showFromProblem : page immédiate puis relecture', async () => {
    apiMock.mockResolvedValue(status({ enabled: false }))
    const store = useMaintenanceStore()
    store.showFromProblem({ code: 'maintenance', estimatedEndAt: '2026-10-16T14:30:00Z' })
    expect(store.active).toBe(true)
    expect(store.estimatedEndAt).toBe('2026-10-16T14:30:00Z')
    await vi.waitFor(() => expect(store.active).toBe(false))
    store.showFromProblem(undefined)
    expect(store.estimatedEndAt).toBeNull()
  })

  it('retry : indicateur pendant la vérification', async () => {
    let resolve!: (v: unknown) => void
    apiMock.mockReturnValue(new Promise((r) => { resolve = r }))
    const store = useMaintenanceStore()
    const p = store.retry()
    expect(store.checking).toBe(true)
    resolve(status({ enabled: false }))
    await p
    expect(store.checking).toBe(false)
  })
})
