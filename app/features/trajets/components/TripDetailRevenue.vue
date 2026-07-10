<!-- app/features/trajets/components/TripDetailRevenue.vue -->
<script setup lang="ts">
import { TrendingUp, Percent, Euro, Weight } from 'lucide-vue-next'
import { SectionLabel } from '@/components/ui/section-label'
import type { Trip, TripKpis } from '@/features/trajets/types/index'

defineProps<{
  trip: Trip
  kpis: TripKpis
}>()
</script>

<template>
  <div class="space-y-5">

    <!-- KPI cards grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

      <!-- Taux de remplissage -->
      <div class="rounded-el border border-border bg-surface p-5 shadow-card space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-el bg-primary/10 flex items-center justify-center">
            <Percent class="w-4 h-4 text-primary" />
          </div>
          <span class="text-xs text-text-muted font-medium">Remplissage</span>
        </div>
        <div>
          <p class="font-mono text-3xl font-semibold tabular-nums text-text">{{ kpis.fillRatePct }}%</p>
          <div class="mt-2 h-1.5 bg-surface-el rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-all"
              :style="{ width: kpis.fillRatePct + '%' }"
            />
          </div>
          <p class="font-mono tabular-nums text-xs text-text-muted mt-1">{{ trip.usedWeightKg }} / {{ trip.availableWeightKg }} kg</p>
        </div>
      </div>

      <!-- Revenu brut -->
      <div class="rounded-el border border-border bg-surface p-5 shadow-card space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-el bg-primary/10 flex items-center justify-center">
            <Euro class="w-4 h-4 text-primary" />
          </div>
          <span class="text-xs text-text-muted font-medium">Revenu brut</span>
        </div>
        <div>
          <p class="font-mono text-3xl font-semibold tabular-nums text-text">{{ kpis.grossRevenueEuros.toFixed(2) }} €</p>
          <p class="text-xs text-text-muted mt-1">Colis confirmés</p>
        </div>
      </div>

      <!-- Revenu net -->
      <div class="rounded-el border border-border bg-surface p-5 shadow-card space-y-3 col-span-2 lg:col-span-1">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-el bg-success/10 flex items-center justify-center">
            <TrendingUp class="w-4 h-4 text-success" />
          </div>
          <span class="text-xs text-text-muted font-medium">Revenu net</span>
        </div>
        <div>
          <p class="font-mono text-3xl font-semibold tabular-nums text-success">{{ kpis.netRevenueEuros.toFixed(2) }} €</p>
          <p class="text-xs text-text-muted mt-1">Après commission 12%</p>
        </div>
      </div>

      <!-- Revenu par kg -->
      <div class="rounded-el border border-border bg-surface p-5 shadow-card space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-el bg-primary/10 flex items-center justify-center">
            <Weight class="w-4 h-4 text-primary" />
          </div>
          <span class="text-xs text-text-muted font-medium">Revenu / kg</span>
        </div>
        <div>
          <p class="font-mono text-3xl font-semibold tabular-nums text-text">{{ kpis.revenuePerKg.toFixed(2) }} €</p>
          <p class="text-xs text-text-muted mt-1">Net par kilogramme</p>
        </div>
      </div>

    </div>

    <!-- Commission breakdown -->
    <div class="rounded-el border border-border bg-surface p-5 shadow-card">
      <SectionLabel as="h3" class="mb-4">Détail de la commission</SectionLabel>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-muted">Revenu brut (expéditeurs)</span>
          <span class="font-mono tabular-nums text-sm font-medium text-text">{{ kpis.grossRevenueEuros.toFixed(2) }} €</span>
        </div>
        <div class="flex items-center justify-between text-danger">
          <span class="text-sm">Commission Dony (12%)</span>
          <span class="font-mono tabular-nums text-sm font-medium">− {{ kpis.commissionEuros.toFixed(2) }} €</span>
        </div>
        <div class="border-t border-border pt-3 flex items-center justify-between">
          <span class="text-sm font-semibold text-text">Vos revenus nets</span>
          <span class="font-mono tabular-nums text-sm font-semibold text-success">{{ kpis.netRevenueEuros.toFixed(2) }} €</span>
        </div>
      </div>
      <p class="text-xs text-text-muted mt-4">
        Estimations basées sur les colis acceptés, remis ou en transit. Les colis livrés déclenchent le virement.
      </p>
    </div>

  </div>
</template>
