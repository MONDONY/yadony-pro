<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * Pagination « Comptoir » : plage d'éléments en Geist Mono tabular + navigation
 * page précédente / suivante. Reconstruit d'après l'usage (colis, trajets).
 */
const props = defineProps<{
  currentPage: number
  totalPages: number
  totalElements?: number
  pageSize?: number
}>()
const emit = defineEmits<{ 'go-to-page': [page: number] }>()

const canPrev = computed(() => props.currentPage > 1)
const canNext = computed(() => props.currentPage < props.totalPages)

const rangeLabel = computed(() => {
  if (props.totalElements == null || props.pageSize == null) return null
  const from = (props.currentPage - 1) * props.pageSize + 1
  const to = Math.min(props.currentPage * props.pageSize, props.totalElements)
  return `${from}–${to} sur ${props.totalElements}`
})

function go(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) emit('go-to-page', page)
}
</script>

<template>
  <nav class="mt-4 flex items-center justify-between gap-4" aria-label="Pagination">
    <p v-if="rangeLabel" class="font-mono text-xs tabular-nums text-text-muted">{{ rangeLabel }}</p>
    <div class="ml-auto flex items-center gap-2">
      <button
        type="button"
        data-test="pagination-prev"
        :disabled="!canPrev"
        class="inline-flex h-9 items-center gap-1 rounded-btn border border-border-strong px-3 text-sm font-medium text-text transition-colors hover:bg-surface-el disabled:pointer-events-none disabled:opacity-40"
        @click="go(currentPage - 1)"
      >
        <ChevronLeft class="h-4 w-4" aria-hidden="true" /> Précédent
      </button>
      <span class="font-mono text-xs tabular-nums text-text-muted">{{ currentPage }} / {{ totalPages }}</span>
      <button
        type="button"
        data-test="pagination-next"
        :disabled="!canNext"
        class="inline-flex h-9 items-center gap-1 rounded-btn border border-border-strong px-3 text-sm font-medium text-text transition-colors hover:bg-surface-el disabled:pointer-events-none disabled:opacity-40"
        @click="go(currentPage + 1)"
      >
        Suivant <ChevronRight class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
