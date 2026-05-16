import { ref, computed } from 'vue'
import { matchingService } from '@/features/demandes/services/matchingService'
import type { MatchingRequest, ActiveTrip } from '@/features/demandes/types/index'

export function useMatchingRequests() {
  const requests = ref<MatchingRequest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = matchingService()

  async function fetchRequests(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      requests.value = await svc.fetchMatchingRequests()
    } catch {
      error.value = 'Impossible de charger les demandes compatibles. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  const activeTrips = computed<ActiveTrip[]>(() => {
    const map = new Map<string, ActiveTrip>()
    for (const r of requests.value) {
      if (!map.has(r.tripId)) {
        map.set(r.tripId, {
          tripId: r.tripId,
          tripCorridor: r.tripCorridor,
          tripDepartureDate: r.tripDepartureDate,
          tripAvailableKg: r.tripAvailableKg,
          matchCount: 0,
        })
      }
      map.get(r.tripId)!.matchCount++
    }
    return [...map.values()]
  })

  const hasActiveTrips = computed(() => activeTrips.value.length > 0)

  return { requests, isLoading, error, fetchRequests, activeTrips, hasActiveTrips }
}
