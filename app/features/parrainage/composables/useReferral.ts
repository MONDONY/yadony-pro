import { ref } from 'vue'
import { referralService } from '@/features/parrainage/services/referralService'
import type { ReferralInfo } from '@/features/parrainage/types/index'

export function useReferral() {
  const referral = ref<ReferralInfo | null>(null)
  const isLoading = ref(false)
  const isRegenerating = ref(false)
  const error = ref<string | null>(null)

  const svc = referralService()

  async function fetchReferral(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      referral.value = await svc.fetchReferral()
    } catch {
      error.value = 'Impossible de charger ton programme de parrainage.'
    } finally {
      isLoading.value = false
    }
  }

  async function regenerate(): Promise<void> {
    isRegenerating.value = true
    error.value = null
    try {
      referral.value = await svc.regenerate()
    } catch {
      error.value = 'Impossible de régénérer ton code (délai d’attente ?). Réessaie plus tard.'
    } finally {
      isRegenerating.value = false
    }
  }

  return { referral, isLoading, isRegenerating, error, fetchReferral, regenerate }
}
