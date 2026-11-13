<script setup lang="ts">
import { computed } from 'vue'
import { Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import type { Trip } from '@/features/trajets/types/index'
import { formatMoney } from '@/lib/money'
import { transportModeIcon } from '@/lib/transportModes'
import { capacityView, isVolumeTrip, priceLabel } from '@/features/trajets/lib/tripCapacity'

const props = defineProps<Trip>()

const capacity = computed(() => capacityView(props))
const fillPct = computed(() => capacity.value.pct)
const volumeTrip = computed(() => isVolumeTrip(props))

const barColorClass = computed(() => {
  if (fillPct.value >= 70) return 'bg-success'
  if (fillPct.value >= 30) return 'bg-warning'
  return 'bg-danger'
})

const modeIcon = computed(() => transportModeIcon(props.transportMode))

const formattedDate = computed(() => {
  const d = new Date(props.departureDate)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
})

const statusLabel: Record<string, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Actif',
  FULL: 'Complet',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
}

const statusVariant: Record<string, BadgeVariants['variant']> = {
  DRAFT: 'warning',
  ACTIVE: 'success',
  FULL: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
}
</script>

<template>
  <div class="flex flex-col gap-4 rounded-el border border-border bg-surface p-5 shadow-card transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-pop motion-reduce:hover:translate-y-0">
    <!-- Header : corridor + statut -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <component :is="modeIcon" class="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <h3 class="truncate font-semibold text-text">
          {{ departureCity.label }}
          <span class="mx-1 text-primary">→</span>
          {{ arrivalCity.label }}
        </h3>
      </div>
      <Badge :variant="statusVariant[status]" size="sm">{{ statusLabel[status] }}</Badge>
    </div>

    <!-- Date + prix -->
    <div class="flex items-center gap-4 text-sm text-text-muted">
      <span class="flex items-center gap-1.5">
        <Clock class="h-3.5 w-3.5" aria-hidden="true" />
        {{ formattedDate }}
        <template v-if="departureTime"> · {{ departureTime }}</template>
      </span>
      <span class="font-medium text-text">
        <span class="font-mono tabular-nums">{{ priceLabel(props) }}</span>
      </span>
    </div>

    <!-- Capacité -->
    <div class="space-y-1.5">
      <div class="flex justify-between text-xs text-text-muted">
        <span>Capacité utilisée</span>
        <span class="font-mono tabular-nums text-text">{{ capacity.label }}</span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-el">
        <div
          data-test="capacity-bar"
          :class="cn('h-full rounded-full transition-all', barColorClass)"
          :style="{ width: fillPct + '%' }"
        />
      </div>
      <span
        v-if="!volumeTrip && capacityUnit && capacityUnit !== 'KG_FREE'"
        class="inline-flex items-center gap-1 text-xs text-text-subtle"
      >
        {{ capacityUnit === 'SUITCASE_23KG' ? '1 valise 23 kg' : '1 valise 32 kg' }}
      </span>
    </div>

    <!-- Compteurs -->
    <div class="grid grid-cols-3 gap-2">
      <div class="rounded-el bg-surface-el px-3 py-2 text-center">
        <p class="font-mono text-base font-semibold tabular-nums text-text">{{ confirmedParcelCount }}</p>
        <p class="mt-0.5 text-xs text-text-subtle">Colis confirmés</p>
      </div>
      <div class="rounded-el bg-surface-el px-3 py-2 text-center">
        <p class="font-mono text-base font-semibold tabular-nums text-text">{{ pendingBidCount }}</p>
        <p class="mt-0.5 text-xs text-text-subtle">Colis en attente</p>
      </div>
      <div class="rounded-el bg-surface-el px-3 py-2 text-center">
        <p class="font-mono text-base font-semibold tabular-nums text-primary">{{ formatMoney(reservedRevenueEuros, currency) }}</p>
        <p class="mt-0.5 text-xs text-text-subtle">Revenus réservés</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 pt-1">
      <NuxtLink
        :to="`/trajets/${id}?tab=bids`"
        data-test="btn-voir-bids"
        class="flex h-9 flex-1 items-center justify-center rounded-btn border border-border-strong text-xs font-medium text-text transition-colors hover:bg-surface-el"
      >
        Voir bids
      </NuxtLink>
      <NuxtLink
        :to="`/trajets/${id}/modifier`"
        data-test="btn-modifier"
        class="flex h-9 flex-1 items-center justify-center rounded-btn border border-border-strong text-xs font-medium text-text transition-colors hover:bg-surface-el"
      >
        Modifier
      </NuxtLink>
      <NuxtLink
        :to="`/trajets/${id}`"
        class="flex h-9 items-center gap-1 rounded-btn bg-primary px-3 text-xs font-medium text-on-primary shadow-btn transition-colors hover:bg-primary-hover"
      >
        Gérer <ChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>
