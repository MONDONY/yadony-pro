// tests/unit/features/favoris/useFavorites.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSvc = {
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getFavoriteIds: vi.fn(),
}

vi.mock('@/features/favoris/services/favoritesService', () => ({
  favoritesService: () => mockSvc,
}))

async function importComposable() {
  const mod = await import('@/features/favoris/composables/useFavorites')
  return mod.useFavorites
}

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('loadIds remplit les ids favoris', async () => {
    mockSvc.getFavoriteIds.mockResolvedValue({ trips: [], packageRequests: ['pr-1'] })
    const { isFavoriteRequest, loadIds } = (await importComposable())()
    await loadIds()
    expect(isFavoriteRequest('pr-1')).toBe(true)
    expect(isFavoriteRequest('pr-2')).toBe(false)
  })

  it('toggleRequest ajoute quand absent (optimiste)', async () => {
    mockSvc.getFavoriteIds.mockResolvedValue({ trips: [], packageRequests: [] })
    mockSvc.addFavorite.mockResolvedValue(undefined)
    const { isFavoriteRequest, toggleRequest, loadIds } = (await importComposable())()
    await loadIds()
    await toggleRequest('pr-9')
    expect(mockSvc.addFavorite).toHaveBeenCalledWith('package-request', 'pr-9')
    expect(isFavoriteRequest('pr-9')).toBe(true)
  })

  it('toggleRequest retire quand présent', async () => {
    mockSvc.getFavoriteIds.mockResolvedValue({ trips: [], packageRequests: ['pr-9'] })
    mockSvc.removeFavorite.mockResolvedValue(undefined)
    const { isFavoriteRequest, toggleRequest, loadIds } = (await importComposable())()
    await loadIds()
    await toggleRequest('pr-9')
    expect(mockSvc.removeFavorite).toHaveBeenCalledWith('package-request', 'pr-9')
    expect(isFavoriteRequest('pr-9')).toBe(false)
  })

  it('toggleRequest annule le changement optimiste si le back échoue', async () => {
    mockSvc.getFavoriteIds.mockResolvedValue({ trips: [], packageRequests: [] })
    mockSvc.addFavorite.mockRejectedValue(new Error('boom'))
    const { isFavoriteRequest, toggleRequest, loadIds } = (await importComposable())()
    await loadIds()
    await toggleRequest('pr-9')
    expect(isFavoriteRequest('pr-9')).toBe(false)
  })
})
