// app/features/ratings/services/ratingsService.ts
import { useApi } from '@/composables/useApi'
import type { PendingRating, RatingsSummary } from '@/features/ratings/types/index'

export function ratingsService() {
  const api = useApi()

  /** Le voyageur note l'expéditeur après une livraison (1 à 5 étoiles). */
  async function rateSender(bidId: string, stars: number, comment: string): Promise<void> {
    await api('/ratings/traveler-to-sender', {
      method: 'POST',
      body: { bidId, stars, comment: comment.trim() || null },
    })
  }

  /** Notation en attente (204 → null). */
  async function getPendingRating(): Promise<PendingRating | null> {
    try {
      const res = await api<PendingRating | undefined>('/ratings/pending', {})
      return res?.bidId ? res : null
    } catch {
      return null // pas bloquant : le cockpit s'affiche sans l'encart
    }
  }

  async function getMyReceivedRatings(page = 0, size = 20): Promise<RatingsSummary> {
    return api<RatingsSummary>('/ratings/me/received', {
      query: { page: String(page), size: String(size) },
    })
  }

  return { rateSender, getPendingRating, getMyReceivedRatings }
}
