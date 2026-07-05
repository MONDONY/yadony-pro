<!-- app/features/cockpit/components/CockpitDashboard.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { SectionLabel } from '@/components/ui/section-label'
import KpiCard from '@/features/cockpit/components/KpiCard.vue'
import UrgentActionItem from '@/features/cockpit/components/UrgentActionItem.vue'
import TripCard from '@/features/trajets/components/TripCard.vue'
import MatchingRequestCard from '@/features/demandes/components/MatchingRequestCard.vue'
import { useCockpit } from '@/features/cockpit/composables/useCockpit'
import { useTrips } from '@/features/trajets/composables/useTrips'
import { useMatchingRequests } from '@/features/demandes/composables/useMatchingRequests'
import { useRouter } from 'vue-router'

const router = useRouter()
const { kpis, urgentActions, isLoading, error, fetchAll } = useCockpit()
const { trips, fetchTrips } = useTrips()
const { requests, fetchRequests } = useMatchingRequests()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchTrips(), fetchRequests()])
})

const activeTrips = computed(() => trips.value.filter((t) => t.status === 'ACTIVE').slice(0, 3))
const previewRequests = computed(() => requests.value.slice(0, 2))

function onVoirBids(id: string) {
  router.push(`/trajets/${id}?tab=bids`)
}

function onModifier(id: string) {
  router.push(`/trajets/${id}/modifier`)
}
</script>

<template>
  <div class="space-y-10">

    <!-- Error -->
    <div v-if="error" class="flex flex-col items-center justify-center py-16 text-center">
      <p class="font-medium text-danger">{{ error }}</p>
      <button
        class="mt-4 rounded-btn border border-border-strong px-4 py-2 text-sm text-text transition-colors hover:bg-surface-el"
        @click="fetchAll()"
      >
        Réessayer
      </button>
    </div>

    <template v-else>

      <!-- KPIs grid -->
      <section>
        <SectionLabel as="h2" class="mb-4">Vue d'ensemble</SectionLabel>
        <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div
            v-for="i in 5"
            :key="i"
            class="h-28 rounded-el border border-border bg-surface p-[18px] shadow-card animate-pulse"
          >
            <div class="h-3 bg-border rounded w-2/3 mb-3" />
            <div class="h-6 bg-border rounded w-1/2" />
          </div>
        </div>
        <div v-else class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard
            v-for="kpi in kpis"
            :key="kpi.id"
            v-bind="kpi"
          />
        </div>
      </section>

      <!-- Active trips -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <SectionLabel as="h2">Trajets actifs</SectionLabel>
          <NuxtLink to="/trajets" class="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors">
            Voir tous <ArrowRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
        <div v-if="activeTrips.length === 0 && !isLoading" class="text-sm text-text-muted py-4">
          Aucun trajet actif en ce moment.
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <TripCard
            v-for="trip in activeTrips"
            :key="trip.id"
            v-bind="trip"
            @voir-bids="onVoirBids"
            @modifier="onModifier"
          />
        </div>
      </section>

      <!-- Urgent actions -->
      <section>
        <SectionLabel as="h2" class="mb-4">Actions urgentes</SectionLabel>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 rounded-el border border-border bg-surface shadow-card animate-pulse" />
        </div>
        <div v-else class="space-y-3">
          <UrgentActionItem
            v-for="action in urgentActions"
            :key="action.id"
            :action="action"
          />
        </div>
      </section>

      <!-- Compatible requests preview -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <SectionLabel as="h2">Demandes compatibles</SectionLabel>
          <NuxtLink to="/demandes" class="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors">
            Voir toutes les demandes <ArrowRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
        <div v-if="previewRequests.length === 0 && !isLoading" class="text-sm text-text-muted py-4">
          Aucune demande compatible pour le moment.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MatchingRequestCard
            v-for="request in previewRequests"
            :key="request.id"
            :request="request"
            :is-negotiating="false"
            :has-negotiated="false"
            @negotiate="router.push('/demandes')"
          />
        </div>
      </section>

    </template>
  </div>
</template>
