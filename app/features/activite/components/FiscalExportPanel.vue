<!-- app/features/activite/components/FiscalExportPanel.vue -->
<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
        'flex flex-col items-start gap-2 rounded-el border border-border bg-surface p-4 text-left shadow-card transition-[transform,box-shadow] duration-150 ease-out',
        isExporting
          ? 'cursor-not-allowed opacity-50'
          : 'hover:-translate-y-px hover:shadow-pop motion-reduce:hover:translate-y-0',
      )"
      type="button"
      @click="!isExporting && emit('export', exp.format, exp.type)"
    >
      <div class="flex items-center gap-2">
        <Download class="h-4 w-4 flex-shrink-0 text-primary" />
        <span class="text-sm font-semibold text-text">{{ exp.label }}</span>
        <Badge variant="neutral" size="sm" :dot="false" class="uppercase">{{ exp.format }}</Badge>
      </div>
      <p class="text-xs leading-relaxed text-text-muted">{{ exp.description }}</p>
    </button>
  </div>
</template>
