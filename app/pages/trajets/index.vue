<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { List, CalendarDays, Plus } from 'lucide-vue-next'
import { useTrips } from '@/features/trajets/composables/useTrips'
import TripCard from '@/features/trajets/components/TripCard.vue'
import TripListFilters from '@/features/trajets/components/TripListFilters.vue'
import TripCalendar from '@/features/trajets/components/TripCalendar.vue'
import PaginationControls from '@/components/ui/PaginationControls.vue'
import type { TripFilter } from '@/features/trajets/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Mes Trajets',
  pageSubtitle: 'Liste, calendrier et publication',
})

const route = useRoute()
const VALID_FILTERS: TripFilter[] = ['TOUS', 'ACTIFS', 'COMPLETS', 'EN_COURS', 'TERMINES', 'ANNULES', 'BROUILLONS']
const initialFilter = VALID_FILTERS.includes(route.query.filter as TripFilter)
  ? (route.query.filter as TripFilter)
  : undefined

const {
  trips,
  activeFilter,
  viewMode,
  search,
  dateMode,
  date,
  dateFrom,
  dateTo,
  corridor,
  corridors,
  isLoading,
  error,
  totalElements,
  totalPages,
  currentPage,
  pageSize,
  fetchTrips,
  fetchCorridors,
  goToPage,
  setFilter,
  setSearch,
  setDateMode,
  setDate,
  setDateFrom,
  setDateTo,
  setCorridor,
  toggleView,
} = useTrips(initialFilter)

onMounted(async () => {
  await Promise.all([fetchTrips(), fetchCorridors()])
})
</script>

<template>
  <div class="space-y-6">

    <div class="flex items-center gap-3 flex-wrap">
      <TripListFilters
        :model-value="activeFilter"
        :search="search"
        :date-mode="dateMode"
        :date="date"
        :date-from="dateFrom"
        :date-to="dateTo"
        :corridor="corridor"
        :corridors="corridors"
        @update:model-value="setFilter"
        @update:search="setSearch"
        @update:date-mode="setDateMode"
        @update:date="setDate"
        @update:date-from="setDateFrom"
        @update:date-to="setDateTo"
        @update:corridor="setCorridor"
      />
      <div class="ml-auto flex items-center gap-2">
        <div class="flex items-center gap-1 bg-surface border border-border rounded-btn p-1">
          <button
            :class="['p-1.5 rounded transition-colors', viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text']"
            aria-label="Vue liste"
            @click="viewMode === 'calendar' && toggleView()"
          >
            <List class="w-4 h-4" />
          </button>
          <button
            :class="['p-1.5 rounded transition-colors', viewMode === 'calendar' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text']"
            aria-label="Vue calendrier"
            @click="viewMode === 'list' && toggleView()"
          >
            <CalendarDays class="w-4 h-4" />
          </button>
        </div>

        <NuxtLink
          to="/trajets/nouvelle-annonce"
          class="flex items-center gap-2 h-9 px-4 rounded-btn bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors"
          data-test="btn-nouvelle-annonce"
        >
          <Plus class="w-4 h-4" />
          Nouvelle annonce
        </NuxtLink>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-surface border border-border rounded-card p-5 h-64 animate-pulse"
      >
        <div class="h-4 bg-border rounded w-2/3 mb-3" />
        <div class="h-3 bg-border rounded w-1/3 mb-6" />
        <div class="h-2 bg-border rounded w-full mb-4" />
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="h-12 bg-border rounded" />
          <div class="h-12 bg-border rounded" />
          <div class="h-12 bg-border rounded" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 text-center">
      <p class="text-red-500 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
        @click="fetchTrips()"
      >
        Réessayer
      </button>
    </div>

    <!-- Calendar view -->
    <TripCalendar v-else-if="viewMode === 'calendar'" :trips="trips" />

    <!-- Empty state -->
    <div
      v-else-if="trips.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-card"
    >
      <p class="text-text-muted text-sm">Aucun trajet trouvé pour ce filtre.</p>
      <NuxtLink
        to="/trajets/nouvelle-annonce"
        class="mt-4 flex items-center gap-2 h-9 px-4 rounded-btn bg-primary text-on-primary text-sm font-medium"
      >
        <Plus class="w-4 h-4" />
        Créer un trajet
      </NuxtLink>
    </div>

    <!-- List view -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <TripCard
        v-for="trip in trips"
        :key="trip.id"
        v-bind="trip"
      />
    </div>

    <!-- Pagination -->
    <PaginationControls
      v-if="!isLoading && !error && totalPages > 1 && viewMode === 'list'"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-elements="totalElements"
      :page-size="pageSize"
      @go-to-page="goToPage"
    />

  </div>
</template>
