import { ref } from 'vue'
import { tripsService } from '@/features/trajets/services/tripsService'
import type { Trip, TripFilter, ViewMode, DateMode, CorridorOption } from '@/features/trajets/types/index'

const PAGE_SIZE = 12

export function useTrips() {
  const activeFilter = ref<TripFilter>('TOUS')
  const viewMode = ref<ViewMode>('list')
  const search = ref('')
  const dateMode = ref<DateMode>('none')
  const date = ref<string | null>(null)
  const dateFrom = ref<string | null>(null)
  const dateTo = ref<string | null>(null)
  const corridor = ref<CorridorOption | null>(null)
  const corridors = ref<CorridorOption[]>([])

  const trips = ref<Trip[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalElements = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(0)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const svc = tripsService()

  async function fetchTrips(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const page = await svc.listTrips({
        filter: activeFilter.value,
        q: search.value || null,
        date: dateMode.value === 'day' ? date.value : null,
        dateFrom: dateMode.value === 'period' ? dateFrom.value : null,
        dateTo: dateMode.value === 'period' ? dateTo.value : null,
        departure: corridor.value?.departure ?? null,
        arrival: corridor.value?.arrival ?? null,
        page: currentPage.value,
        size: PAGE_SIZE,
      })
      trips.value = page.content
      totalElements.value = page.totalElements
      totalPages.value = page.totalPages
    } catch {
      error.value = 'Impossible de charger les trajets. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCorridors(): Promise<void> {
    try {
      corridors.value = await svc.getCorridors()
    } catch { /* silencieux */ }
  }

  async function goToPage(page: number): Promise<void> {
    currentPage.value = page
    await fetchTrips()
  }

  async function setFilter(filter: TripFilter): Promise<void> {
    activeFilter.value = filter
    currentPage.value = 0
    await fetchTrips()
  }

  function setSearch(value: string): void {
    search.value = value
    currentPage.value = 0
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fetchTrips(), 350)
  }

  async function setDateMode(mode: DateMode): Promise<void> {
    dateMode.value = mode
    if (mode === 'none') {
      date.value = null
      dateFrom.value = null
      dateTo.value = null
    } else if (mode === 'day') {
      dateFrom.value = null
      dateTo.value = null
    } else {
      date.value = null
    }
    currentPage.value = 0
    await fetchTrips()
  }

  async function setDate(value: string | null): Promise<void> {
    date.value = value
    currentPage.value = 0
    await fetchTrips()
  }

  async function setDateFrom(value: string | null): Promise<void> {
    dateFrom.value = value
    currentPage.value = 0
    // Only fetch if the range is complete or being cleared
    if (!value || dateTo.value) await fetchTrips()
  }

  async function setDateTo(value: string | null): Promise<void> {
    dateTo.value = value
    currentPage.value = 0
    await fetchTrips()
  }

  async function setCorridor(value: CorridorOption | null): Promise<void> {
    corridor.value = value
    currentPage.value = 0
    await fetchTrips()
  }

  function toggleView(): void {
    viewMode.value = viewMode.value === 'list' ? 'calendar' : 'list'
  }

  async function fetchTemplates(): Promise<Trip[]> {
    return svc.getTemplates()
  }

  return {
    activeFilter,
    viewMode,
    search,
    dateMode,
    date,
    dateFrom,
    dateTo,
    corridor,
    corridors,
    trips,
    isLoading,
    error,
    totalElements,
    totalPages,
    currentPage,
    pageSize: PAGE_SIZE,
    fetchTrips,
    fetchCorridors,
    goToPage,
    setFilter,
    setSearch,
    setDateMode,
    setDate,
    setDateFrom,
    setDateTo,
    setCorridor,
    toggleView,
    fetchTemplates,
  }
}
