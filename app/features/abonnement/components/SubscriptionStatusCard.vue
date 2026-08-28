<!-- app/features/abonnement/components/SubscriptionStatusCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { CreditCard, ArrowRight } from 'lucide-vue-next'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type ProSubscription,
} from '@/features/abonnement/types/index'

const props = withDefaults(
  defineProps<{
    subscription: ProSubscription | null
    isLoading?: boolean
  }>(),
  {
    isLoading: false,
  },
)

const emit = defineEmits<{
  'manage-portal': []
}>()

const statusLabel = computed(() => SUBSCRIPTION_STATUS_LABELS[props.subscription?.status ?? 'NONE'])

// Le cycle affiché doit être Mensuel/Annuel, jamais le tarif du catalogue
// courant (SUBSCRIPTION_PRICING) : un abonné historique ou promotionnel ne
// paie pas nécessairement le tarif catalogue affiché sur /upgrade.
const cycleLabel = computed(() => {
  const cycle = props.subscription?.billingCycle
  return cycle ? BILLING_CYCLE_LABELS[cycle] : null
})

const periodEndLabel = computed(() => {
  const iso = props.subscription?.currentPeriodEnd
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
})

// Le Customer Portal Stripe n'existe que pour les abonnements rattachés à un
// client Stripe : le proposer sans cela mènerait l'utilisateur à une erreur.
const hasStripeCustomer = computed(() => props.subscription?.source === 'STRIPE')

function handleManagePortal(): void {
  emit('manage-portal')
}
</script>

<template>
  <div class="bg-surface border border-border rounded-card p-5" data-test="subscription-status-card">
    <p class="font-display font-semibold text-lg text-text" data-test="subscription-status-label">
      {{ statusLabel }}
    </p>

    <p v-if="cycleLabel" class="font-mono tabular-nums text-sm text-text-muted mt-1" data-test="subscription-status-cycle">
      {{ cycleLabel }}
    </p>

    <p v-if="periodEndLabel" class="text-sm text-text-muted mt-1" data-test="subscription-status-period-end">
      Échéance le <span class="font-mono tabular-nums">{{ periodEndLabel }}</span>
    </p>

    <p
      v-if="subscription?.cancelAtPeriodEnd"
      class="text-sm text-warning mt-2"
      data-test="subscription-status-cancel-notice"
    >
      Résiliation programmée à la fin de la période en cours.
    </p>

    <Button
      v-if="hasStripeCustomer"
      class="mt-4"
      variant="outline"
      :disabled="isLoading"
      data-test="subscription-status-portal-button"
      @click="handleManagePortal"
    >
      <CreditCard class="h-4 w-4" aria-hidden="true" />
      Gérer mon abonnement
    </Button>

    <!-- Sans client Stripe rattaché (grâce historique, don d'accès admin, ou
         aucun abonnement), le Customer Portal n'existe pas : c'est le seul
         moyen de payer depuis le portail qu'il faut alors proposer. -->
    <NuxtLink
      v-else
      to="/upgrade"
      :class="buttonVariants({ variant: 'default' }) + ' mt-4'"
      data-test="subscription-status-upgrade-link"
    >
      S'abonner
      <ArrowRight class="h-4 w-4" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>
