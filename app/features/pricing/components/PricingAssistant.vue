<!-- app/features/pricing/components/PricingAssistant.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  netPerKg,
  compareToMarket,
  type MarketPrice,
  type PricingCorridor,
} from '@/features/pricing/types/index'

const props = defineProps<{
  corridors: PricingCorridor[]
  marketPrice: MarketPrice | null
  commissionRate: number
  isLoading: boolean
}>()

const emit = defineEmits<{ 'select-corridor': [key: string] }>()

const selectedKey = ref('')
const pricePerKg = ref<number | null>(null)

function onCorridorChange() {
  if (selectedKey.value) emit('select-corridor', selectedKey.value)
}

const median = computed(() => props.marketPrice?.median ?? null)

const net = computed(() =>
  pricePerKg.value === null ? null : netPerKg(Number(pricePerKg.value), props.commissionRate),
)

const comparison = computed(() =>
  pricePerKg.value === null ? 'unknown' : compareToMarket(Number(pricePerKg.value), median.value),
)

const comparisonInfo = computed(() => {
  switch (comparison.value) {
    case 'aligned':
      return { label: 'Aligné sur le marché', class: 'text-success' }
    case 'above':
      return { label: 'Au-dessus du marché', class: 'text-warning' }
    case 'below':
      return { label: 'En-dessous du marché', class: 'text-text-muted' }
    default:
      return { label: 'Comparaison indisponible', class: 'text-text-muted' }
  }
})

const inputClass =
  'h-9 w-full rounded-btn border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary transition-colors'
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="corridor">Corridor</label>
        <select id="corridor" v-model="selectedKey" data-test="corridor-select" :class="inputClass" @change="onCorridorChange">
          <option value="" disabled>Choisis un corridor</option>
          <option v-for="c in corridors" :key="c.key" :value="c.key">{{ c.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="price">Ton prix (€/kg)</label>
        <input id="price" v-model.number="pricePerKg" data-test="price-input" type="number" min="0" step="0.5" :class="inputClass" />
      </div>
    </div>

    <div class="bg-surface-elevated rounded-card p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-text-muted">Prix médian du marché</span>
        <span class="text-sm font-semibold text-text" data-test="market-median">
          <template v-if="isLoading">…</template>
          <template v-else-if="median !== null">{{ median.toFixed(2) }} €/kg</template>
          <template v-else>—</template>
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-text-muted">Positionnement</span>
        <span class="text-sm font-medium" :class="comparisonInfo.class" data-test="comparison">{{ comparisonInfo.label }}</span>
      </div>
      <div class="flex items-center justify-between border-t border-border pt-3">
        <span class="text-sm text-text-muted">Ton net après commission ({{ Math.round(commissionRate * 100) }} %)</span>
        <span class="text-sm font-semibold text-text" data-test="net-per-kg">
          <template v-if="net !== null">{{ net.toFixed(2) }} €/kg</template>
          <template v-else>—</template>
        </span>
      </div>
    </div>
  </div>
</template>
