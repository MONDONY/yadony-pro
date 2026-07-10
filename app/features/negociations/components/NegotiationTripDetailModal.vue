<script setup lang="ts">
import type { LinkedTripSummary } from '@/features/negociations/types'

defineProps<{
  open: boolean
  trip: LinkedTripSummary
}>()

const emit = defineEmits<{
  close: []
}>()

function transportLabel(mode: string | null): string {
  switch (mode) {
    case 'PLANE': return 'Avion'
    case 'TRAIN': return 'Train'
    case 'CAR': return 'Voiture'
    default: return 'Transport'
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const parts = iso.split('-')
  const months = ['', 'jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `${parseInt(parts[2])} ${months[parseInt(parts[1])]} ${parts[0]}`
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center bg-black/60" @click.self="emit('close')">
      <div class="w-full max-w-lg bg-surface rounded-t-sheet border-t border-border p-6 pb-8 shadow-pop space-y-4">
        <div class="mx-auto w-10 h-1 bg-border-strong rounded-full" />
        <h2 class="font-display text-lg font-semibold text-text">Trajet lié</h2>

        <div class="space-y-3">
          <div v-if="trip.transportMode" class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Transport</span>
            <span class="text-sm font-semibold text-text">{{ transportLabel(trip.transportMode) }}</span>
          </div>
          <div class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Itinéraire</span>
            <span class="text-sm font-semibold text-text">{{ trip.departureCity }} → {{ trip.arrivalCity }}</span>
          </div>
          <div v-if="trip.departureDate" class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Date</span>
            <span class="text-sm font-semibold text-text font-mono tabular-nums">{{ formatDate(trip.departureDate) }}</span>
          </div>
          <div v-if="trip.departureTime" class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Heure départ</span>
            <span class="text-sm font-semibold text-text font-mono tabular-nums">{{ trip.departureTime }}</span>
          </div>
          <div class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Poids dispo</span>
            <span class="text-sm font-semibold text-text font-mono tabular-nums">{{ trip.availableKg }} kg</span>
          </div>
          <div v-if="trip.pickupAddressLabel" class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Remise</span>
            <span class="text-sm font-semibold text-text">{{ trip.pickupAddressLabel }}</span>
          </div>
          <div v-if="trip.deliveryAddressLabel" class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Livraison</span>
            <span class="text-sm font-semibold text-text">{{ trip.deliveryAddressLabel }}</span>
          </div>
          <div v-if="trip.description" class="flex gap-3 items-start">
            <span class="text-sm text-text-muted w-28 shrink-0">Note</span>
            <span class="text-sm text-text-muted">{{ trip.description }}</span>
          </div>
        </div>

        <button
          type="button"
          class="w-full mt-4 py-3 rounded-btn border border-border-strong text-text font-semibold text-sm hover:bg-surface-el transition-colors"
          @click="emit('close')"
        >
          Fermer
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
