import { ref } from 'vue'
import { tripsService } from '@/features/trajets/services/tripsService'
import type { Trip, TripFilter, ViewMode } from '@/features/trajets/types/index'

export function useTrips() {
  const activeFilter = ref<TripFilter>('TOUS')
  const viewMode = ref<ViewMode>('list')
  const trips = ref<Trip[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalElements = ref(0)

  const svc = tripsService()

  async function fetchTrips(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const page = await svc.listTrips({ filter: activeFilter.value, page: 0, size: 50 })
      trips.value = page.content
      totalElements.value = page.totalElements
    } catch {
      error.value = 'Impossible de charger les trajets. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  async function setFilter(filter: TripFilter): Promise<void> {
    activeFilter.value = filter
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
    trips,
    isLoading,
    error,
    totalElements,
    fetchTrips,
    setFilter,
    toggleView,
    fetchTemplates,
  }
}
