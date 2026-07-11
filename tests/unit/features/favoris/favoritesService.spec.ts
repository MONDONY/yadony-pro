// tests/unit/features/favoris/favoritesService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/favoris/services/favoritesService')
  return mod.favoritesService
}

describe('favoritesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('addFavorite PUT /favorites/package-request/:id', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.addFavorite('package-request', 'pr-1')
    expect(mockApiFn).toHaveBeenCalledWith('/favorites/package-request/pr-1', { method: 'PUT' })
  })

  it('removeFavorite DELETE /favorites/package-request/:id', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.removeFavorite('package-request', 'pr-1')
    expect(mockApiFn).toHaveBeenCalledWith('/favorites/package-request/pr-1', { method: 'DELETE' })
  })

  it('getFavoriteIds renvoie les ensembles trips et packageRequests', async () => {
    mockApiFn.mockResolvedValue({ trips: ['t1'], packageRequests: ['pr-1', 'pr-2'] })
    const svc = (await importService())()
    const ids = await svc.getFavoriteIds()
    expect(mockApiFn).toHaveBeenCalledWith('/favorites/ids', {})
    expect(ids.packageRequests).toEqual(['pr-1', 'pr-2'])
  })
})
