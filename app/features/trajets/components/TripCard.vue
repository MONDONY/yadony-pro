<script setup lang="ts">
import { computed } from 'vue'
import { Plane, Car, Bus, Bike, Footprints, Clock, Euro, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Trip, TransportMode } from '@/features/trajets/types/index'

const props = defineProps<Trip>()

const fillPct = computed(() => {
  if (props.availableWeightKg === 0) return 0
  return Math.round((props.usedWeightKg / props.availableWeightKg) * 100)
})

const barColorClass = computed(() => {
  if (fillPct.value >= 70) return 'bg-green-500'
  if (fillPct.value >= 30) return 'bg-amber-500'
  return 'bg-red-500'
})

const transportIcon: Record<TransportMode, typeof Plane> = {
  PLANE: Plane,
  CAR: Car,
  TRAIN: Plane,
  BUS: Bus,
  BOAT: Footprints,
  OTHER: Footprints,
}

const modeIcon = computed(() => transportIcon[props.transportMode])

const formattedDate = computed(() => {
  const d = new Date(props.departureDate)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
})

const statusLabel: Record<string, string> = {
  ACTIVE: 'Actif',
  FULL: 'Complet',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

const statusBadgeClass: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  FULL: 'bg-[#0B5FFF]/20 text-[#0B5FFF]',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400',
  COMPLETED: 'bg-[#A8A294]/20 text-[#A8A294]',
  CANCELLED: 'bg-[#1E2A4A] text-[#A8A294]',
}
</script>

<template>
  <div class="bg-surface border border-border rounded-card p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors">
    <!-- Header: corridor + status badge -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <component :is="modeIcon" class="w-4 h-4 text-primary shrink-0" />
        <h3 class="font-bold text-text truncate">
          {{ departureCity.label }}
          <span class="text-text-muted mx-1">→</span>
          {{ arrivalCity.label }}
        </h3>
      </div>
      <span :class="cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', statusBadgeClass[status])">
        {{ statusLabel[status] }}
      </span>
    </div>

    <!-- Date + price -->
    <div class="flex items-center gap-4 text-sm text-text-muted">
      <span class="flex items-center gap-1">
        <Clock class="w-3.5 h-3.5" />
        {{ formattedDate }}
        <template v-if="departureTime"> · {{ departureTime }}</template>
      </span>
      <span class="flex items-center gap-1 text-text font-medium">
        <Euro class="w-3.5 h-3.5 text-accent" />
        {{ pricePerKg }}/kg
      </span>
    </div>

    <!-- Capacity bar -->
    <div class="space-y-1.5">
      <div class="flex justify-between text-xs text-text-muted">
        <span>Capacité utilisée</span>
        <span class="text-text">{{ usedWeightKg }} / {{ availableWeightKg }} kg</span>
      </div>
      <div class="h-1.5 w-full bg-border rounded-full overflow-hidden">
        <div
          data-test="capacity-bar"
          :class="cn('h-full rounded-full transition-all', barColorClass)"
          :style="{ width: fillPct + '%' }"
        />
      </div>
      <span
        v-if="capacityUnit && capacityUnit !== 'KG_FREE'"
        class="inline-flex items-center gap-1 text-xs text-text-muted"
      >
        {{ capacityUnit === 'SUITCASE_23KG' ? '1 valise 23 kg' : '1 valise 32 kg' }}
      </span>
    </div>

    <!-- Counters -->
    <div class="grid grid-cols-3 gap-2">
      <div class="bg-bg rounded-btn px-3 py-2 text-center">
        <p class="text-base font-bold text-text">{{ confirmedParcelCount }}</p>
        <p class="text-xs text-text-muted">Colis confirmés</p>
      </div>
      <div class="bg-bg rounded-btn px-3 py-2 text-center">
        <p class="text-base font-bold text-text">{{ pendingBidCount }}</p>
        <p class="text-xs text-text-muted">Bids en attente</p>
      </div>
      <div class="bg-bg rounded-btn px-3 py-2 text-center">
        <p class="text-base font-bold text-accent">{{ reservedRevenueEuros }}€</p>
        <p class="text-xs text-text-muted">Revenus réservés</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 pt-1">
      <NuxtLink
        :to="`/trajets/${id}?tab=bids`"
        data-test="btn-voir-bids"
        class="flex-1 h-8 text-xs font-medium rounded-btn border border-border text-text-muted hover:text-text hover:border-primary/50 transition-colors flex items-center justify-center"
      >
        Voir bids
      </NuxtLink>
      <NuxtLink
        :to="`/trajets/${id}/modifier`"
        data-test="btn-modifier"
        class="flex-1 h-8 text-xs font-medium rounded-btn border border-border text-text-muted hover:text-text hover:border-primary/50 transition-colors flex items-center justify-center"
      >
        Modifier
      </NuxtLink>
      <NuxtLink
        :to="`/trajets/${id}`"
        class="flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-btn bg-primary text-white hover:bg-primary-hover transition-colors"
      >
        Gérer <ChevronRight class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>
  </div>
</template>
