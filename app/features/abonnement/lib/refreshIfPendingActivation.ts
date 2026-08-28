import type { useAuthStore } from '@/stores/auth'

type AuthStore = ReturnType<typeof useAuthStore>
type QueryLike = Record<string, unknown> | null | undefined

/**
 * Retour de Stripe Checkout après paiement réussi (`?success=1`) : le
 * drapeau isProAccount peut être encore périmé si la session a été restaurée
 * avant que le webhook Stripe n'ait mis à jour le compte côté backend.
 *
 * Défense en profondeur DÉLIBÉRÉE, appelée depuis trois points distincts —
 * middleware/pro-only.ts, pages/parametres/abonnement.vue et pages/upgrade.vue —
 * qui peuvent chacun être atteints sans passer par les deux autres. Ne pas
 * réduire ces trois appels à un seul : seule la garde elle-même est
 * factorisée ici, chaque appelant garde sa propre logique de redirection.
 *
 * Renvoie `true` si un rafraîchissement était en attente (que le compte soit
 * bien devenu PRO ensuite ou non), pour que l'appelant puisse reproduire à
 * l'identique le comportement qu'il avait quand la garde et sa suite étaient
 * imbriquées dans le même `if`.
 */
export async function refreshIfPendingActivation(auth: AuthStore, query: QueryLike): Promise<boolean> {
  const isPending = query?.success === '1' && !auth.isProAccount
  if (isPending) {
    await auth.refreshUser()
  }
  return isPending
}
