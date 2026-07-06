import { ref, computed } from 'vue'
import { payoutService } from '@/features/payout/services/payoutService'
import { describePayoutStatus, type ConnectAccount } from '@/features/payout/types/index'

export function usePayout() {
  const account = ref<ConnectAccount | null>(null)
  const isLoading = ref(false)
  const isWorking = ref(false)
  const error = ref<string | null>(null)

  const svc = payoutService()

  const descriptor = computed(() => describePayoutStatus(account.value?.stripeAccountStatus))

  async function fetchAccount(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      account.value = await svc.fetchAccount()
    } catch {
      error.value = 'Impossible de charger ton compte de paiement.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Ensures a Stripe account exists then returns the hosted onboarding URL (or null on error).
   * The caller is responsible for opening the URL (new tab / redirect).
   */
  async function startOnboarding(): Promise<string | null> {
    isWorking.value = true
    error.value = null
    try {
      if (!account.value || account.value.stripeAccountStatus === 'NOT_CREATED') {
        account.value = await svc.createAccount()
      }
      const link = await svc.createOnboardingLink()
      return link.url
    } catch {
      error.value = 'Impossible de démarrer la configuration des paiements. Veuillez réessayer.'
      return null
    } finally {
      isWorking.value = false
    }
  }

  async function refresh(): Promise<void> {
    isWorking.value = true
    error.value = null
    try {
      account.value = await svc.refreshAccount()
    } catch {
      error.value = 'Impossible d’actualiser le statut. Veuillez réessayer.'
    } finally {
      isWorking.value = false
    }
  }

  return { account, descriptor, isLoading, isWorking, error, fetchAccount, startOnboarding, refresh }
}
