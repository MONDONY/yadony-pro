<!-- app/features/trajets/components/TripDetailHeader.vue -->
<script setup lang="ts">
import { Plane, Car, Bus, Footprints, ArrowLeft, Pencil, Trash2 } from 'lucide-vue-next'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
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
  DRAFT: 'Brouillon', ACTIVE: 'Actif', FULL: 'Complet', IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé', CANCELLED: 'Annulé',
}

const statusVariant: Record<string, BadgeVariants['variant']> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  FULL: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
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
      <h1 class="text-xl font-semibold text-text font-display truncate">
        {{ trip.departureCity.label }}
        <span class="text-primary mx-1">→</span>
        {{ trip.arrivalCity.label }}
      </h1>
      <Badge :variant="statusVariant[trip.status]" size="sm" class="flex-shrink-0">
        {{ statusLabel[trip.status] }}
      </Badge>
    </div>

    <div class="flex items-center gap-2 flex-shrink-0">
      <NuxtLink
        :to="`/trajets/${trip.id}/modifier`"
        data-test="btn-edit-trip"
        class="flex items-center gap-1.5 h-9 px-3 rounded-btn border border-border-strong text-sm text-text-muted hover:text-text hover:bg-surface-el transition-colors"
      >
        <Pencil class="w-3.5 h-3.5" />
        Modifier
      </NuxtLink>
      <button
        data-test="btn-delete-trip"
        class="flex items-center gap-1.5 h-9 px-3 rounded-btn border border-danger/50 text-sm text-danger hover:bg-danger/10 transition-colors"
        @click="emit('delete')"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Supprimer
      </button>
    </div>
  </div>
</template>
