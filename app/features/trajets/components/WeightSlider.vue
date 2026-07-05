<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [v: number] }>()

const min = computed(() => props.min ?? 1)
const max = computed(() => props.max ?? 23)

const fillPct = computed(() =>
  ((props.modelValue - min.value) / (max.value - min.value)) * 100,
)
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-between items-baseline">
      <span class="text-sm text-text-muted">Poids disponible</span>
      <span class="font-mono text-2xl font-semibold tabular-nums text-text">
        {{ modelValue }}<span class="ml-1 text-base font-sans text-text-muted">kg</span>
      </span>
    </div>
    <div class="relative h-5 flex items-center">
      <div class="absolute inset-x-0 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all"
          :style="{ width: fillPct + '%' }"
        />
      </div>
      <input
        type="range"
        :min="min"
        :max="max"
        :value="modelValue"
        class="relative w-full h-5 opacity-0 cursor-pointer"
        data-test="weight-slider"
        @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      />
    </div>
    <div class="flex justify-between text-xs text-text-muted">
      <span class="font-mono tabular-nums">{{ min }} kg</span>
      <span class="font-mono tabular-nums">{{ max }} kg</span>
    </div>
  </div>
</template>
