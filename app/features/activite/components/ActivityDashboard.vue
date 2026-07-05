<!-- app/features/activite/components/ActivityDashboard.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { SectionLabel } from '@/components/ui/section-label'
import { useActivity } from '@/features/activite/composables/useActivity'
import ActivityKpiCard from '@/features/activite/components/ActivityKpiCard.vue'
import TransactionTable from '@/features/activite/components/TransactionTable.vue'
import FiscalExportPanel from '@/features/activite/components/FiscalExportPanel.vue'
import type { ActivityPeriod, FiscalExportFormat, FiscalExportType } from '@/features/activite/types/index'

const { analytics, isLoading, error, period, isExporting, fetchAnalytics, setPeriod, exportFiscal } =
  useActivity()

onMounted(() => {
  fetchAnalytics()
})

const periodOptions: Array<{ value: ActivityPeriod; label: string }> = [
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: '3 mois' },
  { value: 'year', label: 'Cette année' },
]

function handleExport(format: FiscalExportFormat, type: FiscalExportType): void {
  exportFiscal(format, type)
}
</script>

<template>
  <div class="space-y-8">

    <!-- Period selector -->
    <div class="flex items-center gap-2 flex-wrap">
      <SectionLabel as="span" class="mr-2">Période :</SectionLabel>
      <div class="flex items-center gap-1 bg-surface border border-border rounded-btn p-1">
        <button
          v-for="opt in periodOptions"
          :key="opt.value"
          :data-test="`period-btn-${opt.value}`"
          :class="[
            'px-3 h-7 rounded text-sm font-medium transition-colors',
            period === opt.value ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text',
          ]"
          type="button"
          @click="setPeriod(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error && !isLoading"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <p class="font-medium text-danger">{{ error }}</p>
      <button
        class="mt-4 rounded-btn border border-border-strong px-4 py-2 text-sm text-text transition-colors hover:bg-surface-el"
        type="button"
        @click="fetchAnalytics()"
      >
        Réessayer
      </button>
    </div>

    <template v-else>

      <!-- KPIs -->
      <section>
        <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div
            v-for="i in 5"
            :key="i"
            class="h-28 rounded-el border border-border bg-surface p-[18px] shadow-card animate-pulse"
          />
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <ActivityKpiCard
            v-for="kpi in analytics?.kpis ?? []"
            :key="kpi.id"
            v-bind="kpi"
          />
        </div>
      </section>

      <!-- Transactions -->
      <section>
        <div class="mb-4">
          <SectionLabel as="h2">Détail transactions</SectionLabel>
          <p class="text-xs text-text-muted mt-1">Tous les trajets de la période avec ventilation revenus.</p>
        </div>
        <div v-if="isLoading" class="h-48 rounded-el border border-border bg-surface shadow-card animate-pulse" />
        <div v-else class="rounded-el border border-border bg-surface p-5 shadow-card">
          <TransactionTable :transactions="analytics?.transactions ?? []" />
        </div>
      </section>

      <!-- Export fiscal -->
      <section>
        <div class="mb-4">
          <SectionLabel as="h2">Export fiscal</SectionLabel>
          <p class="text-xs text-text-muted mt-1">
            Téléchargez vos justificatifs pour {{ new Date().getFullYear() }}.
          </p>
        </div>
        <FiscalExportPanel
          :is-exporting="isExporting"
          @export="handleExport"
        />
      </section>

    </template>
  </div>
</template>
