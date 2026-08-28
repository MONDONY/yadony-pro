<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { CheckCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useSubscription } from '@/features/abonnement/composables/useSubscription'
import { refreshIfPendingActivation } from '@/features/abonnement/lib/refreshIfPendingActivation'
import PricingCard from '@/features/abonnement/components/PricingCard.vue'
import type { BillingCycle } from '@/features/abonnement/types/index'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const auth = useAuthStore()
const { actionLoading, error, subscribe } = useSubscription()

// Retour de Stripe Checkout après paiement réussi (`?success=1`). Le webhook
// Stripe peut ne pas avoir encore atterri côté backend au moment où le
// navigateur revient : sans cet état dédié, un utilisateur qui vient d'être
// débité reverrait la grille tarifaire sans un mot, et reculiquer produirait
// un 409 sans issue (boucle fermée avec la page de gestion, cf. pro-only.ts).
const paymentSucceeded = ref(route.query.success === '1')
const isVerifying = ref(false)
const verifyAttempted = ref(false)

onMounted(async () => {
  const isPendingActivation = await refreshIfPendingActivation(auth, route.query)
  if (isPendingActivation && auth.isProAccount) {
    await navigateTo('/parametres/abonnement')
  }
})

/** Rejoue le rafraîchissement du profil ; bascule vers la page de gestion dès
 *  que le webhook a fini par atterrir, reste sur l'état d'attente sinon. */
async function onCheckActivation() {
  isVerifying.value = true
  await auth.refreshUser()
  isVerifying.value = false
  verifyAttempted.value = true
  if (auth.isProAccount) {
    await navigateTo('/parametres/abonnement')
  }
}

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
    <div v-if="paymentSucceeded" class="space-y-6" data-test="upgrade-payment-pending">
      <CheckCircle class="h-10 w-10 mx-auto text-success" aria-hidden="true" />
      <div class="space-y-2">
        <h1 class="font-display text-2xl font-bold text-text">Paiement reçu</h1>
        <p class="text-text-muted">
          Ton paiement a bien été enregistré. L'activation de ton espace PRO est en cours et ne devrait prendre
          que quelques instants.
        </p>
      </div>

      <p v-if="verifyAttempted" class="text-sm text-text-muted" data-test="upgrade-still-pending">
        Toujours en cours de traitement. Réessaie dans quelques instants.
      </p>

      <Button :disabled="isVerifying" data-test="upgrade-check-activation-button" @click="onCheckActivation">
        {{ isVerifying ? 'Vérification…' : 'Vérifier à nouveau' }}
      </Button>
    </div>

    <template v-else>
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
    </template>
  </div>
</template>
