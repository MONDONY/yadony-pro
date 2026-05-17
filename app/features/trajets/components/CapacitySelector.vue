<script setup lang="ts">
import type { CapacityUnit } from '@/features/trajets/types'

const props = defineProps<{
  modelValue: CapacityUnit
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CapacityUnit]
}>()

const options: Array<{ value: CapacityUnit; label: string; description: string }> = [
  { value: 'SUITCASE_23KG', label: '1 valise 23 kg', description: 'Format standard cabine' },
  { value: 'SUITCASE_32KG', label: '1 valise 32 kg', description: 'Grande valise' },
  { value: 'KG_FREE',       label: 'Kg libre',         description: 'Au kilo, sans contrainte' },
]
</script>

<template>
  <div class="space-y-2">
    <label class="text-sm font-medium text-text">Type de capacité</label>
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        :class="[
          'flex flex-col items-center gap-1 p-3 rounded-card border text-center transition-colors',
          modelValue === opt.value
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text'
        ]"
        @click="emit('update:modelValue', opt.value)"
      >
        <span class="text-sm font-semibold">{{ opt.label }}</span>
        <span class="text-xs opacity-70">{{ opt.description }}</span>
      </button>
    </div>
  </div>
</template>
