<script setup lang="ts">
import { onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useSubscription } from '@/features/abonnement/composables/useSubscription'
import SubscriptionStatusCard from '@/features/abonnement/components/SubscriptionStatusCard.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Abonnement',
  pageSubtitle: 'Gère ton abonnement PRO et ton moyen de paiement',
})

const route = useRoute()
const auth = useAuthStore()
const { subscription, isLoading, actionLoading, error, fetchSubscription, openPortal } = useSubscription()

onMounted(async () => {
  // Retour de Stripe Checkout après paiement réussi (`?success=1`, cf.
  // BillingProperties#successUrl côté backend) : le drapeau isProAccount peut
  // être encore périmé si la restauration de session a eu lieu avant que le
  // webhook Stripe ne mette à jour le compte. Le middleware pro-only se
  // charge déjà de rafraîchir avant de décider d'un éventuel renvoi vers la
  // page de vente ; on rafraîchit ici aussi (même garde `!isProAccount` pour
  // ne pas doubler systématiquement l'appel réseau que le middleware vient de
  // faire), pour que les données affichées soient à jour même si l'utilisateur
  // arrive sur cette page sans repasser par le middleware (navigation
  // interne, par exemple).
  if (route.query.success === '1' && !auth.isProAccount) {
    await auth.refreshUser()
  }
  await fetchSubscription()
})

async function onManagePortal() {
  const url = await openPortal()
  if (url && import.meta.client) {
    window.location.href = url
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6" data-test="subscription-page">
    <div v-if="isLoading" class="py-8 text-center text-sm text-text-muted" data-test="subscription-page-loading">
      Chargement…
    </div>

    <!-- Un échec réseau ne laisse aucun abonnement lisible : la carte de statut
         ne doit pas se monter, sous peine d'affirmer « Aucun abonnement » à un
         utilisateur nécessairement PRO (la page est derrière pro-only). -->
    <div
      v-else-if="error && !subscription"
      class="bg-surface border border-border rounded-card p-5 space-y-3"
      data-test="subscription-page-error-state"
    >
      <p class="text-sm text-danger" data-test="subscription-page-error">{{ error }}</p>
      <Button variant="outline" data-test="subscription-page-retry-button" @click="fetchSubscription">
        Réessayer
      </Button>
    </div>

    <template v-else>
      <p v-if="error" class="text-sm text-danger" data-test="subscription-page-error">{{ error }}</p>

      <SubscriptionStatusCard
        :subscription="subscription"
        :is-loading="actionLoading"
        @manage-portal="onManagePortal"
      />
    </template>
  </div>
</template>
