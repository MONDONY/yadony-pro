// app/features/colis/composables/useBids.ts
import { ref, computed } from 'vue'
import { bidsService } from '@/features/colis/services/bidsService'
import type { Bid, BidFilter, BidFiltersState } from '@/features/colis/types/index'

export function useBids() {
  const bids = ref<Bid[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalElements = ref(0)
  const selectedIds = ref<string[]>([])

  const filters = ref<BidFiltersState>({
    statusFilter: 'TOUS',
    tripId: null,
    senderSearch: '',
  })

  const svc = bidsService()

  async function fetchBids(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const page = await svc.listBids({
        statusFilter: filters.value.statusFilter,
        tripId: filters.value.tripId,
      })
      bids.value = page.content
      totalElements.value = page.totalElements
    } catch {
      error.value = 'Impossible de charger les colis. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  async function setStatusFilter(f: BidFilter): Promise<void> {
    filters.value.statusFilter = f
    await fetchBids()
  }

  async function setTripFilter(tripId: string | null): Promise<void> {
    filters.value.tripId = tripId
    await fetchBids()
  }

  function setSenderSearch(search: string): void {
    filters.value.senderSearch = search
  }

  const filteredBids = computed(() => {
    const search = filters.value.senderSearch.trim().toLowerCase()
    if (!search) return bids.value
    return bids.value.filter((b) => b.sender.name.toLowerCase().includes(search))
  })

  function toggleSelection(id: string): void {
    const idx = selectedIds.value.indexOf(id)
    if (idx === -1) {
      selectedIds.value = [...selectedIds.value, id]
    } else {
      selectedIds.value = selectedIds.value.filter((x) => x !== id)
    }
  }

  function selectAll(): void {
    selectedIds.value = filteredBids.value.map((b) => b.id)
  }

  function clearSelection(): void {
    selectedIds.value = []
  }

  async function acceptSelected(): Promise<void> {
    const ids = [...selectedIds.value]
    await Promise.all(ids.map((id) => svc.acceptBid(id)))
    clearSelection()
    await fetchBids()
  }

  async function rejectSelected(): Promise<void> {
    const ids = [...selectedIds.value]
    await Promise.all(ids.map((id) => svc.rejectBid(id)))
    clearSelection()
    await fetchBids()
  }

  function exportCsv(): string {
    const selected = bids.value.filter((b) => selectedIds.value.includes(b.id))
    const header = 'id,expéditeur,corridor,date départ,poids (kg),statut,revenus (€)'
    const rows = selected.map((b) =>
      [
        b.id,
        b.sender.name,
        b.tripCorridor,
        b.tripDepartureDate,
        b.weightKg,
        b.status,
        b.earningsEuros,
      ].join(','),
    )
    return [header, ...rows].join('\n')
  }

  return {
    bids: filteredBids,
    isLoading,
    error,
    totalElements,
    filters,
    selectedIds,
    fetchBids,
    setStatusFilter,
    setTripFilter,
    setSenderSearch,
    toggleSelection,
    selectAll,
    clearSelection,
    acceptSelected,
    rejectSelected,
    exportCsv,
  }
}
