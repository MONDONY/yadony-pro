// app/features/demandes/composables/useMatchingRequests.ts
import { ref } from 'vue'
import { matchingService } from '@/features/demandes/services/matchingService'
import type { MatchingRequest } from '@/features/demandes/types/index'

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

  return { requests, isLoading, error, fetchRequests }
}
