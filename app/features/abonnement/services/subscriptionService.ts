import { useApi } from '@/composables/useApi'
import type { BillingCycle, BillingSessionUrl, ProSubscription } from '@/features/abonnement/types/index'

export function subscriptionService() {
  const api = useApi()

  async function fetchSubscription(): Promise<ProSubscription> {
    return api<ProSubscription>('/billing/subscription')
  }

  async function createCheckoutSession(cycle: BillingCycle): Promise<BillingSessionUrl> {
    return api<BillingSessionUrl>('/billing/checkout-session', {
      method: 'POST',
      query: { cycle },
    })
  }

  async function createPortalSession(): Promise<BillingSessionUrl> {
    return api<BillingSessionUrl>('/billing/portal-session', {
      method: 'POST',
    })
  }

  return { fetchSubscription, createCheckoutSession, createPortalSession }
}
