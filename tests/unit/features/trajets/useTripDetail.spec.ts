import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockSvc = {
  getAnnouncement: vi.fn(),
  getAnnouncementBids: vi.fn(),
  deleteAnnouncement: vi.fn(),
  acceptBid: vi.fn(),
  rejectBid: vi.fn(),
  confirmDelivery: vi.fn(),
  postTrackingEvent: vi.fn(),
  listTrips: vi.fn(),
  createAnnouncement: vi.fn(),
  getTemplates: vi.fn(),
  updateAnnouncement: vi.fn(),
}

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => mockSvc,
}))

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

describe('useTripDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('fetchTrip loads trip and sets isLoading correctly', async () => {
    const fakeTrip = { id: 'trip-1', status: 'ACTIVE', availableWeightKg: 20, usedWeightKg: 5, confirmedParcelCount: 1, pendingBidCount: 2 }
    mockSvc.getAnnouncement.mockResolvedValue(fakeTrip)
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { trip, isLoading, fetchTrip } = useTripDetail('trip-1')
    expect(isLoading.value).toBe(false)
    const p = fetchTrip()
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
    expect(trip.value).toEqual(fakeTrip)
    expect(mockSvc.getAnnouncement).toHaveBeenCalledWith('trip-1')
  })

  it('fetchBids loads bids', async () => {
    const fakeBids = [
      { id: 'b1', status: 'PAYMENT_ESCROWED', paymentAmountEuros: 24, earningsEuros: 21.12 },
      { id: 'b2', status: 'ACCEPTED', paymentAmountEuros: 16, earningsEuros: 14.08 },
    ]
    mockSvc.getAnnouncementBids.mockResolvedValue(fakeBids)
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { bids, fetchBids } = useTripDetail('trip-1')
    await fetchBids()
    expect(bids.value).toEqual(fakeBids)
    expect(mockSvc.getAnnouncementBids).toHaveBeenCalledWith('trip-1')
  })

  it('kpis computes fillRatePct from trip', async () => {
    mockSvc.getAnnouncement.mockResolvedValue({ id: 't1', availableWeightKg: 20, usedWeightKg: 10, confirmedParcelCount: 2, pendingBidCount: 0, status: 'ACTIVE' })
    mockSvc.getAnnouncementBids.mockResolvedValue([
      { id: 'b1', status: 'ACCEPTED', paymentAmountEuros: 80, earningsEuros: 70.4 },
    ])
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { kpis, fetchTrip, fetchBids } = useTripDetail('trip-1')
    await fetchTrip()
    await fetchBids()
    expect(kpis.value.fillRatePct).toBe(50)
    expect(kpis.value.grossRevenueEuros).toBe(80)
    expect(kpis.value.commissionEuros).toBe(9.6)
    expect(kpis.value.netRevenueEuros).toBe(70.4)
    expect(kpis.value.revenuePerKg).toBe(7.04)
  })

  it('deleteTrip calls deleteAnnouncement and redirects to /trajets', async () => {
    mockSvc.deleteAnnouncement.mockResolvedValue(undefined)
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { deleteTrip } = useTripDetail('trip-1')
    await deleteTrip()
    expect(mockSvc.deleteAnnouncement).toHaveBeenCalledWith('trip-1')
    expect(pushMock).toHaveBeenCalledWith('/trajets')
  })

  it('acceptBid calls svc.acceptBid then refreshes bids and trip', async () => {
    mockSvc.acceptBid.mockResolvedValue(undefined)
    mockSvc.getAnnouncementBids.mockResolvedValue([])
    mockSvc.getAnnouncement.mockResolvedValue({ id: 'trip-1', availableWeightKg: 20, usedWeightKg: 5, status: 'ACTIVE' })
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { acceptBid } = useTripDetail('trip-1')
    await acceptBid('bid-99')
    expect(mockSvc.acceptBid).toHaveBeenCalledWith('bid-99')
    expect(mockSvc.getAnnouncementBids).toHaveBeenCalledWith('trip-1')
    expect(mockSvc.getAnnouncement).toHaveBeenCalledWith('trip-1')
  })

  it('fetchTrip sets an error message when the service rejects', async () => {
    mockSvc.getAnnouncement.mockRejectedValue(new Error('boom'))
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { error, isLoading, fetchTrip } = useTripDetail('trip-1')
    await fetchTrip()
    expect(error.value).toBe('Impossible de charger ce trajet.')
    expect(isLoading.value).toBe(false)
  })

  it('fetchBids stays silent and keeps bids empty when the service rejects', async () => {
    mockSvc.getAnnouncementBids.mockRejectedValue(new Error('boom'))
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { bids, error, bidsLoading, fetchBids } = useTripDetail('trip-1')
    await fetchBids()
    expect(bids.value).toEqual([])
    expect(error.value).toBeNull()
    expect(bidsLoading.value).toBe(false)
  })

  it('deleteTrip sets an error and does not redirect when the service rejects', async () => {
    mockSvc.deleteAnnouncement.mockRejectedValue(new Error('boom'))
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { error, deleteTrip } = useTripDetail('trip-1')
    await deleteTrip()
    expect(error.value).toBe('Impossible de supprimer ce trajet.')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('rejectBid calls svc.rejectBid then refreshes bids and trip', async () => {
    mockSvc.rejectBid.mockResolvedValue(undefined)
    mockSvc.getAnnouncementBids.mockResolvedValue([])
    mockSvc.getAnnouncement.mockResolvedValue({ id: 'trip-1', availableWeightKg: 20, usedWeightKg: 0, status: 'ACTIVE' })
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { rejectBid } = useTripDetail('trip-1')
    await rejectBid('bid-7')
    expect(mockSvc.rejectBid).toHaveBeenCalledWith('bid-7')
    expect(mockSvc.getAnnouncementBids).toHaveBeenCalledWith('trip-1')
    expect(mockSvc.getAnnouncement).toHaveBeenCalledWith('trip-1')
  })

  it('markTrackingEvent posts the event then refreshes bids and trip', async () => {
    mockSvc.postTrackingEvent.mockResolvedValue(undefined)
    mockSvc.getAnnouncementBids.mockResolvedValue([])
    mockSvc.getAnnouncement.mockResolvedValue({ id: 'trip-1', availableWeightKg: 20, usedWeightKg: 0, status: 'ACTIVE' })
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { markTrackingEvent } = useTripDetail('trip-1')
    await markTrackingEvent('bid-1', 'DEPART')
    expect(mockSvc.postTrackingEvent).toHaveBeenCalledWith('bid-1', 'DEPART')
    expect(mockSvc.getAnnouncementBids).toHaveBeenCalledWith('trip-1')
    expect(mockSvc.getAnnouncement).toHaveBeenCalledWith('trip-1')
  })

  it('confirmDelivery calls svc.confirmDelivery then refreshes bids and trip', async () => {
    mockSvc.confirmDelivery.mockResolvedValue(undefined)
    mockSvc.getAnnouncementBids.mockResolvedValue([])
    mockSvc.getAnnouncement.mockResolvedValue({ id: 'trip-1', availableWeightKg: 20, usedWeightKg: 0, status: 'ACTIVE' })
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { confirmDelivery } = useTripDetail('trip-1')
    await confirmDelivery('bid-3', 'CODE12')
    expect(mockSvc.confirmDelivery).toHaveBeenCalledWith('bid-3', 'CODE12')
    expect(mockSvc.getAnnouncementBids).toHaveBeenCalledWith('trip-1')
  })

  it('kpis returns all zeros when no trip is loaded', async () => {
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { kpis } = useTripDetail('trip-1')
    expect(kpis.value).toEqual({
      fillRatePct: 0,
      grossRevenueEuros: 0,
      commissionEuros: 0,
      netRevenueEuros: 0,
      revenuePerKg: 0,
    })
  })

  it('kpis fillRatePct and revenuePerKg fall back to 0 when capacity and usage are 0', async () => {
    mockSvc.getAnnouncement.mockResolvedValue({ id: 't1', availableWeightKg: 0, usedWeightKg: 0, status: 'ACTIVE' })
    mockSvc.getAnnouncementBids.mockResolvedValue([])
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { kpis, fetchTrip, fetchBids } = useTripDetail('trip-1')
    await fetchTrip()
    await fetchBids()
    expect(kpis.value.fillRatePct).toBe(0)
    expect(kpis.value.revenuePerKg).toBe(0)
  })

  it('exportBidsCsv returns CSV with header and one row per bid', async () => {
    mockSvc.getAnnouncementBids.mockResolvedValue([
      {
        id: 'bid-1', senderName: 'Alice Martin', senderTotalShipments: 5,
        weightKg: 3, declaredValueEuros: 50, status: 'PAYMENT_ESCROWED',
        earningsEuros: 21.12, createdAt: '2026-06-01T10:00:00',
        senderInitials: 'AM', senderId: 's1', contentDescription: 'Vêtements',
        paymentAmountEuros: 24, paymentMethod: 'STRIPE',
      },
    ])
    const { useTripDetail } = await import('@/features/trajets/composables/useTripDetail')
    const { fetchBids, exportBidsCsv } = useTripDetail('trip-1')
    await fetchBids()
    const csv = exportBidsCsv()
    expect(csv).toContain('Alice Martin')
    expect(csv).toContain('PAYMENT_ESCROWED')
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
  })
})
