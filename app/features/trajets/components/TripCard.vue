<script setup lang="ts">
import { computed } from 'vue'
import { Plane, Car, Bus, Bike, Footprints, Clock, Euro, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Trip, TransportMode } from '@/features/trajets/types/index'

const props = defineProps<Trip>()
const emit = defineEmits<{
  'voir-bids': [id: string]
  'modifier': [id: string]
}>()

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
  AVION: Plane,
  VOITURE: Car,
  BUS: Bus,
  VELO: Bike,
  A_PIED: Footprints,
}

const modeIcon = computed(() => transportIcon[props.transportMode])

const formattedDate = computed(() => {
  const d = new Date(props.departureDate)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
})

const statusLabel: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'À venir',
  ACTIVE: 'Actif',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
}

const statusBadgeClass: Record<string, string> = {
  DRAFT: 'bg-[#A8A294]/20 text-[#A8A294]',
  PUBLISHED: 'bg-[#0B5FFF]/20 text-[#0B5FFF]',
  ACTIVE: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-[#A8A294]/20 text-[#A8A294]',
  ARCHIVED: 'bg-[#1E2A4A] text-[#A8A294]',
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
      <button
        data-test="btn-voir-bids"
        class="flex-1 h-8 text-xs font-medium rounded-btn border border-border text-text-muted hover:text-text hover:border-primary/50 transition-colors"
        @click="emit('voir-bids', id)"
      >
        Voir bids
      </button>
      <button
        data-test="btn-modifier"
        class="flex-1 h-8 text-xs font-medium rounded-btn border border-border text-text-muted hover:text-text hover:border-primary/50 transition-colors"
        @click="emit('modifier', id)"
      >
        Modifier
      </button>
      <NuxtLink
        :to="`/trajets/${id}`"
        class="flex items-center gap-1 h-8 px-3 text-xs font-medium rounded-btn bg-primary text-white hover:bg-primary-hover transition-colors"
      >
        Gérer <ChevronRight class="w-3.5 h-3.5" />
      </NuxtLink>
    </div>
  </div>
</template>
