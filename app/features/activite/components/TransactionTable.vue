<!-- app/features/activite/components/TransactionTable.vue -->
<script setup lang="ts">
import type { TransactionRow } from '@/features/activite/types/index'

defineProps<{
  transactions: TransactionRow[]
}>()

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-border text-left">
          <th class="pb-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Trajet</th>
          <th class="pb-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
          <th class="pb-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Colis</th>
          <th class="pb-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Brut</th>
          <th class="pb-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Commission</th>
          <th class="pb-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Net</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in transactions"
          :key="row.tripId"
          :data-test="`transaction-row-${row.tripId}`"
          class="border-b border-border last:border-0 hover:bg-surface transition-colors"
        >
          <td class="py-3 pr-4 font-medium text-text">{{ row.corridor }}</td>
          <td class="py-3 pr-4 text-text-muted">{{ formatDate(row.departureDate) }}</td>
          <td class="py-3 pr-4 text-right text-text">{{ row.parcelCount }}</td>
          <td class="py-3 pr-4 text-right text-text">{{ formatEuros(row.grossRevenue) }}</td>
          <td class="py-3 pr-4 text-right text-red-400">-{{ formatEuros(row.commission) }}</td>
          <td class="py-3 text-right font-semibold text-green-400">{{ formatEuros(row.netRevenue) }}</td>
        </tr>
        <tr v-if="transactions.length === 0">
          <td colspan="6" class="py-8 text-center text-sm text-text-muted">
            Aucune transaction sur cette période.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
