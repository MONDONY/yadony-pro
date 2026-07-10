<script setup lang="ts">
import { cn } from '@/lib/utils'
import { FALLBACK_COMMISSION_RATE } from '@/composables/useCommissionRate'

const props = withDefaults(
  defineProps<{
    modelValue: number
    error?: string
    commissionRate?: number
  }>(),
  { commissionRate: FALLBACK_COMMISSION_RATE },
)

const emit = defineEmits<{ 'update:modelValue': [v: number] }>()

const options = [5, 6, 7, 8]

function net(price: number): string {
  return (Math.round(price * (1 - props.commissionRate) * 100) / 100).toFixed(2)
}
</script>

<template>
  <div>
    <div class="grid grid-cols-4 gap-3">
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
          {{ price }}€
        </span>
        <span class="text-xs text-text-muted">→ <span class="font-mono tabular-nums">{{ net(price) }}€</span> nets</span>
      </button>
    </div>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
