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

const backendRecurrence = {
  id: 'rec-1',
  sourceTemplateId: 'tpl-1',
  departureCity: 'Paris',
  arrivalCity: 'Dakar',
  transportMode: 'PLANE',
  capacityUnit: 'SUITCASE_23KG',
  availableKg: 23,
  pricePerKg: 8,
  acceptedCategories: ['Vêtements'],
  pickupAddress: { label: '12 rue', lat: 48.86, lng: 2.33 },
  deliveryAddress: { label: 'CDG', lat: 49.01, lng: 2.55 },
  departureTime: '14:00:00',
  arrivalTime: '18:30:00',
  cashAccepted: true,
  weekdays: '0000100',
  horizonDays: 14,
  active: true,
  lastGeneratedDate: '2026-05-28',
}

describe('tripRecurrenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('list GETs /trip-recurrences and maps (truncates time, maps addresses)', async () => {
    mockApiFn.mockResolvedValue([backendRecurrence])
    const { tripRecurrenceService } = await import('@/features/trajets/services/tripRecurrenceService')
    const result = await tripRecurrenceService().list()
    expect(mockApiFn).toHaveBeenCalledWith('/trip-recurrences', {})
    expect(result[0].departureTime).toBe('14:00')
    expect(result[0].weekdays).toBe('0000100')
    expect(result[0].pickupAddress.label).toBe('12 rue')
    expect(result[0].acceptedCategories).toEqual(['Vêtements'])
    expect(result[0].arrivalTime).toBe('18:30')
    expect(result[0].cashAccepted).toBe(true)
  })

  it('list maps null acceptedCategories and null time', async () => {
    mockApiFn.mockResolvedValue([{ ...backendRecurrence, acceptedCategories: null, departureTime: null }])
    const { tripRecurrenceService } = await import('@/features/trajets/services/tripRecurrenceService')
    const result = await tripRecurrenceService().list()
    expect(result[0].acceptedCategories).toEqual([])
    expect(result[0].departureTime).toBeNull()
  })

  it('create POSTs the payload', async () => {
    mockApiFn.mockResolvedValue(backendRecurrence)
    const { tripRecurrenceService } = await import('@/features/trajets/services/tripRecurrenceService')
    const payload = {
      sourceTemplateId: 'tpl-1', departureCity: 'Paris', arrivalCity: 'Dakar',
      transportMode: 'PLANE' as const, capacityUnit: 'SUITCASE_23KG' as const,
      availableKg: 23, pricePerKg: 8, acceptedCategories: ['Vêtements'],
      pickupAddress: { label: '12 rue', lat: 48.86, lng: 2.33 },
      deliveryAddress: { label: 'CDG', lat: 49.01, lng: 2.55 },
      departureTime: '14:00', arrivalTime: '18:30', cashAccepted: true,
      weekdays: '0000100', horizonDays: 14, active: true,
    }
    await tripRecurrenceService().create(payload)
    expect(mockApiFn).toHaveBeenCalledWith('/trip-recurrences', { method: 'POST', body: payload })
  })

  it('update PUTs and remove DELETEs', async () => {
    mockApiFn.mockResolvedValue(backendRecurrence)
    const { tripRecurrenceService } = await import('@/features/trajets/services/tripRecurrenceService')
    const svc = tripRecurrenceService()
    await svc.remove('rec-1')
    expect(mockApiFn).toHaveBeenCalledWith('/trip-recurrences/rec-1', { method: 'DELETE' })
  })

  it('recurrenceToPayload rebuilds a payload from a recurrence', async () => {
    mockApiFn.mockResolvedValue([backendRecurrence])
    const { tripRecurrenceService, recurrenceToPayload } =
      await import('@/features/trajets/services/tripRecurrenceService')
    const [rec] = await tripRecurrenceService().list()
    const payload = recurrenceToPayload(rec)
    expect(payload.weekdays).toBe('0000100')
    expect(payload.departureTime).toBe('14:00')
    expect(payload.pickupAddress).toEqual({ label: '12 rue', lat: 48.86, lng: 2.33 })
    expect(payload.active).toBe(true)
    expect(payload.arrivalTime).toBe('18:30')
    expect(payload.cashAccepted).toBe(true)
  })
})
