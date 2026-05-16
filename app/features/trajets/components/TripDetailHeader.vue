<!-- app/features/trajets/components/TripDetailHeader.vue -->
<script setup lang="ts">
import { Plane, Car, Bus, Footprints, ArrowLeft, Pencil, Trash2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Trip, TransportMode } from '@/features/trajets/types/index'

const props = defineProps<{
  trip: Trip
}>()

const emit = defineEmits<{
  'delete': []
}>()

const transportIcon: Record<TransportMode, typeof Plane> = {
  PLANE: Plane, CAR: Car, TRAIN: Plane, BUS: Bus, BOAT: Footprints, OTHER: Footprints,
}

const statusLabel: Record<string, string> = {
  ACTIVE: 'Actif', FULL: 'Complet', IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé', CANCELLED: 'Annulé',
}

const statusClass: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  FULL: 'bg-blue-500/20 text-blue-400',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  COMPLETED: 'bg-[#A8A294]/20 text-[#A8A294]',
  CANCELLED: 'bg-[#1E2A4A] text-[#A8A294]',
}
</script>

<template>
  <div class="flex items-start justify-between gap-4">
    <div class="flex items-center gap-3 min-w-0">
      <NuxtLink
        to="/trajets"
        class="flex-shrink-0 p-2 rounded-btn text-text-muted hover:text-text hover:bg-border transition-colors"
        aria-label="Retour"
      >
        <ArrowLeft class="w-4 h-4" />
      </NuxtLink>
      <component :is="transportIcon[trip.transportMode]" class="w-5 h-5 text-primary flex-shrink-0" />
      <h1 class="text-xl font-bold text-text font-display truncate">
        {{ trip.departureCity.label }}
        <span class="text-text-muted mx-1">→</span>
        {{ trip.arrivalCity.label }}
      </h1>
      <span :class="cn('flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full', statusClass[trip.status])">
        {{ statusLabel[trip.status] }}
      </span>
    </div>

    <div class="flex items-center gap-2 flex-shrink-0">
      <NuxtLink
        :to="`/trajets/${trip.id}/modifier`"
        data-test="btn-edit-trip"
        class="flex items-center gap-1.5 h-9 px-3 rounded-btn border border-border text-sm text-text-muted hover:text-text hover:border-primary/50 transition-colors"
      >
        <Pencil class="w-3.5 h-3.5" />
        Modifier
      </NuxtLink>
      <button
        data-test="btn-delete-trip"
        class="flex items-center gap-1.5 h-9 px-3 rounded-btn border border-red-400/50 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        @click="emit('delete')"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Supprimer
      </button>
    </div>
  </div>
</template>
