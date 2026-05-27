import { ref } from 'vue'
import { publicProfileService } from '@/features/profil-public/services/publicProfileService'
import type { PublicProfile } from '@/features/profil-public/types/index'

export function usePublicProfile() {
  const profile = ref<PublicProfile | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = publicProfileService()

  async function fetchProfile(userId: string): Promise<void> {
    if (!userId) {
      error.value = 'Profil indisponible.'
      return
    }
    isLoading.value = true
    error.value = null
    try {
      profile.value = await svc.fetchPublicProfile(userId)
    } catch {
      error.value = 'Impossible de charger ton profil public.'
    } finally {
      isLoading.value = false
    }
  }

  return { profile, isLoading, error, fetchProfile }
}
