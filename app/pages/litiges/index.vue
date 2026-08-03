<!-- app/pages/litiges/index.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { ShieldAlert } from 'lucide-vue-next'
import { useDisputes } from '@/features/disputes/composables/useDisputes'
import { DISPUTE_TYPE_LABELS, DISPUTE_STATUS_LABELS } from '@/features/disputes/types/index'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Litiges',
  pageSubtitle: 'Suivi des litiges où tu es impliqué',
})

const { disputes, isLoading, error, fetchDisputes } = useDisputes()

onMounted(() => {
  fetchDisputes()
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_CLASSES: Record<string, string> = {
  OPEN: 'bg-warning/20 text-warning',
  UNDER_REVIEW: 'bg-blue-500/20 text-blue-400',
  RESOLVED: 'bg-green-500/20 text-green-400',
  REJECTED: 'bg-border text-text-muted',
}
</script>

<template>
  <div class="max-w-3xl space-y-4">
    <p v-if="error" class="text-sm text-danger" data-test="disputes-error">{{ error }}</p>

    <div v-else-if="isLoading" class="space-y-3" data-test="disputes-loading">
      <div v-for="i in 3" :key="i" class="h-16 bg-surface border border-border rounded-card animate-pulse" />
    </div>

    <div
      v-else-if="disputes.length === 0"
      class="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-card text-center"
      data-test="disputes-empty"
    >
      <ShieldAlert class="w-8 h-8 text-text-subtle mb-2" />
      <p class="text-sm text-text-muted">Aucun litige en cours. Tant mieux !</p>
    </div>

    <div v-else class="bg-surface border border-border rounded-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-bg">
              <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">Type</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">Statut</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">Remboursement</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap">Ouvert le</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="d in disputes" :key="d.id" :data-test="`dispute-${d.id}`">
              <td class="px-4 py-3 text-text whitespace-nowrap">{{ DISPUTE_TYPE_LABELS[d.type] ?? d.type }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', STATUS_CLASSES[d.status] ?? 'bg-border text-text-muted']">
                  {{ DISPUTE_STATUS_LABELS[d.status] ?? d.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-text-muted whitespace-nowrap">{{ d.refundFrozen ? 'Gelé pendant l’examen' : '—' }}</td>
              <td class="px-4 py-3 text-text-muted whitespace-nowrap">{{ formatDate(d.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-xs text-text-subtle">
      Les litiges sont examinés par l'équipe yadony. Tu seras notifié de toute décision.
    </p>
  </div>
</template>
