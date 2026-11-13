<script setup lang="ts">
import { computed } from 'vue'
import { formatPerM3, amountStep } from '@/lib/money'

const props = withDefaults(defineProps<{
  volume: number | null
  price: number | null
  currency: string
  errors?: { volume?: string; price?: string }
}>(), {
  errors: () => ({}),
})

const emit = defineEmits<{
  'update:volume': [value: number | null]
  'update:price': [value: number | null]
}>()

const priceStep = computed(() => amountStep(props.currency))

function parse(event: Event): number | null {
  const raw = (event.target as HTMLInputElement).value
  if (raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

const inputClass =
  'flex h-10 w-full rounded-input border bg-surface px-3 py-1 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]'
</script>

<template>
  <div class="space-y-5">
    <div>
      <label class="block text-sm font-medium text-text mb-1.5">
        Volume proposé (m³) <span class="text-danger">*</span>
      </label>
      <input
        :value="volume ?? ''"
        type="number"
        min="0.1"
        max="9999"
        step="0.1"
        inputmode="decimal"
        data-test="boat-volume"
        :class="[inputClass, errors.volume ? 'border-danger' : 'border-border-strong']"
        @input="emit('update:volume', parse($event))"
      >
      <p v-if="errors.volume" class="mt-1 text-xs text-danger">{{ errors.volume }}</p>
      <p v-else class="mt-1 text-xs text-text-muted">Volume proposé dans le conteneur, en mètres cubes.</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-text mb-1.5">
        Prix par m³ <span class="text-danger">*</span>
      </label>
      <input
        :value="price ?? ''"
        type="number"
        min="0.01"
        :step="priceStep"
        inputmode="decimal"
        data-test="boat-price-m3"
        :class="[inputClass, errors.price ? 'border-danger' : 'border-border-strong']"
        @input="emit('update:price', parse($event))"
      >
      <p v-if="errors.price" class="mt-1 text-xs text-danger">{{ errors.price }}</p>
      <p v-else-if="price !== null && price > 0" class="mt-1 text-xs text-text-muted">
        Vous recevez
        <span class="font-mono tabular-nums text-text font-medium" data-test="boat-net-price">{{ formatPerM3(price, currency) }}</span>
        · les frais de service yadony s'ajoutent côté expéditeur.
      </p>
      <p v-else class="mt-1 text-xs text-text-muted">Les frais de service yadony s'ajoutent côté expéditeur.</p>
    </div>
  </div>
</template>
