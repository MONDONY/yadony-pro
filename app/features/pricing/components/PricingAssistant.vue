<!-- app/features/pricing/components/PricingAssistant.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  compareToMarket,
  type MarketPrice,
  type PricingCorridor,
} from '@/features/pricing/types/index'
import { amountStep, currencySymbol, formatMoney, formatPerKg, roundToCurrency } from '@/lib/money'
import { minimumFor, type CommissionGrid } from '@/lib/commissionGrid'

const props = defineProps<{
  corridors: PricingCorridor[]
  marketPrice: MarketPrice | null
  /** Grille de commission en vigueur, null sans grille. */
  commissionGrid?: CommissionGrid | null
  isLoading: boolean
}>()

const emit = defineEmits<{ 'select-corridor': [key: string] }>()

const selectedKey = ref('')
const pricePerKg = ref<number | null>(null)

function onCorridorChange() {
  if (selectedKey.value) emit('select-corridor', selectedKey.value)
}

const median = computed(() => props.marketPrice?.median ?? null)

// Devise du marché du corridor : la saisie et le net s'y expriment.
const currency = computed(() => props.marketPrice?.currency)

// Le prix saisi EST le net du voyageur : les frais de service s'ajoutent côté
// expéditeur, rien n'est déduit du prix affiché.
const net = computed(() =>
  pricePerKg.value === null || !Number.isFinite(Number(pricePerKg.value)) || Number(pricePerKg.value) < 0
    ? null
    : roundToCurrency(Number(pricePerKg.value), currency.value),
)

const minimumFee = computed(() => minimumFor(props.commissionGrid ?? null, currency.value ?? 'EUR'))

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
        <label class="block text-sm font-medium text-text mb-1.5" for="price">Ton prix ({{ currencySymbol(currency) }}/kg)</label>
        <input id="price" v-model.number="pricePerKg" data-test="price-input" type="number" min="0" :step="amountStep(currency)" :class="inputClass" />
      </div>
    </div>

    <div class="bg-surface-elevated rounded-card p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-text-muted">Prix médian du marché</span>
        <span class="text-sm font-semibold text-text" data-test="market-median">
          <template v-if="isLoading">…</template>
          <template v-else-if="median !== null">{{ formatPerKg(median, currency) }}</template>
          <template v-else>—</template>
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-text-muted">Positionnement</span>
        <span class="text-sm font-medium" :class="comparisonInfo.class" data-test="comparison">{{ comparisonInfo.label }}</span>
      </div>
      <div class="flex items-center justify-between border-t border-border pt-3">
        <span class="text-sm text-text-muted">Tu reçois</span>
        <span class="text-sm font-semibold text-text" data-test="net-per-kg">
          <template v-if="net !== null">{{ formatPerKg(net, currency) }}</template>
          <template v-else>—</template>
        </span>
      </div>
      <p class="text-xs text-text-muted" data-test="fees-note">
        Les frais de service yadony s'ajoutent côté expéditeur<template v-if="minimumFee !== null">
          (minimum <span class="font-mono tabular-nums" data-test="minimum-fee">{{ formatMoney(minimumFee, currency) }}</span>)</template>.
      </p>
    </div>
  </div>
</template>
