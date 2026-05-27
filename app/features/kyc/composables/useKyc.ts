import { ref, computed } from 'vue'
import { kycService } from '@/features/kyc/services/kycService'
import { describeKycStatus, type KycStatusInfo } from '@/features/kyc/types/index'

export function useKyc() {
  const status = ref<KycStatusInfo | null>(null)
  const isLoading = ref(false)
  const isStarting = ref(false)
  const error = ref<string | null>(null)

  const svc = kycService()

  const descriptor = computed(() => describeKycStatus(status.value?.kycStatus))

  async function fetchStatus(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      status.value = await svc.fetchStatus()
    } catch {
      error.value = 'Impossible de charger ton statut de vérification.'
    } finally {
      isLoading.value = false
    }
  }

  /** Starts a Stripe Identity session and returns the hosted verification URL (or null on error). */
  async function startVerification(): Promise<string | null> {
    isStarting.value = true
    error.value = null
    try {
      const session = await svc.startVerification()
      return session.stripeUrl
    } catch {
      error.value = 'Impossible de démarrer la vérification. Veuillez réessayer.'
      return null
    } finally {
      isStarting.value = false
    }
  }

  return { status, descriptor, isLoading, isStarting, error, fetchStatus, startVerification }
}
