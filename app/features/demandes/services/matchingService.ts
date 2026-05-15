import { useApi } from '@/composables/useApi'
import type { MatchingRequest } from '@/features/demandes/types/index'

export function matchingService() {
  const api = useApi()

  async function fetchMatchingRequests(): Promise<MatchingRequest[]> {
    return api.get('/travelers/me/matching-requests')
  }

  async function inviteRequest(requestId: string, announcementId: string): Promise<void> {
    await api.post('/travelers/me/invite', {
      body: { requestId, announcementId },
    })
  }

  return { fetchMatchingRequests, inviteRequest }
}
