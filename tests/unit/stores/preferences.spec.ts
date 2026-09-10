// tests/unit/stores/preferences.spec.ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'

const fetchPreferences = vi.fn()

vi.mock('@/features/parametres/services/businessPrefsService', () => ({
  businessPrefsService: () => ({ fetchPreferences }),
}))

async function store() {
  const { usePreferencesStore } = await import('@/stores/preferences')
  return usePreferencesStore()
}

describe('usePreferencesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
  })

  it('vaut EUR tant que rien n’est chargé', async () => {
    const s = await store()
    expect(s.currency).toBe('EUR')
    expect(s.loaded).toBe(false)
  })

  it('charge la devise active depuis les préférences métier, une seule fois', async () => {
    fetchPreferences.mockResolvedValue({ currencyCode: 'xof' })
    const s = await store()
    expect(await s.load()).toBe('XOF')
    expect(await s.load()).toBe('XOF')
    expect(fetchPreferences).toHaveBeenCalledTimes(1)
    expect(s.loaded).toBe(true)
  })

  it('recharge quand on le force', async () => {
    fetchPreferences.mockResolvedValueOnce({ currencyCode: 'EUR' }).mockResolvedValueOnce({ currencyCode: 'XAF' })
    const s = await store()
    await s.load()
    expect(await s.load(true)).toBe('XAF')
    expect(fetchPreferences).toHaveBeenCalledTimes(2)
  })

  it('retombe sur EUR sans marquer chargé quand l’API échoue', async () => {
    fetchPreferences.mockRejectedValue(new Error('réseau'))
    const s = await store()
    expect(await s.load()).toBe('EUR')
    expect(s.loaded).toBe(false)
    expect(s.loading).toBe(false)
  })

  it('prend la devise enregistrée depuis les paramètres', async () => {
    const s = await store()
    s.setCurrency('xaf')
    expect(s.currency).toBe('XAF')
    expect(s.loaded).toBe(true)
    expect(await s.load()).toBe('XAF')
    expect(fetchPreferences).not.toHaveBeenCalled()
  })
})
