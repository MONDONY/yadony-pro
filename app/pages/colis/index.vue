<!-- app/pages/colis/index.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import BidFilters from '@/features/colis/components/BidFilters.vue'
import BidTable from '@/features/colis/components/BidTable.vue'
import BidDetailPanel from '@/features/colis/components/BidDetailPanel.vue'
import BulkActions from '@/features/colis/components/BulkActions.vue'
import { useBids } from '@/features/colis/composables/useBids'
import { useBidDetail } from '@/features/colis/composables/useBidDetail'
import { bidsService } from '@/features/colis/services/bidsService'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Mes Colis',
  pageSubtitle: 'Vue unifiée cross-trajets',
})

const {
  bids,
  isLoading,
  error,
  totalElements,
  filters,
  selectedIds,
  fetchBids,
  setStatusFilter,
  setTripFilter,
  setSenderSearch,
  setDateRange,
  toggleSelection,
  selectAll,
  clearSelection,
  acceptSelected,
  rejectSelected,
  exportCsv,
} = useBids()

const { isOpen: panelOpen, selectedBid, openPanel, closePanel, updateSelectedBid } = useBidDetail()

const availableTrips = computed(() => {
  const seen = new Set<string>()
  return bids.value
    .filter((b) => {
      if (seen.has(b.tripId)) return false
      seen.add(b.tripId)
      return true
    })
    .map((b) => ({ id: b.tripId, tripCorridor: b.tripCorridor }))
})

onMounted(() => {
  fetchBids()
})

const svc = bidsService()

async function onAcceptSingle(id: string) {
  const updated = await svc.acceptBid(id)
  updateSelectedBid({ status: updated.status })
  await fetchBids()
}

async function onRejectSingle(id: string) {
  const updated = await svc.rejectBid(id)
  updateSelectedBid({ status: updated.status })
  await fetchBids()
}

function onExportCsv() {
  const csv = exportCsv()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `colis-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-5">

    <!-- Filters -->
    <BidFilters
      :model-value="filters"
      :available-trips="availableTrips"
      @update:status-filter="setStatusFilter"
      @update:trip-id="setTripFilter"
      @update:sender-search="setSenderSearch"
      @update:date-from="(v) => setDateRange(v, filters.dateTo)"
      @update:date-to="(v) => setDateRange(filters.dateFrom, v)"
    />

    <!-- Bulk actions bar -->
    <BulkActions
      :count="selectedIds.length"
      :is-loading="isLoading"
      @accept="acceptSelected"
      @reject="rejectSelected"
      @export="onExportCsv"
      @clear="clearSelection"
    />

    <!-- Error state -->
    <div v-if="error" class="flex flex-col items-center justify-center py-16 text-center">
      <p class="text-red-500 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text transition-colors"
        @click="fetchBids()"
      >
        Réessayer
      </button>
    </div>

    <!-- Table -->
    <BidTable
      v-else
      :bids="bids"
      :selected-ids="selectedIds"
      :is-loading="isLoading"
      @toggle-select="toggleSelection"
      @select-all="selectAll"
      @clear-selection="clearSelection"
      @open-detail="openPanel"
      @accept="onAcceptSingle"
      @reject="onRejectSingle"
    />

    <!-- Summary -->
    <p v-if="!isLoading && !error && totalElements > 0" class="text-xs text-text-muted text-right">
      {{ totalElements }} colis au total
    </p>

    <!-- Slide-over detail -->
    <BidDetailPanel
      :bid="selectedBid"
      :is-open="panelOpen"
      @close="closePanel"
      @accept="onAcceptSingle"
      @reject="onRejectSingle"
    />
  </div>
</template>
