import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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
  history: [
    { date: '2026-05-01T10:00:00Z', status: 'PENDING' as const, note: 'Bid soumis' },
  ],
  createdAt: '2026-05-01T10:00:00Z',
  expiresAt: null,
}

async function importUseBidDetail() {
  const mod = await import('@/features/colis/composables/useBidDetail')
  return mod.useBidDetail
}

describe('useBidDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
  })

  it('initializes with isOpen=false and selectedBid=null', async () => {
    const useBidDetail = await importUseBidDetail()
    const { isOpen, selectedBid } = useBidDetail()
    expect(isOpen.value).toBe(false)
    expect(selectedBid.value).toBeNull()
  })

  it('openPanel sets selectedBid and isOpen=true', async () => {
    const useBidDetail = await importUseBidDetail()
    const { isOpen, selectedBid, openPanel } = useBidDetail()
    openPanel(fakeBid)
    expect(isOpen.value).toBe(true)
    expect(selectedBid.value).toEqual(fakeBid)
  })

  it('closePanel sets isOpen=false but keeps selectedBid for animation', async () => {
    const useBidDetail = await importUseBidDetail()
    const { isOpen, selectedBid, openPanel, closePanel } = useBidDetail()
    openPanel(fakeBid)
    closePanel()
    expect(isOpen.value).toBe(false)
    // selectedBid stays for exit animation
    expect(selectedBid.value).toEqual(fakeBid)
  })

  it('updateSelectedBid merges partial updates into selectedBid', async () => {
    const useBidDetail = await importUseBidDetail()
    const { selectedBid, openPanel, updateSelectedBid } = useBidDetail()
    openPanel(fakeBid)
    updateSelectedBid({ status: 'ACCEPTED' })
    expect(selectedBid.value?.status).toBe('ACCEPTED')
    expect(selectedBid.value?.id).toBe('bid-1')
  })
})
