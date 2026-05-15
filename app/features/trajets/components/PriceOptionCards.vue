<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue: number
  error?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [v: number] }>()

const options = [5, 6, 7, 8]

function net(price: number): string {
  return (Math.round(price * 0.88 * 100) / 100).toFixed(2)
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
          'flex flex-col items-center gap-1 p-3 rounded-card border transition-colors',
          modelValue === price
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50',
        )"
        @click="emit('update:modelValue', price)"
      >
        <span :class="cn('text-xl font-bold', modelValue === price ? 'text-primary' : 'text-text')">
          {{ price }}€
        </span>
        <span class="text-xs text-text-muted">→ {{ net(price) }}€ nets</span>
      </button>
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>
