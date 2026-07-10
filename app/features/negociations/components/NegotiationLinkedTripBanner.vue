<script setup lang="ts">
import { computed } from 'vue'
import { Plane, Train, Car, Package, ChevronRight } from 'lucide-vue-next'
import type { LinkedTripSummary } from '@/features/negociations/types'

const props = defineProps<{
  trip: LinkedTripSummary
}>()

const emit = defineEmits<{
  click: []
}>()

const transportIcon = computed(() => {
  switch (props.trip.transportMode) {
    case 'PLANE': return Plane
    case 'TRAIN': return Train
    case 'CAR': return Car
    default: return Package
  }
})
</script>

<template>
  <button
    type="button"
    class="w-full flex items-center gap-3 px-4 py-3 rounded-el border border-primary/30 bg-primary/5 text-left transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-pop motion-reduce:hover:translate-y-0"
    @click="emit('click')"
  >
    <component :is="transportIcon" class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
    <div class="flex-1 min-w-0 text-left">
      <p class="text-sm font-semibold text-text truncate">
        {{ trip.departureCity }} → {{ trip.arrivalCity }}
      </p>
      <p class="text-xs text-text-muted font-mono tabular-nums">
        {{ trip.departureDate ?? '' }} · {{ trip.availableKg }} kg
      </p>
    </div>
    <ChevronRight class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
  </button>
</template>
