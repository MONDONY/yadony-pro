<!-- app/features/colis/components/BulkActions.vue -->
<script setup lang="ts">
import { CheckCircle, XCircle, Download, X } from 'lucide-vue-next'

const props = defineProps<{
  count: number
  isLoading: boolean
}>()

const emit = defineEmits<{
  'accept': []
  'reject': []
  'export': []
  'clear': []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="count > 0"
      data-test="bulk-actions-bar"
      class="flex items-center gap-3 px-4 py-3 bg-surface border border-primary/40 rounded-el shadow-pop"
    >
      <span class="text-sm font-medium text-text-muted mr-2">
        <span class="text-text font-mono font-bold tabular-nums">{{ count }}</span> sélectionné{{ count > 1 ? 's' : '' }}
      </span>

      <button
        data-test="bulk-accept"
        :disabled="isLoading"
        class="flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-btn bg-success/15 text-success hover:bg-success/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="emit('accept')"
      >
        <CheckCircle class="w-4 h-4" />
        Accepter tout
      </button>

      <button
        data-test="bulk-reject"
        :disabled="isLoading"
        class="flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-btn bg-danger/15 text-danger hover:bg-danger/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="emit('reject')"
      >
        <XCircle class="w-4 h-4" />
        Refuser tout
      </button>

      <button
        data-test="bulk-export"
        class="flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-btn bg-surface border border-border text-text-muted hover:text-text transition-colors"
        @click="emit('export')"
      >
        <Download class="w-4 h-4" />
        Exporter CSV
      </button>

      <button
        data-test="bulk-clear"
        class="ml-auto p-1.5 text-text-muted hover:text-text transition-colors rounded"
        aria-label="Annuler la sélection"
        @click="emit('clear')"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>
