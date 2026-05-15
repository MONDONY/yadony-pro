import { useApi } from '@/composables/useApi'
import type { MatchingRequest } from '@/features/demandes/types/index'

export function matchingService() {
  const api = useApi()

  async function fetchMatchingRequests(): Promise<MatchingRequest[]> {
    return api<MatchingRequest[]>('/travelers/me/matching-requests', {})
  }

  async function inviteRequest(requestId: string, announcementId: string): Promise<void> {
    await api<void>('/travelers/me/invite', { method: 'POST', body: { requestId, announcementId } })
  }

  return { fetchMatchingRequests, inviteRequest }
}
