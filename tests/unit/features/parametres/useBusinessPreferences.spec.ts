import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
const mockSave = vi.fn()

vi.mock('@/features/parametres/services/businessPrefsService', () => ({
  businessPrefsService: () => ({
    fetchPreferences: mockFetch,
    savePreferences: mockSave,
  }),
}))

const prefs = {
  weightUnit: 'kg' as const,
  currencyCode: 'EUR' as const,
  pickupRadiusKm: 10,
  defaultPackageWeightKg: 23,
  minBidPriceEur: 0,
  contactMode: null,
  responseDelayHours: null,
}

async function importComposable() {
  const mod = await import('@/features/parametres/composables/useBusinessPreferences')
  return mod.useBusinessPreferences
}

describe('useBusinessPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('initializes with default preferences', async () => {
    const useBusinessPreferences = await importComposable()
    const { preferences, isLoading } = useBusinessPreferences()
    expect(isLoading.value).toBe(false)
    expect(preferences.value.weightUnit).toBe('kg')
    expect(preferences.value.currencyCode).toBe('EUR')
  })

  it('fetchPreferences loads preferences and toggles isLoading', async () => {
    const loaded = { ...prefs, pickupRadiusKm: 30 }
    mockFetch.mockResolvedValue(loaded)
    const useBusinessPreferences = await importComposable()
    const { preferences, isLoading, fetchPreferences } = useBusinessPreferences()
    const p = fetchPreferences()
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
    expect(preferences.value).toEqual(loaded)
  })

  it('sets an error message when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('network'))
    const useBusinessPreferences = await importComposable()
    const { error, fetchPreferences } = useBusinessPreferences()
    await fetchPreferences()
    expect(error.value).toBe('Impossible de charger tes préférences. Veuillez réessayer.')
  })

  it('savePreferences returns true, updates state and sets savedAt on success', async () => {
    const next = { ...prefs, minBidPriceEur: 5 }
    mockSave.mockResolvedValue(next)
    const useBusinessPreferences = await importComposable()
    const { preferences, savedAt, savePreferences } = useBusinessPreferences()
    const ok = await savePreferences(next)
    expect(ok).toBe(true)
    expect(preferences.value).toEqual(next)
    expect(savedAt.value).not.toBeNull()
  })

  it('savePreferences returns false and sets an error on failure', async () => {
    mockSave.mockRejectedValue(new Error('boom'))
    const useBusinessPreferences = await importComposable()
    const { error, savePreferences } = useBusinessPreferences()
    const ok = await savePreferences(prefs)
    expect(ok).toBe(false)
    expect(error.value).toBe("Impossible d'enregistrer tes préférences. Veuillez réessayer.")
  })
})
