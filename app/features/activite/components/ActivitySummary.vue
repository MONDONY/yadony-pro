<!-- app/features/activite/components/ActivitySummary.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { SectionLabel } from '@/components/ui/section-label'
import { formatMoney } from '@/lib/money'
import { useTripsSummary } from '@/features/activite/composables/useTripsSummary'
import ActivityKpiCard from '@/features/activite/components/ActivityKpiCard.vue'
import type { RevenueRail, SummaryPeriod } from '@/features/activite/types/index'

const { period, summary, revenues, kgSold, isLoading, error, fetchAll, setPeriod } = useTripsSummary()

onMounted(fetchAll)

const periodOptions: Array<{ value: SummaryPeriod; label: string }> = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '12m', label: '12 mois' },
]

const railLabel: Record<RevenueRail, string> = {
  CARD: 'Carte',
  MOBILE_MONEY: 'Mobile money',
  CASH: 'Espèces',
}

const kgFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const formatKg = (kg: number) => `${kgFormatter.format(kg)} kg`
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
</script>

<template>
  <section class="space-y-4" data-test="activity-summary">
    <div class="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <SectionLabel as="h2">Résumé d'activité</SectionLabel>
        <p class="text-xs text-text-muted mt-1">Livraisons réalisées, dans la devise de chaque paiement.</p>
      </div>
      <div class="flex items-center gap-1 bg-surface border border-border rounded-btn p-1">
        <button
          v-for="opt in periodOptions"
          :key="opt.value"
          :data-test="`summary-period-${opt.value}`"
          type="button"
          :class="[
            'px-3 h-7 rounded text-sm font-medium transition-colors',
            period === opt.value ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text',
          ]"
          @click="setPeriod(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div v-if="error && !isLoading" class="flex items-center gap-3 text-sm" data-test="summary-error">
      <span class="text-danger">{{ error }}</span>
      <button type="button" class="underline text-text-muted hover:text-text" @click="fetchAll()">Réessayer</button>
    </div>

    <div v-else-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="i in 4" :key="i" class="h-28 rounded-el border border-border bg-surface shadow-card animate-pulse" />
    </div>

    <template v-else>
      <div v-if="summary" class="grid grid-cols-2 lg:grid-cols-4 gap-3" data-test="summary-kpis">
        <ActivityKpiCard id="summary-active" label="Trajets actifs" :value="String(summary.activeTrips)" />
        <ActivityKpiCard
          id="summary-revenue"
          :label="summary.revenueConverted ? 'Revenus (estimation)' : 'Revenus'"
          :value="formatMoney(summary.revenue, summary.revenueCurrency)"
        />
        <ActivityKpiCard id="summary-kg" label="Kilos vendus" :value="formatKg(summary.kgSold)" />
        <ActivityKpiCard
          id="summary-published"
          label="Trajets publiés"
          :value="String(summary.tripsPublished)"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <!-- Revenus par devise -->
        <div class="rounded-el border border-border bg-surface p-5 shadow-card" data-test="summary-revenues">
          <SectionLabel as="h3">Revenus par devise</SectionLabel>
          <p v-if="!revenues || revenues.groups.length === 0" class="mt-3 text-sm text-text-muted" data-test="summary-revenues-empty">
            Aucune livraison sur cette période.
          </p>
          <div v-else class="mt-3 space-y-5">
            <div v-for="group in revenues.groups" :key="group.currency" :data-test="`revenue-group-${group.currency}`">
              <div class="flex items-baseline justify-between">
                <span class="text-sm font-medium text-text">
                  {{ group.currency }} · {{ group.deliveries }} livraison{{ group.deliveries > 1 ? 's' : '' }}
                </span>
                <span class="font-mono text-base font-semibold tabular-nums text-text">
                  {{ formatMoney(group.total, group.currency) }}
                </span>
              </div>
              <ul class="mt-2 divide-y divide-border text-sm">
                <li v-for="(item, idx) in group.items" :key="`${item.tripId}-${idx}`" class="flex items-center justify-between gap-3 py-1.5">
                  <span class="min-w-0 truncate text-text-muted">
                    <span class="font-mono tabular-nums">{{ formatDate(item.date) }}</span>
                    · {{ item.departureCity }} → {{ item.arrivalCity }}
                    · {{ railLabel[item.rail] }}
                  </span>
                  <span class="font-mono tabular-nums text-text">{{ formatMoney(item.amount, group.currency) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Kilos vendus par trajet -->
        <div class="rounded-el border border-border bg-surface p-5 shadow-card" data-test="summary-kg-sold">
          <SectionLabel as="h3">Kilos livrés par trajet</SectionLabel>
          <p v-if="!kgSold || kgSold.trips.length === 0" class="mt-3 text-sm text-text-muted" data-test="summary-kg-empty">
            Aucun kilo livré sur cette période.
          </p>
          <div v-else class="mt-3">
            <p class="text-sm text-text-muted">
              <span class="font-mono font-semibold tabular-nums text-text">{{ formatKg(kgSold.totalKg) }}</span>
              · {{ kgSold.parcels }} colis
            </p>
            <ul class="mt-2 divide-y divide-border text-sm">
              <li v-for="trip in kgSold.trips" :key="trip.tripId" class="flex items-center justify-between gap-3 py-1.5">
                <NuxtLink :to="`/trajets/${trip.tripId}`" class="min-w-0 truncate text-text-muted hover:text-text">
                  <span class="font-mono tabular-nums">{{ formatDate(trip.date) }}</span>
                  · {{ trip.departureCity }} → {{ trip.arrivalCity }}
                </NuxtLink>
                <span class="shrink-0 font-mono tabular-nums text-text">
                  {{ formatKg(trip.kg) }} · {{ trip.parcels }} colis
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
