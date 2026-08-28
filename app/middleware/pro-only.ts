import { useAuthStore } from '@/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const auth = useAuthStore()

  // Retour de Stripe Checkout après paiement réussi (`?success=1`) : la
  // session peut avoir été restaurée avant que le webhook Stripe n'ait mis à
  // jour isProAccount côté backend. Sans ce rafraîchissement, ce middleware
  // renverrait l'utilisateur vers la page de vente qu'il vient tout juste de
  // quitter, juste après avoir payé — le défaut le plus visible que ce
  // parcours pourrait produire.
  if (to?.query?.success === '1' && !auth.isProAccount) {
    await auth.refreshUser()
  }

  if (!auth.isProAccount) {
    return navigateTo('/upgrade')
  }
})
