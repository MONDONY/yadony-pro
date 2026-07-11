import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockListTrips = vi.fn()
const mockGetTemplates = vi.fn()
const mockGetCorridors = vi.fn()

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({
    listTrips: mockListTrips,
    createAnnouncement: vi.fn(),
    getTemplates: mockGetTemplates,
    getCorridors: mockGetCorridors,
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

  it('initialise activeFilter depuis l’argument initialFilter', async () => {
    const useTrips = await importUseTrips()
    const { activeFilter } = useTrips('BROUILLONS')
    expect(activeFilter.value).toBe('BROUILLONS')
  })

  it('activeFilter vaut TOUS par défaut', async () => {
    const useTrips = await importUseTrips()
    const { activeFilter } = useTrips()
    expect(activeFilter.value).toBe('TOUS')
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

  it('goToPage sets currentPage and re-fetches with the page number', async () => {
    const useTrips = await importUseTrips()
    const { currentPage, goToPage } = useTrips()
    await goToPage(3)
    expect(currentPage.value).toBe(3)
    expect(mockListTrips).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }))
  })

  it('setSearch updates search, resets the page and debounces the fetch', async () => {
    vi.useFakeTimers()
    try {
      const useTrips = await importUseTrips()
      const { search, currentPage, setSearch } = useTrips()
      setSearch('Dakar')
      expect(search.value).toBe('Dakar')
      expect(currentPage.value).toBe(0)
      expect(mockListTrips).not.toHaveBeenCalled()
      await vi.runAllTimersAsync()
      expect(mockListTrips).toHaveBeenCalledWith(expect.objectContaining({ q: 'Dakar' }))
    } finally {
      vi.useRealTimers()
    }
  })

  it('setSearch clears a pending debounce timer when called twice', async () => {
    vi.useFakeTimers()
    try {
      const useTrips = await importUseTrips()
      const { setSearch } = useTrips()
      setSearch('Da')
      setSearch('Dakar')
      await vi.runAllTimersAsync()
      expect(mockListTrips).toHaveBeenCalledTimes(1)
      expect(mockListTrips).toHaveBeenCalledWith(expect.objectContaining({ q: 'Dakar' }))
    } finally {
      vi.useRealTimers()
    }
  })

  it('setDateMode none clears all date fields', async () => {
    const useTrips = await importUseTrips()
    const { dateMode, date, dateFrom, dateTo, setDate, setDateMode } = useTrips()
    await setDate('2026-06-01')
    await setDateMode('none')
    expect(dateMode.value).toBe('none')
    expect(date.value).toBeNull()
    expect(dateFrom.value).toBeNull()
    expect(dateTo.value).toBeNull()
  })

  it('setDateMode day sends the single date in the query and clears the range', async () => {
    const useTrips = await importUseTrips()
    const { setDateMode, setDate } = useTrips()
    await setDateMode('day')
    await setDate('2026-06-15')
    expect(mockListTrips).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: '2026-06-15', dateFrom: null, dateTo: null }),
    )
  })

  it('setDateMode period sends the range in the query and clears the single date', async () => {
    const useTrips = await importUseTrips()
    const { setDateMode, setDateFrom, setDateTo } = useTrips()
    await setDateMode('period')
    await setDateTo('2026-06-30')
    await setDateFrom('2026-06-01')
    expect(mockListTrips).toHaveBeenLastCalledWith(
      expect.objectContaining({ dateFrom: '2026-06-01', dateTo: '2026-06-30', date: null }),
    )
  })

  it('setDateFrom does not re-fetch until the range is complete', async () => {
    const useTrips = await importUseTrips()
    const { setDateMode, setDateFrom } = useTrips()
    await setDateMode('period')
    mockListTrips.mockClear()
    await setDateFrom('2026-06-01')
    expect(mockListTrips).not.toHaveBeenCalled()
  })

  it('setCorridor sends departure and arrival in the query', async () => {
    const useTrips = await importUseTrips()
    const { corridor, setCorridor } = useTrips()
    await setCorridor({ departure: 'Paris', arrival: 'Dakar' })
    expect(corridor.value).toEqual({ departure: 'Paris', arrival: 'Dakar' })
    expect(mockListTrips).toHaveBeenLastCalledWith(
      expect.objectContaining({ departure: 'Paris', arrival: 'Dakar' }),
    )
  })

  it('fetchCorridors populates corridors on success', async () => {
    mockGetCorridors.mockResolvedValue([{ departure: 'Lyon', arrival: 'Abidjan' }])
    const useTrips = await importUseTrips()
    const { corridors, fetchCorridors } = useTrips()
    await fetchCorridors()
    expect(corridors.value).toEqual([{ departure: 'Lyon', arrival: 'Abidjan' }])
  })

  it('fetchCorridors stays silent and keeps corridors empty on error', async () => {
    mockGetCorridors.mockRejectedValue(new Error('boom'))
    const useTrips = await importUseTrips()
    const { corridors, fetchCorridors } = useTrips()
    await fetchCorridors()
    expect(corridors.value).toEqual([])
  })
})
