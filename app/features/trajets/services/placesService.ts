import { useApi } from '@/composables/useApi'
import type { PlaceSuggestion, PlaceDetails } from '@/features/trajets/types/index'

export function placesService() {
  const api = useApi()

  async function autocomplete(
    query: string,
    sessionToken: string,
  ): Promise<PlaceSuggestion[]> {
    return api<PlaceSuggestion[]>('/api/v1/addresses/autocomplete', {
      method: 'POST',
      body: { query, sessionToken },
    })
  }

  async function getDetails(
    placeId: string,
    sessionToken: string,
  ): Promise<PlaceDetails> {
    return api<PlaceDetails>('/api/v1/addresses/details', {
      method: 'POST',
      body: { placeId, sessionToken },
    })
  }

  return { autocomplete, getDetails }
}
