<!-- app/features/colis/components/BidTable.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import BidTableRow from '@/features/colis/components/BidTableRow.vue'
import type { Bid } from '@/features/colis/types/index'

const props = defineProps<{
  bids: Bid[]
  selectedIds: string[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  'toggle-select': [id: string]
  'select-all': []
  'clear-selection': []
  'open-detail': [bid: Bid]
  'accept': [id: string]
  'reject': [id: string]
}>()

const allSelected = computed(
  () => props.bids.length > 0 && props.selectedIds.length === props.bids.length,
)

function onSelectAll() {
  if (allSelected.value) {
    emit('clear-selection')
  } else {
    emit('select-all')
  }
}
</script>

<template>
  <div class="bg-surface border border-border rounded-card overflow-hidden">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="p-6 space-y-3">
      <div v-for="i in 5" :key="i" class="h-12 bg-border/40 rounded animate-pulse" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="bids.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <p class="text-text-muted text-sm">Aucun colis correspondant à ces filtres.</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse" data-test="bid-table">
        <thead>
          <tr class="border-b border-border">
            <th class="w-10 pl-4 py-3">
              <input
                type="checkbox"
                data-test="select-all-checkbox"
                :checked="allSelected"
                class="w-4 h-4 rounded accent-primary cursor-pointer"
                @change="onSelectAll"
              />
            </th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Expéditeur</th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Corridor</th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date départ</th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Poids</th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Contenu</th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Statut</th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Revenus</th>
            <th class="py-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          <BidTableRow
            v-for="bid in bids"
            :key="bid.id"
            :bid="bid"
            :is-selected="selectedIds.includes(bid.id)"
            @toggle-select="emit('toggle-select', $event)"
            @open-detail="emit('open-detail', $event)"
            @accept="emit('accept', $event)"
            @reject="emit('reject', $event)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>
