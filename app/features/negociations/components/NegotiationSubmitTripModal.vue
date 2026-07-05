<!-- app/features/negociations/components/NegotiationSubmitTripModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { XCircle } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'

const props = defineProps<{
  open: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  'close': []
  'submit': [announcementId: string]
}>()

interface TripOption {
  id: string
  departureCity: string
  arrivalCity: string
  departureDate: string
  availableKg: number
}

const api = useApi()
const trips = ref<TripOption[]>([])
const loadingTrips = ref(false)
const selectedId = ref<string | null>(null)

async function loadTrips() {
  selectedId.value = null
  loadingTrips.value = true
  try {
    const page = await api<{ content: Array<{
      id: string
      departureCity: string
      arrivalCity: string
      departureDate: string
      availableKg: number
      status: string
    }> }>('/announcements/my', { query: { status: 'ACTIVE', size: '20' } })
    trips.value = page.content
  } finally {
    loadingTrips.value = false
  }
}

watch(() => props.open, (val) => {
  if (val) loadTrips()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div class="relative w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-pop space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-text">Lier un trajet actif</h3>
          <button class="text-text-muted hover:text-text p-1" @click="emit('close')">
            <XCircle class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-text-muted">Choisissez le trajet que vous allez utiliser pour transporter ce colis.</p>

        <div v-if="loadingTrips" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-16 bg-surface-el rounded-el animate-pulse" />
        </div>
        <div v-else-if="trips.length === 0" class="text-center py-6 text-sm text-text-muted">
          Aucun trajet actif disponible.
        </div>
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <label
            v-for="trip in trips"
            :key="trip.id"
            :data-test="`trip-option-${trip.id}`"
            class="flex items-center gap-3 p-3 rounded-el border cursor-pointer transition-colors"
            :class="selectedId === trip.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'"
          >
            <input
              v-model="selectedId"
              type="radio"
              :value="trip.id"
              class="accent-primary"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-text truncate">
                {{ trip.departureCity }} → {{ trip.arrivalCity }}
              </p>
              <p class="text-xs text-text-muted mt-0.5">
                <span class="font-mono tabular-nums">{{ new Date(trip.departureDate).toLocaleDateString('fr-FR') }}</span> · <span class="font-mono tabular-nums">{{ trip.availableKg }}</span> kg disponibles
              </p>
            </div>
          </label>
        </div>

        <div class="flex gap-2.5 pt-1">
          <button
            class="flex-1 h-10 rounded-btn border border-border-strong text-sm text-text hover:bg-surface-el transition-colors"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            :disabled="!selectedId || isLoading"
            class="flex-1 flex items-center justify-center h-10 rounded-btn bg-primary text-on-primary text-sm font-medium shadow-btn hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-test="submit-trip-btn"
            @click="selectedId && emit('submit', selectedId)"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            <span v-else>Lier ce trajet</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
