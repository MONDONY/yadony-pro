<!-- app/pages/trajets/[id].vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTripDetail } from '@/features/trajets/composables/useTripDetail'
import TripDetailHeader from '@/features/trajets/components/TripDetailHeader.vue'
import TripDetailOverview from '@/features/trajets/components/TripDetailOverview.vue'
import TripDetailBids from '@/features/trajets/components/TripDetailBids.vue'
import TripDetailRevenue from '@/features/trajets/components/TripDetailRevenue.vue'
import DeleteTripModal from '@/features/trajets/components/DeleteTripModal.vue'

definePageMeta({
  middleware: ['pro-only'],
  pageTitle: 'Gestion du trajet',
  pageSubtitle: 'Détail, colis et revenus',
})

type Tab = 'overview' | 'bids' | 'revenue'
const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Vue générale' },
  { key: 'bids', label: 'Colis' },
  { key: 'revenue', label: 'Revenus' },
]

const route = useRoute()
const tripId = route.params.id as string
const activeTab = ref<Tab>((route.query.tab as Tab) || 'overview')
const showDeleteModal = ref(false)
const loadingBidId = ref<string | null>(null)

const {
  trip, bids, isLoading, bidsLoading, error,
  deleteLoading, kpis,
  fetchTrip, fetchBids, deleteTrip, acceptBid, rejectBid, confirmDelivery, exportBidsCsv,
} = useTripDetail(tripId)

onMounted(async () => {
  await fetchTrip()
  await fetchBids()
})

async function onDeleteConfirm() {
  await deleteTrip()
}

async function onAcceptBid(bidId: string) {
  loadingBidId.value = bidId
  try {
    await acceptBid(bidId)
  } finally {
    loadingBidId.value = null
  }
}

async function onRejectBid(bidId: string) {
  loadingBidId.value = bidId
  try {
    await rejectBid(bidId)
  } finally {
    loadingBidId.value = null
  }
}

async function onConfirmDelivery(bidId: string, code: string) {
  loadingBidId.value = bidId
  try {
    await confirmDelivery(bidId, code)
  } finally {
    loadingBidId.value = null
  }
}

function onExportCsv() {
  const csv = exportBidsCsv()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `colis-trajet-${tripId}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-4">
      <div class="h-8 bg-border rounded w-2/3 animate-pulse" />
      <div class="h-4 bg-border rounded w-1/4 animate-pulse" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-20 text-center">
      <p class="text-red-500 font-medium">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 rounded-btn border border-border text-sm text-text-muted hover:text-text"
        @click="fetchTrip()"
      >
        Réessayer
      </button>
    </div>

    <template v-else-if="trip">
      <!-- Header -->
      <TripDetailHeader
        :trip="trip"
        @delete="showDeleteModal = true"
      />

      <!-- Tabs -->
      <div class="flex items-center gap-1 bg-surface rounded-btn p-1 border border-border w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :data-test="`tab-${tab.key}`"
          :class="[
            'px-4 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === tab.key ? 'bg-primary text-on-primary shadow-sm' : 'text-text-muted hover:text-text',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'bids' && bids.length > 0" class="ml-1.5 text-xs opacity-70">
            ({{ bids.length }})
          </span>
        </button>
      </div>

      <!-- Tab content -->
      <TripDetailOverview v-if="activeTab === 'overview'" :trip="trip" />

      <TripDetailBids
        v-else-if="activeTab === 'bids'"
        :bids="bids"
        :is-loading="bidsLoading"
        :loading-bid-id="loadingBidId"
        @accept="onAcceptBid"
        @reject="onRejectBid"
        @confirm-delivery="onConfirmDelivery"
        @export-csv="onExportCsv"
      />

      <TripDetailRevenue
        v-else-if="activeTab === 'revenue'"
        :trip="trip"
        :kpis="kpis"
      />
    </template>

    <!-- Delete modal -->
    <DeleteTripModal
      v-if="showDeleteModal"
      :is-loading="deleteLoading"
      @confirm="onDeleteConfirm"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
