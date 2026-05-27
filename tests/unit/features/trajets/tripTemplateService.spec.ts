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

const backendTemplate = {
  id: 'tpl-1',
  label: 'Mon Paris-Dakar',
  emoji: '🇸🇳',
  departureCity: 'Paris',
  departureLat: 48.85,
  departureLng: 2.35,
  arrivalCity: 'Dakar',
  arrivalLat: 14.71,
  arrivalLng: -17.46,
  transportMode: 'PLANE',
  capacityUnit: 'SUITCASE_23KG',
  availableKg: 23,
  pricePerKg: 8,
  acceptedCategories: ['Vêtements', 'Documents'],
}

describe('tripTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('list GETs /trip-templates and maps to UserTripTemplate', async () => {
    mockApiFn.mockResolvedValue([backendTemplate])
    const { tripTemplateService } = await import('@/features/trajets/services/tripTemplateService')
    const svc = tripTemplateService()
    const result = await svc.list()
    expect(mockApiFn).toHaveBeenCalledWith('/trip-templates', {})
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Mon Paris-Dakar')
    expect(result[0].departureCity.label).toBe('Paris')
    expect(result[0].departureCity.lat).toBe(48.85)
    expect(result[0].availableWeightKg).toBe(23)
    expect(result[0].acceptedCategories).toEqual(['Vêtements', 'Documents'])
  })

  it('list maps null acceptedCategories to empty array', async () => {
    mockApiFn.mockResolvedValue([{ ...backendTemplate, acceptedCategories: null, departureLat: null, departureLng: null }])
    const { tripTemplateService } = await import('@/features/trajets/services/tripTemplateService')
    const svc = tripTemplateService()
    const result = await svc.list()
    expect(result[0].acceptedCategories).toEqual([])
    expect(result[0].departureCity.lat).toBe(0)
  })

  it('create POSTs the payload to /trip-templates', async () => {
    mockApiFn.mockResolvedValue(backendTemplate)
    const { tripTemplateService } = await import('@/features/trajets/services/tripTemplateService')
    const svc = tripTemplateService()
    const payload = {
      label: 'Mon Paris-Dakar', emoji: null,
      departureCity: 'Paris', departureLat: 48.85, departureLng: 2.35,
      arrivalCity: 'Dakar', arrivalLat: 14.71, arrivalLng: -17.46,
      transportMode: 'PLANE' as const, capacityUnit: 'SUITCASE_23KG' as const,
      availableKg: 23, pricePerKg: 8, acceptedCategories: ['Vêtements', 'Documents'],
    }
    const result = await svc.create(payload)
    expect(mockApiFn).toHaveBeenCalledWith('/trip-templates', { method: 'POST', body: payload })
    expect(result.id).toBe('tpl-1')
  })

  it('update PUTs to /trip-templates/:id', async () => {
    mockApiFn.mockResolvedValue(backendTemplate)
    const { tripTemplateService } = await import('@/features/trajets/services/tripTemplateService')
    const svc = tripTemplateService()
    const payload = {
      label: 'Edit', emoji: null,
      departureCity: 'Lyon', departureLat: null, departureLng: null,
      arrivalCity: 'Abidjan', arrivalLat: null, arrivalLng: null,
      transportMode: 'PLANE' as const, capacityUnit: 'KG_FREE' as const,
      availableKg: 30, pricePerKg: 9, acceptedCategories: [],
    }
    await svc.update('tpl-1', payload)
    expect(mockApiFn).toHaveBeenCalledWith('/trip-templates/tpl-1', { method: 'PUT', body: payload })
  })

  it('remove DELETEs /trip-templates/:id', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const { tripTemplateService } = await import('@/features/trajets/services/tripTemplateService')
    const svc = tripTemplateService()
    await svc.remove('tpl-1')
    expect(mockApiFn).toHaveBeenCalledWith('/trip-templates/tpl-1', { method: 'DELETE' })
  })
})
