<!-- app/features/colis/components/BidTable.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { PackageSearch } from 'lucide-vue-next'
import BidTableRow from '@/features/colis/components/BidTableRow.vue'
import { EmptyState } from '@/components/ui/empty-state'
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
  <div class="overflow-hidden rounded-card border border-border bg-surface shadow-card">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="p-6 space-y-3">
      <div v-for="i in 5" :key="i" class="h-12 bg-surface-el rounded-el animate-pulse" />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="bids.length === 0"
      :icon="PackageSearch"
      title="Aucun colis"
      description="Aucun colis ne correspond à ces filtres."
    />

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
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Expéditeur</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">N° Suivi</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Corridor</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Date départ</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Poids</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Contenu</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Statut</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Revenus</th>
            <th class="py-3 pr-4 text-[11px] font-semibold text-text-subtle uppercase tracking-[0.07em]">Actions</th>
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
