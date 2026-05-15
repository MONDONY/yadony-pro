import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

const fakeThread = {
  id: 'thread-1',
  packageRequestId: 'req-1',
  travelerId: 'traveler-1',
  travelerAnnouncementId: 'ann-1',
  travelerTravelDate: '2026-05-21',
  travelerAvailableKg: 15,
  status: 'OPEN',
  currentPriceEur: 56,
  roundsCount: 1,
  lastActivityAt: '2026-05-15T10:00:00Z',
  createdAt: '2026-05-15T10:00:00Z',
  messages: [],
  paymentIntentClientSecret: null,
  travelerName: 'Abou D.',
  travelerRating: 4.2,
  travelerTripsCount: 15,
  travelerPhotoUrl: null,
  departureCity: 'Paris, France',
  arrivalCity: "Abidjan, Côte d'Ivoire",
  weightKg: 8,
}

describe('negotiationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('startNegotiation POSTs to /negotiations', async () => {
    mockApiFn.mockResolvedValue(fakeThread)
    const { negotiationService } = await import('@/features/negociations/services/negotiationService')
    const svc = negotiationService()
    const payload = {
      packageRequestId: 'req-1',
      proposedPriceEur: 56,
      travelerTravelDate: '2026-05-21',
      travelerAvailableKg: 15,
      travelerAnnouncementId: 'ann-1',
    }
    const result = await svc.startNegotiation(payload)
    expect(mockApiFn).toHaveBeenCalledWith('/negotiations', { method: 'POST', body: payload })
    expect(result.id).toBe('thread-1')
    expect(result.status).toBe('OPEN')
  })

  it('listMine GETs /negotiations/me', async () => {
    mockApiFn.mockResolvedValue([fakeThread])
    const { negotiationService } = await import('@/features/negociations/services/negotiationService')
    const svc = negotiationService()
    const result = await svc.listMine()
    expect(mockApiFn).toHaveBeenCalledWith('/negotiations/me', {})
    expect(result).toHaveLength(1)
    expect(result[0].departureCity).toBe('Paris, France')
  })

  it('getById GETs /negotiations/:id', async () => {
    mockApiFn.mockResolvedValue(fakeThread)
    const { negotiationService } = await import('@/features/negociations/services/negotiationService')
    const svc = negotiationService()
    const result = await svc.getById('thread-1')
    expect(mockApiFn).toHaveBeenCalledWith('/negotiations/thread-1', {})
    expect(result.id).toBe('thread-1')
  })

  it('counter POSTs to /negotiations/:id/counter', async () => {
    const updatedThread = { ...fakeThread, currentPriceEur: 48, roundsCount: 2 }
    mockApiFn.mockResolvedValue(updatedThread)
    const { negotiationService } = await import('@/features/negociations/services/negotiationService')
    const svc = negotiationService()
    const result = await svc.counter('thread-1', { proposedPriceEur: 48, body: 'Mon offre finale' })
    expect(mockApiFn).toHaveBeenCalledWith('/negotiations/thread-1/counter', {
      method: 'POST',
      body: { proposedPriceEur: 48, body: 'Mon offre finale' },
    })
    expect(result.currentPriceEur).toBe(48)
  })

  it('reject POSTs to /negotiations/:id/reject with reason', async () => {
    const rejectedThread = { ...fakeThread, status: 'REJECTED' }
    mockApiFn.mockResolvedValue(rejectedThread)
    const { negotiationService } = await import('@/features/negociations/services/negotiationService')
    const svc = negotiationService()
    const result = await svc.reject('thread-1', 'Dates incompatibles')
    expect(mockApiFn).toHaveBeenCalledWith('/negotiations/thread-1/reject', {
      method: 'POST',
      body: { reason: 'Dates incompatibles' },
    })
    expect(result.status).toBe('REJECTED')
  })

  it('reject sends null reason when none provided', async () => {
    mockApiFn.mockResolvedValue({ ...fakeThread, status: 'REJECTED' })
    const { negotiationService } = await import('@/features/negociations/services/negotiationService')
    const svc = negotiationService()
    await svc.reject('thread-1')
    expect(mockApiFn).toHaveBeenCalledWith('/negotiations/thread-1/reject', {
      method: 'POST',
      body: { reason: null },
    })
  })

  it('submitTrip POSTs to /negotiations/:id/submit-trip', async () => {
    const awaitingThread = { ...fakeThread, status: 'AWAITING_PAYMENT' }
    mockApiFn.mockResolvedValue(awaitingThread)
    const { negotiationService } = await import('@/features/negociations/services/negotiationService')
    const svc = negotiationService()
    const result = await svc.submitTrip('thread-1', 'ann-99')
    expect(mockApiFn).toHaveBeenCalledWith('/negotiations/thread-1/submit-trip', {
      method: 'POST',
      body: { travelerAnnouncementId: 'ann-99' },
    })
    expect(result.status).toBe('AWAITING_PAYMENT')
  })
})
