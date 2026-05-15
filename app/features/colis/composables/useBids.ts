// app/features/colis/composables/useBids.ts
import { ref } from 'vue'
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
    dateFrom: null,
    dateTo: null,
  })

  const svc = bidsService()

  async function fetchBids(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const page = await svc.listBids({
        statusFilter: filters.value.statusFilter,
        tripId: filters.value.tripId,
        senderSearch: filters.value.senderSearch || undefined,
        dateFrom: filters.value.dateFrom,
        dateTo: filters.value.dateTo,
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

  async function setSenderSearch(search: string): Promise<void> {
    filters.value.senderSearch = search
    await fetchBids()
  }

  async function setDateRange(from: string | null, to: string | null): Promise<void> {
    filters.value.dateFrom = from
    filters.value.dateTo = to
    await fetchBids()
  }

  function toggleSelection(id: string): void {
    const idx = selectedIds.value.indexOf(id)
    if (idx === -1) {
      selectedIds.value = [...selectedIds.value, id]
    } else {
      selectedIds.value = selectedIds.value.filter((x) => x !== id)
    }
  }

  function selectAll(): void {
    selectedIds.value = bids.value.map((b) => b.id)
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
  }
}
