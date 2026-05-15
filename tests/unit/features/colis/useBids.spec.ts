// tests/unit/features/colis/useBids.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockListBids = vi.fn()
const mockAcceptBid = vi.fn()
const mockRejectBid = vi.fn()

vi.mock('@/features/colis/services/bidsService', () => ({
  bidsService: () => ({
    listBids: mockListBids,
    acceptBid: mockAcceptBid,
    rejectBid: mockRejectBid,
  }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

const fakeBid = {
  id: 'bid-1',
  status: 'PENDING' as const,
  tripId: 'trip-1',
  tripCorridor: 'Paris → Dakar',
  tripDepartureDate: '2026-06-01',
  sender: { id: 'u1', name: 'Alice', avatarInitials: 'AL', rating: 4.5, totalSentParcels: 12 },
  weightKg: 5,
  contentDescription: 'Vêtements',
  declaredValueEuros: 200,
  earningsEuros: 30.8,
  paymentStatus: 'ESCROWED' as const,
  paymentAmountEuros: 35,
  history: [],
  createdAt: '2026-05-01T10:00:00Z',
  expiresAt: null,
}

async function importUseBids() {
  const mod = await import('@/features/colis/composables/useBids')
  return mod.useBids
}

describe('useBids', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
    mockListBids.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 50,
    })
  })

  it('initializes with TOUS filter and empty bids list', async () => {
    const useBids = await importUseBids()
    const { filters, bids } = useBids()
    expect(filters.value.statusFilter).toBe('TOUS')
    expect(bids.value).toEqual([])
  })

  it('fetchBids populates bids and sets loading states correctly', async () => {
    mockListBids.mockResolvedValue({
      content: [fakeBid],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
    })
    const useBids = await importUseBids()
    const { bids, isLoading, fetchBids } = useBids()
    expect(isLoading.value).toBe(false)
    const promise = fetchBids()
    expect(isLoading.value).toBe(true)
    await promise
    expect(isLoading.value).toBe(false)
    expect(bids.value).toHaveLength(1)
    expect(bids.value[0].id).toBe('bid-1')
  })

  it('setStatusFilter updates filter and re-fetches', async () => {
    const useBids = await importUseBids()
    const { filters, setStatusFilter } = useBids()
    await setStatusFilter('PENDING')
    expect(filters.value.statusFilter).toBe('PENDING')
    expect(mockListBids).toHaveBeenCalledWith(expect.objectContaining({ statusFilter: 'PENDING' }))
  })

  it('setTripFilter updates tripId and re-fetches', async () => {
    const useBids = await importUseBids()
    const { filters, setTripFilter } = useBids()
    await setTripFilter('trip-99')
    expect(filters.value.tripId).toBe('trip-99')
    expect(mockListBids).toHaveBeenCalledWith(expect.objectContaining({ tripId: 'trip-99' }))
  })

  it('setSenderSearch updates senderSearch and re-fetches', async () => {
    const useBids = await importUseBids()
    const { filters, setSenderSearch } = useBids()
    await setSenderSearch('Alice')
    expect(filters.value.senderSearch).toBe('Alice')
    expect(mockListBids).toHaveBeenCalledWith(expect.objectContaining({ senderSearch: 'Alice' }))
  })

  it('sets error message when fetchBids rejects', async () => {
    mockListBids.mockRejectedValue(new Error('Network'))
    const useBids = await importUseBids()
    const { error, fetchBids } = useBids()
    await fetchBids()
    expect(error.value).toBe('Impossible de charger les colis. Veuillez réessayer.')
  })

  it('toggleSelection adds/removes bid id from selectedIds', async () => {
    const useBids = await importUseBids()
    const { selectedIds, toggleSelection } = useBids()
    expect(selectedIds.value).toEqual([])
    toggleSelection('bid-1')
    expect(selectedIds.value).toContain('bid-1')
    toggleSelection('bid-1')
    expect(selectedIds.value).not.toContain('bid-1')
  })

  it('selectAll fills selectedIds with all current bid ids', async () => {
    mockListBids.mockResolvedValue({
      content: [fakeBid, { ...fakeBid, id: 'bid-2' }],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 50,
    })
    const useBids = await importUseBids()
    const { fetchBids, selectAll, selectedIds } = useBids()
    await fetchBids()
    selectAll()
    expect(selectedIds.value).toContain('bid-1')
    expect(selectedIds.value).toContain('bid-2')
    expect(selectedIds.value).toHaveLength(2)
  })

  it('clearSelection empties selectedIds', async () => {
    const useBids = await importUseBids()
    const { toggleSelection, clearSelection, selectedIds } = useBids()
    toggleSelection('bid-1')
    clearSelection()
    expect(selectedIds.value).toEqual([])
  })

  it('acceptSelected calls acceptBid for each selected id and re-fetches', async () => {
    mockAcceptBid.mockResolvedValue({ ...fakeBid, status: 'ACCEPTED' })
    const useBids = await importUseBids()
    const { toggleSelection, acceptSelected, selectedIds } = useBids()
    toggleSelection('bid-1')
    toggleSelection('bid-2')
    await acceptSelected()
    expect(mockAcceptBid).toHaveBeenCalledWith('bid-1')
    expect(mockAcceptBid).toHaveBeenCalledWith('bid-2')
    expect(selectedIds.value).toEqual([])
  })

  it('rejectSelected calls rejectBid for each selected id and clears selection', async () => {
    mockRejectBid.mockResolvedValue({ ...fakeBid, status: 'REFUSED' })
    const useBids = await importUseBids()
    const { toggleSelection, rejectSelected, selectedIds } = useBids()
    toggleSelection('bid-1')
    await rejectSelected()
    expect(mockRejectBid).toHaveBeenCalledWith('bid-1')
    expect(selectedIds.value).toEqual([])
  })

  it('exportCsv returns a CSV string with header and one row per bid', async () => {
    mockListBids.mockResolvedValue({
      content: [fakeBid],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
    })
    const useBids = await importUseBids()
    const { fetchBids, exportCsv, selectedIds } = useBids()
    await fetchBids()
    selectedIds.value = ['bid-1']
    const csv = exportCsv()
    expect(csv).toContain('id,expéditeur,corridor,date départ,poids (kg),statut,revenus (€)')
    expect(csv).toContain('bid-1')
    expect(csv).toContain('Alice')
    expect(csv).toContain('Paris → Dakar')
  })
})
