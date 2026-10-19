<script setup lang="ts">
import { cn } from '@/lib/utils'
import { computed } from 'vue'
import { formatMoney, pricePerKgOptions } from '@/lib/money'

const props = withDefaults(
  defineProps<{
    modelValue: number
    error?: string
    /** Devise du trajet : les paliers s'y expriment. */
    currency?: string
  }>(),
  { currency: 'EUR' },
)

const emit = defineEmits<{ 'update:modelValue': [v: number] }>()

const options = computed(() => pricePerKgOptions(props.currency))
</script>

<template>
  <div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button
        v-for="price in options"
        :key="price"
        type="button"
        :data-test="`price-${price}`"
        :class="cn(
          'flex flex-col items-center gap-1 p-3 rounded-el border transition-[transform,box-shadow,border-color] duration-150 ease-out',
          modelValue === price
            ? 'border-primary bg-primary/10 shadow-card'
            : 'border-border hover:-translate-y-px hover:border-primary/50 motion-reduce:hover:translate-y-0',
        )"
        @click="emit('update:modelValue', price)"
      >
        <span :class="cn('font-mono text-xl font-semibold tabular-nums', modelValue === price ? 'text-primary' : 'text-text')">
          {{ formatMoney(price, currency) }}
        </span>
        <span class="text-xs text-text-muted">net par kg</span>
      </button>
    </div>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
