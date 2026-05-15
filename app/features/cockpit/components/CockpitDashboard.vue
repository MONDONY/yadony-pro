<!-- app/features/cockpit/components/CockpitDashboard.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import KpiCard from '@/features/cockpit/components/KpiCard.vue'
import UrgentActionItem from '@/features/cockpit/components/UrgentActionItem.vue'
import TripCard from '@/features/trajets/components/TripCard.vue'
import { useCockpit } from '@/features/cockpit/composables/useCockpit'
import { useTrips } from '@/features/trajets/composables/useTrips'
import { useRouter } from 'vue-router'

const router = useRouter()
const { kpis, urgentActions, isLoading, error, fetchAll } = useCockpit()
const { trips, fetchTrips } = useTrips()

onMounted(async () => {
  await Promise.all([fetchAll(), fetchTrips()])
})

const activeTrips = computed(() => trips.value.filter((t) => t.status === 'ACTIVE').slice(0, 3))

function onVoirBids(id: string) {
  router.push(`/trajets/${id}?tab=bids`)
}

function onModifier(id: string) {
  router.push(`/trajets/${id}/modifier`)
}
</script>

<template>
  <div class="space-y-8">

    <!-- Error -->
    <div v-if="error" class="flex flex-col items-center justify-center py-16 text-center">
      <p class="text-red-500 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
        @click="fetchAll()"
      >
        Réessayer
      </button>
    </div>

    <template v-else>

      <!-- KPIs grid -->
      <section>
        <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Vue d'ensemble</h2>
        <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div
            v-for="i in 5"
            :key="i"
            class="bg-surface border border-border rounded-card p-5 h-28 animate-pulse"
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
          <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wider">Trajets actifs</h2>
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
        <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Actions urgentes</h2>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 bg-surface border border-border rounded-card animate-pulse" />
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
          <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wider">Demandes compatibles</h2>
          <NuxtLink to="/demandes" class="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors">
            Voir toutes les demandes <ArrowRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-surface border border-dashed border-border rounded-card p-5 flex items-center justify-center min-h-[80px]">
            <span class="text-sm text-text-muted">Aperçu des demandes à venir…</span>
          </div>
          <div class="bg-surface border border-dashed border-border rounded-card p-5 flex items-center justify-center min-h-[80px]">
            <span class="text-sm text-text-muted">Aperçu des demandes à venir…</span>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>
