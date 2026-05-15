<!-- app/features/activite/components/FiscalExportPanel.vue -->
<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { FiscalExportFormat, FiscalExportType } from '@/features/activite/types/index'

defineProps<{
  isExporting: boolean
}>()

const emit = defineEmits<{
  'export': [format: FiscalExportFormat, type: FiscalExportType]
}>()

const exports: Array<{ label: string; description: string; format: FiscalExportFormat; type: FiscalExportType }> = [
  { label: 'Récapitulatif annuel', description: 'Revenus bruts, commissions, nets par mois', format: 'pdf', type: 'summary' },
  { label: 'Export comptable', description: 'Toutes transactions avec dates et montants', format: 'csv', type: 'transactions' },
  { label: 'DAC7', description: 'Déclaration pré-remplie conforme obligation UE', format: 'pdf', type: 'dac7' },
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
    <button
      v-for="exp in exports"
      :key="exp.type"
      :data-test="`export-btn-${exp.type}`"
      :disabled="isExporting"
      :class="cn(
        'flex flex-col items-start gap-2 p-4 bg-surface border rounded-card text-left transition-all duration-200',
        isExporting ? 'border-border opacity-50 cursor-not-allowed' : 'border-border hover:border-primary/40 hover:bg-primary/5',
      )"
      type="button"
      @click="!isExporting && emit('export', exp.format, exp.type)"
    >
      <div class="flex items-center gap-2">
        <Download class="w-4 h-4 text-primary flex-shrink-0" />
        <span class="text-sm font-semibold text-text">{{ exp.label }}</span>
        <span class="text-xs text-text-muted border border-border rounded px-1 uppercase">{{ exp.format }}</span>
      </div>
      <p class="text-xs text-text-muted leading-relaxed">{{ exp.description }}</p>
    </button>
  </div>
</template>
