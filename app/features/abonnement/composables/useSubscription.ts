import { storeToRefs } from 'pinia'
import { useSubscriptionStore } from '@/stores/subscription'

// Fine couche au-dessus du store Pinia partagé : conserve l'API existante
// (subscription/isLoading/actionLoading/error + méthodes) pour que les
// appelants (layout, pages) n'aient rien à changer, tout en garantissant
// qu'ils lisent et écrivent tous le même état — cf. app/stores/subscription.ts.
export function useSubscription() {
  const store = useSubscriptionStore()
  const { subscription, isLoading, actionLoading, error } = storeToRefs(store)

  return {
    subscription,
    isLoading,
    actionLoading,
    error,
    fetchSubscription: store.fetchSubscription,
    subscribe: store.subscribe,
    openPortal: store.openPortal,
  }
}
