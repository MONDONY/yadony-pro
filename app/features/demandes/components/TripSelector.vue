<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Plane, Layers, ChevronDown, Plus } from 'lucide-vue-next'
import { SectionLabel } from '@/components/ui/section-label'
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
const containerRef = ref<HTMLElement | null>(null)

const selectedTrip = computed(() =>
  props.trips.find(t => t.tripId === props.modelValue) ?? null,
)

function select(tripId: string | null) {
  emit('update:modelValue', tripId)
  isOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="containerRef" data-test="trip-selector" class="bg-success/5 border-b border-border px-4 py-3">
    <SectionLabel class="mb-2">Mon trajet actif</SectionLabel>
    <div class="flex items-center gap-3">
      <!-- Affichage du trajet sélectionné -->
      <div class="relative flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2 bg-surface border border-primary/40 rounded-input px-3 py-2.5">
          <span class="flex items-center gap-1.5 text-sm font-semibold text-text min-w-0 truncate">
            <component :is="selectedTrip ? Plane : Layers" class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span class="truncate">{{ selectedTrip ? selectedTrip.tripCorridor : 'Tous mes trajets' }}</span>
            <span v-if="selectedTrip" class="hidden sm:inline text-text-muted font-normal text-xs ml-2 font-mono tabular-nums whitespace-nowrap">
              · {{ selectedTrip.tripDepartureDate }} · {{ selectedTrip.tripAvailableKg }} kg dispo
            </span>
          </span>
          <button
            v-if="trips.length > 1"
            data-test="trip-dropdown-toggle"
            class="text-text-muted ml-2"
            type="button"
            :aria-expanded="isOpen"
            aria-haspopup="listbox"
            aria-label="Choisir un trajet"
            @click="isOpen = !isOpen"
          ><ChevronDown class="h-4 w-4" aria-hidden="true" /></button>
        </div>

        <!-- Dropdown -->
        <div
          v-if="isOpen && trips.length > 1"
          class="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-el shadow-pop z-20 overflow-hidden"
        >
          <button
            data-test="trip-option-all"
            class="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-el transition-colors border-b border-border text-text-muted flex items-center gap-2"
            type="button"
            @click="select(null)"
          >
            <Layers class="h-4 w-4 shrink-0" aria-hidden="true" /> Tous mes trajets
          </button>
          <button
            v-for="trip in trips"
            :key="trip.tripId"
            :data-test="`trip-option-${trip.tripId}`"
            class="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-el transition-colors flex items-center justify-between gap-2"
            type="button"
            @click="select(trip.tripId)"
          >
            <span class="flex items-center gap-2 font-medium text-text"><Plane class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> {{ trip.tripCorridor }}</span>
            <span class="text-xs text-text-muted"><span class="font-mono tabular-nums">{{ trip.matchCount }}</span> demande{{ trip.matchCount > 1 ? 's' : '' }}</span>
          </button>
        </div>
      </div>

      <NuxtLink
        to="/trajets/nouvelle-annonce"
        class="inline-flex shrink-0 items-center gap-1 bg-primary text-on-primary text-xs font-semibold px-3 py-2.5 rounded-btn shadow-btn hover:bg-primary-hover transition-colors whitespace-nowrap"
      ><Plus class="h-3.5 w-3.5" aria-hidden="true" /> Nouveau</NuxtLink>
    </div>
    <p class="text-xs text-text-muted mt-1.5"><span class="font-mono tabular-nums">{{ totalCount }}</span> demande{{ totalCount > 1 ? 's' : '' }} trouvée{{ totalCount > 1 ? 's' : '' }}</p>
  </div>
</template>
