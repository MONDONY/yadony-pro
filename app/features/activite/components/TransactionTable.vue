<!-- app/features/activite/components/TransactionTable.vue -->
<script setup lang="ts">
import { DataTable } from '@/components/ui/data-table'
import type { TransactionRow } from '@/features/activite/types/index'

defineProps<{
  transactions: TransactionRow[]
}>()

/** Devises sans sous-unité : leurs montants arrivent déjà en unité pleine. */
const ZERO_DECIMAL = new Set(['XOF', 'XAF'])

/**
 * Formate un montant reçu en unités mineures dans la devise de SA ligne —
 * « € » figé affichait 5000 F CFA comme 50,00 €. Repli EUR quand le backend
 * (pas encore déployé) n'envoie pas la devise.
 */
function formatAmount(minor: number, currency?: string): string {
  const code = (currency ?? 'EUR').toUpperCase()
  const divisor = ZERO_DECIMAL.has(code) ? 1 : 100
  try {
    return (minor / divisor).toLocaleString('fr-FR', { style: 'currency', currency: code })
  } catch {
    // Code hors ISO 4217 : ne jamais casser la table pour un formatage.
    return `${(minor / divisor).toLocaleString('fr-FR')} ${code}`
  }
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
        <td class="num">{{ formatAmount(row.grossRevenue, row.currency) }}</td>
        <td class="num" :class="row.commission > 0 ? 'text-danger' : 'text-text-muted'">
          {{ row.commission > 0 ? `-${formatAmount(row.commission, row.currency)}` : formatAmount(0, row.currency) }}
        </td>
        <td
          class="num font-semibold"
          :class="row.netRevenue > 0 ? 'text-success' : 'text-text-muted'"
        >{{ formatAmount(row.netRevenue, row.currency) }}</td>
      </tr>
      <tr v-if="transactions.length === 0">
        <td colspan="6" class="py-8 text-center text-sm text-text-muted">
          Aucune transaction sur cette période.
        </td>
      </tr>
    </tbody>
  </DataTable>
</template>
