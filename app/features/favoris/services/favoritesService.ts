// app/features/favoris/services/favoritesService.ts
import { useApi } from '@/composables/useApi'

export type FavoriteType = 'trip' | 'package-request'

export interface FavoriteIds {
  trips: string[]
  packageRequests: string[]
}

export function favoritesService() {
  const api = useApi()

  async function addFavorite(type: FavoriteType, targetId: string): Promise<void> {
    await api<void>(`/favorites/${type}/${targetId}`, { method: 'PUT' })
  }

  async function removeFavorite(type: FavoriteType, targetId: string): Promise<void> {
    await api<void>(`/favorites/${type}/${targetId}`, { method: 'DELETE' })
  }

  async function getFavoriteIds(): Promise<FavoriteIds> {
    return api<FavoriteIds>('/favorites/ids', {})
  }

  return { addFavorite, removeFavorite, getFavoriteIds }
}
