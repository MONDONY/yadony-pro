// app/features/colis/composables/useBids.ts
import { ref, computed } from 'vue'
import { bidsService } from '@/features/colis/services/bidsService'
import type { Bid, BidFilter, BidFiltersState } from '@/features/colis/types/index'

const PAGE_SIZE = 20

export function useBids() {
  const bids = ref<Bid[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalElements = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(0)
  const selectedIds = ref<string[]>([])

  const filters = ref<BidFiltersState>({
    statusFilter: 'TOUS',
    tripId: null,
    search: '',
  })

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const svc = bidsService()

  async function fetchBids(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const page = await svc.listBids({
        statusFilter: filters.value.statusFilter,
        tripId: filters.value.tripId,
        q: filters.value.search || null,
        page: currentPage.value,
        size: PAGE_SIZE,
      })
      bids.value = page.content
      totalElements.value = page.totalElements
      totalPages.value = page.totalPages
    } catch {
      error.value = 'Impossible de charger les colis. Veuillez réessayer.'
    } finally {
      isLoading.value = false
    }
  }

  async function goToPage(page: number): Promise<void> {
    currentPage.value = page
    clearSelection()
    await fetchBids()
  }

  async function setStatusFilter(f: BidFilter): Promise<void> {
    filters.value.statusFilter = f
    currentPage.value = 0
    await fetchBids()
  }

  async function setTripFilter(tripId: string | null): Promise<void> {
    filters.value.tripId = tripId
    currentPage.value = 0
    await fetchBids()
  }

  function setSearch(search: string): void {
    filters.value.search = search
    currentPage.value = 0
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => fetchBids(), 350)
  }

  // Keep for backwards compat with BidFilters emit
  function setSenderSearch(search: string): void {
    setSearch(search)
  }

  const filteredBids = computed(() => {
    const q = filters.value.search.trim().toLowerCase()
    if (!q) return bids.value
    return bids.value.filter((b) =>
      b.sender.name.toLowerCase().includes(q) ||
      (b.trackingNumber ?? '').toLowerCase().includes(q),
    )
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
    const header = 'id,n°suivi,expéditeur,corridor,date départ,poids (kg),statut,revenus (€)'
    const rows = selected.map((b) =>
      [
        b.id,
        b.trackingNumber ?? '',
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
    totalPages,
    currentPage,
    pageSize: PAGE_SIZE,
    filters,
    selectedIds,
    fetchBids,
    goToPage,
    setStatusFilter,
    setTripFilter,
    setSearch,
    setSenderSearch,
    toggleSelection,
    selectAll,
    clearSelection,
    acceptSelected,
    rejectSelected,
    exportCsv,
  }
}
