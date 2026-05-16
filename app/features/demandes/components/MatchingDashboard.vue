<!-- app/features/demandes/components/MatchingDashboard.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMatchingRequests } from '@/features/demandes/composables/useMatchingRequests'
import TripSelector from '@/features/demandes/components/TripSelector.vue'
import DemandFilters from '@/features/demandes/components/DemandFilters.vue'
import EmptyStateNoTrip from '@/features/demandes/components/EmptyStateNoTrip.vue'
import MatchingRequestCard from '@/features/demandes/components/MatchingRequestCard.vue'
import NegotiationStartModal from '@/features/negociations/components/NegotiationStartModal.vue'
import CreateTripFromDemandModal from '@/features/demandes/components/CreateTripFromDemandModal.vue'
import type { MatchingRequest, FilterState } from '@/features/demandes/types/index'
import { DEFAULT_FILTER_STATE } from '@/features/demandes/types/index'

const { requests, isLoading, error, fetchRequests, activeTrips, hasActiveTrips } = useMatchingRequests()

onMounted(() => { fetchRequests() })

// ── État local ──────────────────────────────────────────────────────────────

const selectedTripId = ref<string | null>(null)
const filters = ref<FilterState>({ ...DEFAULT_FILTER_STATE })

// Auto-sélectionner le premier trajet après chargement
watch(activeTrips, (trips) => {
  if (trips.length > 0 && selectedTripId.value === null) {
    selectedTripId.value = trips[0].tripId
  }
}, { immediate: true })

// ── Computed : filtrage + tri ────────────────────────────────────────────────

const filteredRequests = computed(() => {
  let result = [...requests.value]

  if (selectedTripId.value !== null) {
    result = result.filter(r => r.tripId === selectedTripId.value)
  }
  if (filters.value.maxWeightKg !== null) {
    result = result.filter(r => r.weightKg <= filters.value.maxWeightKg!)
  }
  if (filters.value.minBudgetPerKg !== null) {
    result = result.filter(r => r.budgetPerKg >= filters.value.minBudgetPerKg!)
  }
  if (filters.value.contentType !== null) {
    result = result.filter(r => r.contentType === filters.value.contentType)
  }

  switch (filters.value.sortBy) {
    case 'date':
      result.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      break
    case 'price':
      result.sort((a, b) => b.budgetPerKg - a.budgetPerKg)
      break
    default:
      result.sort((a, b) => b.matchScore - a.matchScore)
  }

  return result
})

const availableContentTypes = computed(() =>
  [...new Set(requests.value
    .filter(r => selectedTripId.value === null || r.tripId === selectedTripId.value)
    .map(r => r.contentType),
  )],
)

// ── Modals ───────────────────────────────────────────────────────────────────

const negotiatingRequest = ref<MatchingRequest | null>(null)
const createTripRequest = ref<MatchingRequest | null>(null)
const negotiatedIds = ref<Set<string>>(new Set())

function openNegotiateModal(request: MatchingRequest) {
  if (!hasActiveTrips.value) {
    createTripRequest.value = request
  } else {
    negotiatingRequest.value = request
  }
}
</script>

<template>
  <div>
    <!-- Erreur -->
    <div v-if="error && !isLoading" class="flex flex-col items-center justify-center py-16 text-center px-4">
      <p class="text-red-400 font-medium text-sm">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
        type="button"
        @click="fetchRequests()"
      >Réessayer</button>
    </div>

    <template v-else-if="isLoading">
      <!-- Skeleton -->
      <div class="h-20 bg-surface border-b border-border animate-pulse" />
      <div class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div v-for="i in 6" :key="i" class="h-48 bg-surface border border-border rounded-card animate-pulse" />
      </div>
    </template>

    <template v-else>
      <!-- Pas de trajet actif -->
      <EmptyStateNoTrip v-if="!hasActiveTrips" />

      <template v-else>
        <!-- Sélecteur de trajet -->
        <TripSelector
          v-model="selectedTripId"
          :trips="activeTrips"
          :total-count="filteredRequests.length"
        />

        <!-- Filtres -->
        <DemandFilters
          v-model:filters="filters"
          :result-count="filteredRequests.length"
          :available-content-types="availableContentTypes"
        />

        <!-- Liste vide après filtrage -->
        <div v-if="filteredRequests.length === 0" class="flex flex-col items-center py-16 text-center text-sm text-text-muted">
          <p>Aucune demande ne correspond à ces filtres.</p>
          <button class="mt-2 underline text-xs" type="button" @click="filters = { ...DEFAULT_FILTER_STATE }">
            Réinitialiser les filtres
          </button>
        </div>

        <!-- Cards demandes -->
        <div v-else class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <MatchingRequestCard
            v-for="req in filteredRequests"
            :key="req.id"
            :request="req"
            :is-negotiating="negotiatingRequest?.id === req.id"
            :has-negotiated="negotiatedIds.has(req.id)"
            @negotiate="openNegotiateModal"
          />
        </div>
      </template>
    </template>

    <!-- Modals -->
    <NegotiationStartModal
      :request="negotiatingRequest"
      @close="negotiatingRequest = null"
      @success="(id) => { negotiatedIds.add(id); negotiatingRequest = null }"
    />

    <CreateTripFromDemandModal
      :request="createTripRequest"
      @close="createTripRequest = null"
      @success="(id) => { negotiatedIds.add(id); createTripRequest = null }"
    />
  </div>
</template>
