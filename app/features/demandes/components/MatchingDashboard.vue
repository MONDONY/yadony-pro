<!-- app/features/demandes/components/MatchingDashboard.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useMatchingRequests } from '@/features/demandes/composables/useMatchingRequests'
import TripSelector from '@/features/demandes/components/TripSelector.vue'
import DemandFilters from '@/features/demandes/components/DemandFilters.vue'
import EmptyStateNoTrip from '@/features/demandes/components/EmptyStateNoTrip.vue'
import MatchingRequestCard from '@/features/demandes/components/MatchingRequestCard.vue'
import MatchingRequestRow from '@/features/demandes/components/MatchingRequestRow.vue'
import RequestDetailModal from '@/features/demandes/components/RequestDetailModal.vue'
import { SectionLabel } from '@/components/ui/section-label'
import NegotiationStartModal from '@/features/negociations/components/NegotiationStartModal.vue'
import CreateTripFromDemandModal from '@/features/demandes/components/CreateTripFromDemandModal.vue'
import { useFavorites } from '@/features/favoris/composables/useFavorites'
import type { MatchingRequest, FilterState } from '@/features/demandes/types/index'
import { DEFAULT_FILTER_STATE } from '@/features/demandes/types/index'

const { requests, isLoading, error, fetchRequests, activeTrips, hasActiveTrips } = useMatchingRequests()
const { loadIds, isFavoriteRequest, toggleRequest } = useFavorites()

onMounted(() => {
  fetchRequests()
  loadIds()
})

// ── État local ──────────────────────────────────────────────────────────────

const selectedTripId = ref<string | null>(null)
const filters = ref<FilterState>({ ...DEFAULT_FILTER_STATE })
const viewMode = ref<'card' | 'list'>('card')
const currentPage = ref(1)

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

// ── Pagination ───────────────────────────────────────────────────────────────

const itemsPerPage = computed(() => viewMode.value === 'card' ? 10 : 20)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRequests.value.length / itemsPerPage.value)))

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredRequests.value.slice(start, start + itemsPerPage.value)
})

const paginationLabel = computed(() => {
  const total = filteredRequests.value.length
  if (total === 0) return ''
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, total)
  return `${start}–${end} sur ${total}`
})

// Retour page 1 quand les filtres ou le mode changent
watch([filteredRequests, viewMode], () => { currentPage.value = 1 })

// ── Modals ───────────────────────────────────────────────────────────────────

const detailRequest = ref<MatchingRequest | null>(null)
const negotiatingRequest = ref<MatchingRequest | null>(null)
const createTripRequest = ref<MatchingRequest | null>(null)
const negotiatedIds = reactive(new Set<string>())

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
      <p class="text-danger font-medium text-sm">{{ error }}</p>
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
        <div v-for="i in 6" :key="i" class="h-48 bg-surface border border-border rounded-el shadow-card animate-pulse" />
      </div>
    </template>

    <template v-else>
      <!-- Pas de trajet actif -->
      <EmptyStateNoTrip v-if="!hasActiveTrips" />

      <template v-else>
        <!-- Sélecteur de trajet + Filtres (sticky) -->
        <div class="sticky top-0 z-10 bg-surface border-b border-border">
          <TripSelector
            v-model="selectedTripId"
            :trips="activeTrips"
            :total-count="filteredRequests.length"
          />
          <DemandFilters
            v-model:filters="filters"
            v-model:view-mode="viewMode"
            :result-count="filteredRequests.length"
            :available-content-types="availableContentTypes"
          />
        </div>

        <!-- Liste vide après filtrage -->
        <div v-if="filteredRequests.length === 0" class="flex flex-col items-center py-16 text-center text-sm text-text-muted">
          <p>Aucune demande ne correspond à ces filtres.</p>
          <button class="mt-2 underline text-xs" type="button" @click="filters = { ...DEFAULT_FILTER_STATE }">
            Réinitialiser les filtres
          </button>
        </div>

        <template v-else>
          <!-- Vue carte -->
          <div v-if="viewMode === 'card'" class="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <MatchingRequestCard
              v-for="req in paginatedRequests"
              :key="req.id"
              :request="req"
              :is-negotiating="negotiatingRequest?.id === req.id"
              :has-negotiated="negotiatedIds.has(req.id)"
              :is-favorite="isFavoriteRequest(req.id)"
              @negotiate="openNegotiateModal"
              @view-detail="detailRequest = $event"
              @toggle-favorite="toggleRequest"
            />
          </div>

          <!-- Vue liste : scroll horizontal sur mobile, largeur fixe des colonnes préservée -->
          <div v-else class="overflow-x-auto">
            <div class="min-w-[720px]">
              <div class="flex items-center gap-4 px-4 py-2 border-b border-border bg-surface-el/50">
                <div class="w-8 shrink-0" />
                <SectionLabel as="div" class="w-36 shrink-0">Expéditeur</SectionLabel>
                <SectionLabel as="div" class="w-16 shrink-0">Poids</SectionLabel>
                <SectionLabel as="div" class="w-28 shrink-0">Type</SectionLabel>
                <SectionLabel as="div" class="w-20 shrink-0">Budget</SectionLabel>
                <SectionLabel as="div" class="w-12 shrink-0">Score</SectionLabel>
                <SectionLabel as="div" class="flex-1 hidden md:block">Message</SectionLabel>
                <div class="shrink-0 w-20" />
              </div>
              <MatchingRequestRow
                v-for="req in paginatedRequests"
                :key="req.id"
                :request="req"
                :is-negotiating="negotiatingRequest?.id === req.id"
                :has-negotiated="negotiatedIds.has(req.id)"
                @negotiate="openNegotiateModal"
                @view-detail="detailRequest = $event"
              />
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-border">
            <span class="text-xs text-text-muted font-mono tabular-nums">{{ paginationLabel }}</span>
            <div class="flex items-center gap-1">
              <button
                :disabled="currentPage === 1"
                class="p-1.5 rounded-btn border border-border text-text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                type="button"
                aria-label="Page précédente"
                @click="currentPage--"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>

              <span class="px-3 text-xs text-text font-medium font-mono tabular-nums">{{ currentPage }} / {{ totalPages }}</span>

              <button
                :disabled="currentPage === totalPages"
                class="p-1.5 rounded-btn border border-border text-text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                type="button"
                aria-label="Page suivante"
                @click="currentPage++"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>
      </template>
    </template>

    <!-- Modal détail demande -->
    <RequestDetailModal
      :request="detailRequest"
      @close="detailRequest = null"
      @negotiate="openNegotiateModal"
    />

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
