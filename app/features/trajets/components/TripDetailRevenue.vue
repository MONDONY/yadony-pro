<!-- app/features/trajets/components/TripDetailRevenue.vue -->
<script setup lang="ts">
import { TrendingUp, Percent, Euro, Weight } from 'lucide-vue-next'
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
      <div class="bg-surface border border-border rounded-card p-5 space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-btn bg-primary/20 flex items-center justify-center">
            <Percent class="w-4 h-4 text-primary" />
          </div>
          <span class="text-xs text-text-muted font-medium">Remplissage</span>
        </div>
        <div>
          <p class="text-3xl font-bold text-text">{{ kpis.fillRatePct }}%</p>
          <div class="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-all"
              :style="{ width: kpis.fillRatePct + '%' }"
            />
          </div>
          <p class="text-xs text-text-muted mt-1">{{ trip.usedWeightKg }} / {{ trip.availableWeightKg }} kg</p>
        </div>
      </div>

      <!-- Revenu brut -->
      <div class="bg-surface border border-border rounded-card p-5 space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-btn bg-accent/20 flex items-center justify-center">
            <Euro class="w-4 h-4 text-accent" />
          </div>
          <span class="text-xs text-text-muted font-medium">Revenu brut</span>
        </div>
        <div>
          <p class="text-3xl font-bold text-text">{{ kpis.grossRevenueEuros.toFixed(2) }} €</p>
          <p class="text-xs text-text-muted mt-1">Colis confirmés</p>
        </div>
      </div>

      <!-- Revenu net -->
      <div class="bg-surface border border-border rounded-card p-5 space-y-3 col-span-2 lg:col-span-1">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-btn bg-green-500/20 flex items-center justify-center">
            <TrendingUp class="w-4 h-4 text-green-400" />
          </div>
          <span class="text-xs text-text-muted font-medium">Revenu net</span>
        </div>
        <div>
          <p class="text-3xl font-bold text-green-400">{{ kpis.netRevenueEuros.toFixed(2) }} €</p>
          <p class="text-xs text-text-muted mt-1">Après commission 12%</p>
        </div>
      </div>

      <!-- Revenu par kg -->
      <div class="bg-surface border border-border rounded-card p-5 space-y-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-btn bg-primary/20 flex items-center justify-center">
            <Weight class="w-4 h-4 text-primary" />
          </div>
          <span class="text-xs text-text-muted font-medium">Revenu / kg</span>
        </div>
        <div>
          <p class="text-3xl font-bold text-text">{{ kpis.revenuePerKg.toFixed(2) }} €</p>
          <p class="text-xs text-text-muted mt-1">Net par kilogramme</p>
        </div>
      </div>

    </div>

    <!-- Commission breakdown -->
    <div class="bg-surface border border-border rounded-card p-5">
      <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Détail de la commission</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-muted">Revenu brut (expéditeurs)</span>
          <span class="text-sm font-medium text-text">{{ kpis.grossRevenueEuros.toFixed(2) }} €</span>
        </div>
        <div class="flex items-center justify-between text-red-400">
          <span class="text-sm">Commission Dony (12%)</span>
          <span class="text-sm font-medium">− {{ kpis.commissionEuros.toFixed(2) }} €</span>
        </div>
        <div class="border-t border-border pt-3 flex items-center justify-between">
          <span class="text-sm font-semibold text-text">Vos revenus nets</span>
          <span class="text-sm font-bold text-green-400">{{ kpis.netRevenueEuros.toFixed(2) }} €</span>
        </div>
      </div>
      <p class="text-xs text-text-muted mt-4">
        Estimations basées sur les colis acceptés, remis ou en transit. Les colis livrés déclenchent le virement.
      </p>
    </div>

  </div>
</template>
