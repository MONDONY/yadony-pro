<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useSubscription } from '@/features/abonnement/composables/useSubscription'
import PricingCard from '@/features/abonnement/components/PricingCard.vue'
import type { BillingCycle } from '@/features/abonnement/types/index'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const { actionLoading, error, subscribe } = useSubscription()

// On ne peut pas rattacher un paiement à un compte inconnu : un visiteur non
// connecté qui tente de s'abonner est renvoyé se connecter plutôt que de
// déclencher un appel voué à échouer côté backend.
async function onSubscribe(cycle: BillingCycle) {
  if (!auth.isAuthenticated) {
    await navigateTo('/login')
    return
  }

  const url = await subscribe(cycle)
  // Redirection dans l'onglet courant : le parcours se termine par un retour
  // sur le portail, un nouvel onglet laisserait l'utilisateur devant une page
  // périmée (à la différence de la vérification KYC, qui ne revient jamais).
  if (url && import.meta.client) {
    window.location.href = url
  }
}
</script>

<template>
  <div class="w-full max-w-2xl space-y-8 text-center" data-test="upgrade-page">
    <div class="space-y-2">
      <h1 class="font-display text-2xl font-bold text-text">Passe au workspace PRO</h1>
      <p class="text-text-muted">
        Débloque le cockpit voyageur complet&nbsp;: automatisations, alertes corridor, grille tarifaire,
        négociations et bien plus.
      </p>
    </div>

    <p v-if="error" class="text-sm text-danger" data-test="upgrade-error">{{ error }}</p>

    <div class="grid gap-4 sm:grid-cols-2 text-left" data-test="upgrade-pricing">
      <PricingCard cycle="MONTHLY" :is-loading="actionLoading" @subscribe="onSubscribe" />
      <PricingCard cycle="YEARLY" featured :is-loading="actionLoading" @subscribe="onSubscribe" />
    </div>
  </div>
</template>
