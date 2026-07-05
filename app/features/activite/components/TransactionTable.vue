<!-- app/features/activite/components/TransactionTable.vue -->
<script setup lang="ts">
import { DataTable } from '@/components/ui/data-table'
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
  <DataTable>
    <thead>
      <tr>
        <th>Trajet</th>
        <th>Date</th>
        <th class="num">Colis</th>
        <th class="num">Brut</th>
        <th class="num">Commission</th>
        <th class="num">Net</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in transactions"
        :key="row.tripId"
        :data-test="`transaction-row-${row.tripId}`"
      >
        <td class="font-medium text-text">{{ row.corridor }}</td>
        <td class="font-mono tabular-nums text-text-muted">{{ formatDate(row.departureDate) }}</td>
        <td class="num">{{ row.parcelCount }}</td>
        <td class="num">{{ formatEuros(row.grossRevenue) }}</td>
        <td class="num text-danger">-{{ formatEuros(row.commission) }}</td>
        <td class="num font-semibold text-success">{{ formatEuros(row.netRevenue) }}</td>
      </tr>
      <tr v-if="transactions.length === 0">
        <td colspan="6" class="py-8 text-center text-sm text-text-muted">
          Aucune transaction sur cette période.
        </td>
      </tr>
    </tbody>
  </DataTable>
</template>
