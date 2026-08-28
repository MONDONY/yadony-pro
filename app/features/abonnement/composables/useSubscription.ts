import { ref } from 'vue'
import { subscriptionService } from '@/features/abonnement/services/subscriptionService'
import { extractProblem } from '@/lib/apiError'
import type { BillingCycle, ProSubscription } from '@/features/abonnement/types/index'

// Détecte un message brut de bas niveau (verbe HTTP, URL, code de statut) pour
// ne jamais l'afficher tel quel à l'utilisateur — cf. friendlyAuthError.
const TECHNICAL_ERROR_PATTERN = /\[(GET|POST|PUT|PATCH|DELETE)\]|https?:\/\/|\/api\/|:\s?\d{3}\b/i

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

export function useSubscription() {
  const subscription = ref<ProSubscription | null>(null)
  const isLoading = ref(false)
  const actionLoading = ref(false)
  const error = ref<string | null>(null)

  const svc = subscriptionService()

  async function fetchSubscription(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      subscription.value = await svc.fetchSubscription()
    } catch (e) {
      error.value = resolveErrorMessage(e, 'Impossible de charger votre abonnement. Veuillez réessayer.')
    } finally {
      isLoading.value = false
    }
  }

  /** Démarre une session Stripe Checkout et renvoie son URL (ou null en cas d'échec). La navigation reste du ressort de la page appelante. */
  async function subscribe(cycle: BillingCycle): Promise<string | null> {
    actionLoading.value = true
    error.value = null
    try {
      const session = await svc.createCheckoutSession(cycle)
      return session.url
    } catch (e) {
      error.value = resolveErrorMessage(e, 'Impossible de démarrer la souscription. Veuillez réessayer.')
      return null
    } finally {
      actionLoading.value = false
    }
  }

  /** Démarre une session du portail de facturation Stripe et renvoie son URL (ou null en cas d'échec). La navigation reste du ressort de la page appelante. */
  async function openPortal(): Promise<string | null> {
    actionLoading.value = true
    error.value = null
    try {
      const session = await svc.createPortalSession()
      return session.url
    } catch (e) {
      error.value = resolveErrorMessage(e, "Impossible d'ouvrir la gestion de l'abonnement. Veuillez réessayer.")
      return null
    } finally {
      actionLoading.value = false
    }
  }

  return { subscription, isLoading, actionLoading, error, fetchSubscription, subscribe, openPortal }
}
