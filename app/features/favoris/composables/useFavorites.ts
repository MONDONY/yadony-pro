// app/features/favoris/composables/useFavorites.ts
import { ref } from 'vue'
import { favoritesService } from '@/features/favoris/services/favoritesService'

export function useFavorites() {
  const requestIds = ref<Set<string>>(new Set())
  const tripIds = ref<Set<string>>(new Set())

  const svc = favoritesService()

  async function loadIds(): Promise<void> {
    try {
      const ids = await svc.getFavoriteIds()
      requestIds.value = new Set(ids.packageRequests)
      tripIds.value = new Set(ids.trips)
    } catch {
      // non bloquant : les étoiles restent vides
    }
  }

  function isFavoriteRequest(id: string): boolean {
    return requestIds.value.has(id)
  }

  /** Toggle optimiste : l'étoile réagit tout de suite, rollback si le back échoue. */
  async function toggleRequest(id: string): Promise<void> {
    const wasFavorite = requestIds.value.has(id)
    const next = new Set(requestIds.value)
    if (wasFavorite) next.delete(id)
    else next.add(id)
    requestIds.value = next

    try {
      if (wasFavorite) await svc.removeFavorite('package-request', id)
      else await svc.addFavorite('package-request', id)
    } catch {
      const rollback = new Set(requestIds.value)
      if (wasFavorite) rollback.add(id)
      else rollback.delete(id)
      requestIds.value = rollback
    }
  }

  return { requestIds, tripIds, loadIds, isFavoriteRequest, toggleRequest }
}
