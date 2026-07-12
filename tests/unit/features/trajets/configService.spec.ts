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

  it("tolère l'ancien contrat string[] (backend pas encore redéployé) en le normalisant", async () => {
    // Fenêtre de déploiement : le backend d'avant la PR #100 renvoie encore
    // ["Vêtements", …]. Le front doit afficher ces libellés (chips non vides)
    // au lieu de rendre des chips à label undefined.
    mockApiFn.mockResolvedValue(['Vêtements', 'Alimentation sèche'])
    const { configService } = await import('@/features/trajets/services/configService')
    const svc = configService()
    const result = await svc.fetchContentCategories()
    expect(result).toEqual([
      { code: 'Vêtements', label: 'Vêtements', emoji: '' },
      { code: 'Alimentation sèche', label: 'Alimentation sèche', emoji: '' },
    ])
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
