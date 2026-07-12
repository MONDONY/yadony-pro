import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

const catalogSample = [
  { code: 'DOCUMENTS', label: 'Documents & administratif', emoji: '📄' },
  { code: 'PRODUITS_FRAIS', label: 'Produits frais / périssables', emoji: '🐟' },
  { code: 'VETEMENTS', label: 'Vêtements & tissus', emoji: '👗' },
]

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('fetchContentCategories GETs /config/content-categories', async () => {
    mockApiFn.mockResolvedValue(catalogSample)
    const { configService } = await import('@/features/trajets/services/configService')
    const svc = configService()
    await svc.fetchContentCategories()
    expect(mockApiFn).toHaveBeenCalledWith('/config/content-categories')
  })

  it('renvoie des objets {code,label,emoji} et non plus des chaînes brutes', async () => {
    mockApiFn.mockResolvedValue(catalogSample)
    const { configService } = await import('@/features/trajets/services/configService')
    const svc = configService()
    const result = await svc.fetchContentCategories()
    expect(result).toEqual(catalogSample)
    expect(result[0]).toEqual({ code: 'DOCUMENTS', label: 'Documents & administratif', emoji: '📄' })
    expect(result[1].label).toBe('Produits frais / périssables')
  })
})
