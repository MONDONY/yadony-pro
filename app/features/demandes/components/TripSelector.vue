<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ActiveTrip } from '@/features/demandes/types/index'

const props = defineProps<{
  trips: ActiveTrip[]
  modelValue: string | null
  totalCount: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const isOpen = ref(false)

const selectedTrip = computed(() =>
  props.trips.find(t => t.tripId === props.modelValue) ?? null,
)

function select(tripId: string | null) {
  emit('update:modelValue', tripId)
  isOpen.value = false
}
</script>

<template>
  <div class="bg-green-500/5 border-b border-border px-4 py-3">
    <p class="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Mon trajet actif</p>
    <div class="flex items-center gap-3">
      <!-- Affichage du trajet sélectionné -->
      <div class="relative flex-1">
        <div class="flex items-center justify-between bg-surface border border-primary/40 rounded-btn px-3 py-2.5">
          <span class="text-sm font-semibold text-text">
            {{ selectedTrip ? `✈️ ${selectedTrip.tripCorridor}` : '🗂️ Tous mes trajets' }}
            <span class="text-text-muted font-normal text-xs ml-2">
              {{ selectedTrip
                ? `· ${selectedTrip.tripDepartureDate} · ${selectedTrip.tripAvailableKg} kg dispo`
                : '' }}
            </span>
          </span>
          <button
            v-if="trips.length > 1"
            data-test="trip-dropdown-toggle"
            class="text-text-muted text-xs ml-2"
            type="button"
            @click="isOpen = !isOpen"
          >▾</button>
        </div>

        <!-- Dropdown -->
        <div
          v-if="isOpen && trips.length > 1"
          class="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-btn shadow-lg z-20 overflow-hidden"
        >
          <button
            data-test="trip-option-all"
            class="w-full text-left px-3 py-2.5 text-sm hover:bg-bg transition-colors border-b border-border text-text-muted"
            type="button"
            @click="select(null)"
          >
            🗂️ Tous mes trajets
          </button>
          <button
            v-for="trip in trips"
            :key="trip.tripId"
            :data-test="`trip-option-${trip.tripId}`"
            class="w-full text-left px-3 py-2.5 text-sm hover:bg-bg transition-colors flex items-center justify-between"
            type="button"
            @click="select(trip.tripId)"
          >
            <span class="font-medium text-text">✈️ {{ trip.tripCorridor }}</span>
            <span class="text-xs text-text-muted">{{ trip.matchCount }} demande{{ trip.matchCount > 1 ? 's' : '' }}</span>
          </button>
        </div>
      </div>

      <a
        href="/trajets/nouveau"
        class="shrink-0 bg-primary text-white text-xs font-semibold px-3 py-2.5 rounded-btn hover:bg-primary/90 transition-colors whitespace-nowrap"
      >+ Nouveau</a>
    </div>
    <p class="text-xs text-text-muted mt-1.5">{{ totalCount }} demande{{ totalCount > 1 ? 's' : '' }} trouvée{{ totalCount > 1 ? 's' : '' }}</p>
  </div>
</template>
