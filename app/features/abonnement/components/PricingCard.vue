<!-- app/features/abonnement/components/PricingCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { SUBSCRIPTION_PRICING, type BillingCycle } from '@/features/abonnement/types/index'

const props = withDefaults(
  defineProps<{
    cycle: BillingCycle
    isLoading?: boolean
    featured?: boolean
  }>(),
  {
    isLoading: false,
    featured: false,
  },
)

const emit = defineEmits<{
  subscribe: [cycle: BillingCycle]
}>()

const plan = computed(() => SUBSCRIPTION_PRICING[props.cycle])

const planTitle = computed(() => (props.cycle === 'YEARLY' ? 'Formule annuelle' : 'Formule mensuelle'))

const savingsLabel = computed(() => {
  if (props.cycle !== 'YEARLY') return null
  const { MONTHLY, YEARLY } = SUBSCRIPTION_PRICING
  const savings = MONTHLY.amount * 12 - YEARLY.amount
  const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: YEARLY.currency }).format(savings)
  return `Économisez ${formatted} par an, soit l'équivalent de 2 mois offerts`
})

function handleSubscribe(): void {
  emit('subscribe', props.cycle)
}
</script>

<template>
  <div
    class="relative bg-surface border rounded-card p-5"
    :class="featured ? 'border-primary/40 shadow-pop' : 'border-border'"
    data-test="pricing-card"
  >
    <span
      v-if="featured"
      class="inline-flex items-center gap-1 text-2xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2"
      data-test="pricing-card-featured-badge"
    >
      <Sparkles class="h-3 w-3" aria-hidden="true" />
      Recommandée
    </span>

    <p class="font-display font-semibold text-lg text-text" data-test="pricing-card-title">
      {{ planTitle }}
    </p>

    <p class="font-mono tabular-nums text-2xl font-semibold text-text mt-1" data-test="pricing-card-price">
      {{ plan.label }}
    </p>

    <p v-if="savingsLabel" class="text-sm text-success mt-2" data-test="pricing-card-savings">
      {{ savingsLabel }}
    </p>

    <Button
      class="w-full mt-4"
      :variant="featured ? 'default' : 'outline'"
      :disabled="isLoading"
      data-test="pricing-card-subscribe-button"
      @click="handleSubscribe"
    >
      {{ isLoading ? 'Chargement…' : "S'abonner" }}
    </Button>
  </div>
</template>
