import { useApi } from '@/composables/useApi'
import type { PublicProfile } from '@/features/profil-public/types/index'

export function publicProfileService() {
  const api = useApi()

  async function fetchPublicProfile(userId: string): Promise<PublicProfile> {
    return api<PublicProfile>(`/users/${userId}/profile-public`)
  }

  return { fetchPublicProfile }
}
