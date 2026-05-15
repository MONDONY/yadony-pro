import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockListTrips = vi.fn()
const mockGetTemplates = vi.fn()

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({
    listTrips: mockListTrips,
    createAnnouncement: vi.fn(),
    getTemplates: mockGetTemplates,
  }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

async function importUseTrips() {
  const mod = await import('@/features/trajets/composables/useTrips')
  return mod.useTrips
}

describe('useTrips', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
    mockListTrips.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20,
    })
  })

  it('initializes with TOUS filter and list view', async () => {
    const useTrips = await importUseTrips()
    const { activeFilter, viewMode } = useTrips()
    expect(activeFilter.value).toBe('TOUS')
    expect(viewMode.value).toBe('list')
  })

  it('fetch populates trips and sets loading states correctly', async () => {
    const tripA = { id: 'a', status: 'ACTIVE' }
    mockListTrips.mockResolvedValue({ content: [tripA], totalElements: 1, totalPages: 1, number: 0, size: 20 })
    const useTrips = await importUseTrips()
    const { trips, isLoading, fetchTrips } = useTrips()
    expect(isLoading.value).toBe(false)
    const promise = fetchTrips()
    expect(isLoading.value).toBe(true)
    await promise
    expect(isLoading.value).toBe(false)
    expect(trips.value).toHaveLength(1)
    expect(trips.value[0].id).toBe('a')
  })

  it('setFilter updates activeFilter and re-fetches', async () => {
    const useTrips = await importUseTrips()
    const { activeFilter, setFilter } = useTrips()
    await setFilter('ACTIFS')
    expect(activeFilter.value).toBe('ACTIFS')
    expect(mockListTrips).toHaveBeenCalledWith(expect.objectContaining({ filter: 'ACTIFS' }))
  })

  it('toggleView switches between list and calendar', async () => {
    const useTrips = await importUseTrips()
    const { viewMode, toggleView } = useTrips()
    expect(viewMode.value).toBe('list')
    toggleView()
    expect(viewMode.value).toBe('calendar')
    toggleView()
    expect(viewMode.value).toBe('list')
  })

  it('sets error when fetchTrips rejects', async () => {
    mockListTrips.mockRejectedValue(new Error('Network failure'))
    const useTrips = await importUseTrips()
    const { error, fetchTrips } = useTrips()
    await fetchTrips()
    expect(error.value).toBe('Impossible de charger les trajets. Veuillez réessayer.')
  })

  it('fetchTemplates returns trip list from service', async () => {
    const fakeTrips = [{ id: 't1' }, { id: 't2' }]
    mockGetTemplates.mockResolvedValue(fakeTrips)
    const useTrips = await importUseTrips()
    const { fetchTemplates } = useTrips()
    const result = await fetchTemplates()
    expect(result).toEqual(fakeTrips)
  })
})
