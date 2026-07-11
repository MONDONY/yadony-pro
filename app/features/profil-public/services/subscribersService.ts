// app/features/profil-public/services/subscribersService.ts
import { useApi } from '@/composables/useApi'

export interface Subscriber {
  senderId: string
  displayName: string
  subscribedAt: string
}

export function subscribersService() {
  const api = useApi()

  /** Expéditeurs abonnés aux trajets du voyageur connecté. */
  async function getMySubscribers(): Promise<Subscriber[]> {
    return api<Subscriber[]>('/me/subscribers', {})
  }

  return { getMySubscribers }
}
