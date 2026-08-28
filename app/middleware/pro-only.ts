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
    // Le paramètre de succès doit survivre au renvoi : si le webhook Stripe
    // n'a toujours pas atterri après le rafraîchissement ci-dessus, la page
    // de vente doit savoir qu'un paiement vient d'avoir lieu (état
    // d'activation en cours) plutôt que de rafficher la grille tarifaire à
    // un utilisateur qui vient d'être débité, sans un mot.
    if (to?.query?.success === '1') {
      return navigateTo({ path: '/upgrade', query: { success: '1' } })
    }
    return navigateTo('/upgrade')
  }
})
