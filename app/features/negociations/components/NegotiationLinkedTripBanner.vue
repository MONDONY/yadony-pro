<script setup lang="ts">
import { computed } from 'vue'
import type { LinkedTripSummary } from '@/features/negociations/types'

const props = defineProps<{
  trip: LinkedTripSummary
}>()

const emit = defineEmits<{
  click: []
}>()

const transportIcon = computed(() => {
  switch (props.trip.transportMode) {
    case 'PLANE': return '✈'
    case 'TRAIN': return '🚄'
    case 'CAR': return '🚗'
    default: return '📦'
  }
})
</script>

<template>
  <button
    type="button"
    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-opacity hover:opacity-80"
    style="background: linear-gradient(135deg, #1e293b, #0f2544); border-color: rgba(245,158,11,0.6);"
    @click="emit('click')"
  >
    <span class="text-lg">{{ transportIcon }}</span>
    <div class="flex-1 min-w-0 text-left">
      <p class="text-sm font-bold text-white truncate">
        {{ trip.departureCity }} → {{ trip.arrivalCity }}
      </p>
      <p class="text-xs text-slate-400 tabular-nums">
        {{ trip.departureDate ?? '' }} · {{ trip.availableKg }} kg
      </p>
    </div>
    <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</template>
