// app/features/ratings/composables/useRatings.ts
import { ref } from 'vue'
import { ratingsService } from '@/features/ratings/services/ratingsService'
import type { PendingRating, RatingsSummary } from '@/features/ratings/types/index'

export function useRatings() {
  const pending = ref<PendingRating | null>(null)
  const received = ref<RatingsSummary | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const svc = ratingsService()

  async function fetchPending(): Promise<void> {
    pending.value = await svc.getPendingRating()
  }

  async function fetchReceived(page = 0): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      received.value = await svc.getMyReceivedRatings(page)
    } catch {
      error.value = 'Impossible de charger tes notes.'
    } finally {
      isLoading.value = false
    }
  }

  async function submitRating(bidId: string, stars: number, comment: string): Promise<void> {
    isSubmitting.value = true
    try {
      await svc.rateSender(bidId, stars, comment)
      await fetchPending() // la notation soumise sort de la file d'attente
    } finally {
      isSubmitting.value = false
    }
  }

  return { pending, received, isLoading, isSubmitting, error, fetchPending, fetchReceived, submitRating }
}
