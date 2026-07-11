// tests/unit/features/search/useGlobalSearch.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSearchAll = vi.fn()

vi.mock('@/features/search/services/searchService', () => ({
  searchService: () => ({ searchAll: mockSearchAll }),
}))

async function importComposable() {
  const mod = await import('@/features/search/composables/useGlobalSearch')
  return mod.useGlobalSearch
}

const emptyResults = { colis: [], trajets: [], tracking: null }

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('open/close/toggle pilotent isOpen et reset la requête à la fermeture', async () => {
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    expect(s.isOpen.value).toBe(false)
    s.open()
    expect(s.isOpen.value).toBe(true)
    s.query.value = 'abc'
    s.close()
    expect(s.isOpen.value).toBe(false)
    expect(s.query.value).toBe('')
    s.toggle()
    expect(s.isOpen.value).toBe(true)
  })

  it('déclenche searchAll après le debounce quand la requête a au moins 2 caractères', async () => {
    mockSearchAll.mockResolvedValue(emptyResults)
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    s.open()
    s.query.value = 'Da'
    await vi.advanceTimersByTimeAsync(300)
    expect(mockSearchAll).toHaveBeenCalledWith('Da')
  })

  it('ne recherche pas pour moins de 2 caractères', async () => {
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    s.open()
    s.query.value = 'D'
    await vi.advanceTimersByTimeAsync(300)
    expect(mockSearchAll).not.toHaveBeenCalled()
  })

  it('debounce : une seule requête pour une frappe rapide', async () => {
    mockSearchAll.mockResolvedValue(emptyResults)
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    s.open()
    s.query.value = 'Da'
    await vi.advanceTimersByTimeAsync(100)
    s.query.value = 'Dak'
    await vi.advanceTimersByTimeAsync(100)
    s.query.value = 'Daka'
    await vi.advanceTimersByTimeAsync(300)
    expect(mockSearchAll).toHaveBeenCalledTimes(1)
    expect(mockSearchAll).toHaveBeenCalledWith('Daka')
  })

  it('expose les résultats du service', async () => {
    mockSearchAll.mockResolvedValue({
      colis: [{ id: 'b1', type: 'colis', title: 'x', to: '/colis?bid=b1' }],
      trajets: [],
      tracking: null,
    })
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    s.open()
    s.query.value = 'xy'
    await vi.advanceTimersByTimeAsync(300)
    expect(s.results.value.colis).toHaveLength(1)
  })

  it('navShortcuts filtre les raccourcis par la requête', async () => {
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    s.query.value = ''
    expect(s.navShortcuts.value.length).toBeGreaterThan(5)
    s.query.value = 'cock'
    expect(s.navShortcuts.value).toHaveLength(1)
    expect(s.navShortcuts.value[0].title).toBe('Cockpit')
  })

  it('navShortcuts ignore les accents dans le filtre', async () => {
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    s.query.value = 'negociations'
    expect(s.navShortcuts.value.some((n) => n.title === 'Négociations')).toBe(true)
  })

  it('vider la requête vide les résultats sans appel réseau', async () => {
    mockSearchAll.mockResolvedValue({
      colis: [{ id: 'b1', type: 'colis', title: 'x', to: '/x' }],
      trajets: [],
      tracking: null,
    })
    const useGlobalSearch = await importComposable()
    const s = useGlobalSearch()
    s.open()
    s.query.value = 'xy'
    await vi.advanceTimersByTimeAsync(300)
    expect(s.results.value.colis).toHaveLength(1)
    s.query.value = ''
    await vi.advanceTimersByTimeAsync(300)
    expect(s.results.value.colis).toHaveLength(0)
    expect(mockSearchAll).toHaveBeenCalledTimes(1)
  })
})
