import { defineStore } from 'pinia'
import { subscriptionService } from '@/features/abonnement/services/subscriptionService'
import { extractProblem, TECHNICAL_ERROR_PATTERN } from '@/lib/apiError'
import type { BillingCycle, ProSubscription } from '@/features/abonnement/types/index'

const SUBSCRIPTION_ERROR_MESSAGES: Record<string, string> = {
  'subscription-already-active':
    'Votre abonnement est déjà en cours. Rendez-vous sur la page de gestion de votre abonnement.',
  'billing-not-configured': "L'abonnement n'est pas encore ouvert.",
  'no-stripe-customer': "Aucun abonnement payant n'est rattaché à votre compte.",
}

function resolveErrorMessage(e: unknown, genericMessage: string): string {
  const problem = extractProblem(e)
  if (problem.code && SUBSCRIPTION_ERROR_MESSAGES[problem.code]) {
    return SUBSCRIPTION_ERROR_MESSAGES[problem.code]
  }

  if (problem.detail && !TECHNICAL_ERROR_PATTERN.test(problem.detail)) {
    return problem.detail
  }

  return genericMessage
}

interface SubscriptionState {
  subscription: ProSubscription | null
  isLoading: boolean
  actionLoading: boolean
  error: string | null
}

// État partagé : le bandeau global (layouts/default.vue) et la page de
// gestion (pages/parametres/abonnement.vue) doivent lire/écrire la MÊME
// vérité. Avec un état par appelant, un rafraîchissement déclenché depuis la
// page (retour du Customer Portal Stripe) ne serait jamais vu par le
// bandeau, qui garderait indéfiniment sa valeur chargée au montage du layout.
export const useSubscriptionStore = defineStore('subscription', {
  state: (): SubscriptionState => ({
    subscription: null,
    isLoading: false,
    actionLoading: false,
    error: null,
  }),
  actions: {
    async fetchSubscription(): Promise<void> {
      this.isLoading = true
      this.error = null
      try {
        this.subscription = await subscriptionService().fetchSubscription()
      } catch (e) {
        this.error = resolveErrorMessage(e, 'Impossible de charger votre abonnement. Veuillez réessayer.')
      } finally {
        this.isLoading = false
      }
    },

    /** Démarre une session Stripe Checkout et renvoie son URL (ou null en cas d'échec). La navigation reste du ressort de la page appelante. */
    async subscribe(cycle: BillingCycle): Promise<string | null> {
      this.actionLoading = true
      this.error = null
      try {
        const session = await subscriptionService().createCheckoutSession(cycle)
        return session.url
      } catch (e) {
        this.error = resolveErrorMessage(e, 'Impossible de démarrer la souscription. Veuillez réessayer.')
        return null
      } finally {
        this.actionLoading = false
      }
    },

    /** Démarre une session du portail de facturation Stripe et renvoie son URL (ou null en cas d'échec). La navigation reste du ressort de la page appelante. */
    async openPortal(): Promise<string | null> {
      this.actionLoading = true
      this.error = null
      try {
        const session = await subscriptionService().createPortalSession()
        return session.url
      } catch (e) {
        this.error = resolveErrorMessage(e, "Impossible d'ouvrir la gestion de l'abonnement. Veuillez réessayer.")
        return null
      } finally {
        this.actionLoading = false
      }
    },
  },
})
