<script setup lang="ts">
import { onMounted } from 'vue'
import { usePricing } from '@/features/pricing/composables/usePricing'
import PricingAssistant from '@/features/pricing/components/PricingAssistant.vue'
import { PRICING_CORRIDORS } from '@/features/pricing/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Assistant de prix',
  pageSubtitle: 'Positionne tes tarifs par rapport au marché',
})

const { marketPrice, commissionRate, isLoading, error, loadCommissionRate, selectCorridor } = usePricing()

onMounted(() => {
  loadCommissionRate()
})
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <section class="bg-surface border border-border rounded-card p-5">
      <header class="mb-4">
        <h2 class="font-display font-semibold text-base text-text">Comparateur de tarifs</h2>
        <p class="text-sm text-text-muted">
          Choisis un corridor et saisis ton prix au kilo pour voir le médian du marché et ton net après commission.
        </p>
      </header>

      <p v-if="error" class="mb-3 text-sm text-danger" data-test="pricing-error">{{ error }}</p>

      <PricingAssistant
        :corridors="PRICING_CORRIDORS"
        :market-price="marketPrice"
        :commission-rate="commissionRate"
        :is-loading="isLoading"
        @select-corridor="selectCorridor"
      />
    </section>
  </div>
</template>
