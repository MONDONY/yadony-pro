import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({
    listTrips: vi.fn(),
    createAnnouncement: mockCreate,
    updateAnnouncement: mockUpdate,
    getTemplates: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

async function importUseAnnouncementForm() {
  const mod = await import('@/features/trajets/composables/useAnnouncementForm')
  return mod.useAnnouncementForm
}

const validPlace = { placeId: 'p1', label: 'Paris', lat: 48.85, lng: 2.35 }
const validPlace2 = { placeId: 'p2', label: 'Dakar', lat: 14.69, lng: -17.44 }

describe('useAnnouncementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
  })

  it('initializes with correct defaults', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form } = useAnnouncementForm()
    expect(form.availableWeightKg).toBe(15)
    expect(form.pricePerKg).toBe(7)
    expect(form.cashAccepted).toBe(false)
    expect(form.acceptedCategories).toEqual([])
    expect(form.refusedCategories).toEqual([])
    expect(form.departureCity).toBeNull()
    expect(form.transportMode).toBeNull()
  })

  it('validate returns errors for missing required fields', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { validate } = useAnnouncementForm()
    const errors = validate()
    expect(errors.departureCity).toBeDefined()
    expect(errors.arrivalCity).toBeDefined()
    expect(errors.departureDate).toBeDefined()
    expect(errors.transportMode).toBeDefined()
    expect(errors.pickupPlace).toBeDefined()
    expect(errors.dropoffPlace).toBeDefined()
  })

  it('validate returns no errors when all required fields are set', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, validate } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    const errors = validate()
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('submit calls createAnnouncement with PUBLISHED status', async () => {
    mockCreate.mockResolvedValue({ id: 'trip-1', status: 'PUBLISHED' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    const result = await submit('PUBLISHED')
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ transportMode: 'AVION' }))
    expect(result.status).toBe('PUBLISHED')
  })

  it('submit calls createAnnouncement with DRAFT status', async () => {
    mockCreate.mockResolvedValue({ id: 'trip-2', status: 'DRAFT' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.transportMode = 'VOITURE'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    const result = await submit('DRAFT')
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ transportMode: 'VOITURE' }))
    expect(result.status).toBe('DRAFT')
  })

  it('submit throws when form is invalid', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { submit } = useAnnouncementForm()
    await expect(submit('PUBLISHED')).rejects.toThrow('Formulaire invalide')
  })

  it('applyTemplate pre-fills form from a trip', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, applyTemplate } = useAnnouncementForm()
    const template = {
      id: 't1', status: 'COMPLETED' as const,
      departureCity: validPlace, arrivalCity: validPlace2,
      departureDate: '2026-05-01', departureTime: '10:00', arrivalTime: '18:00',
      transportMode: 'AVION' as const, pickupPlace: validPlace, dropoffPlace: validPlace2,
      availableWeightKg: 20, usedWeightKg: 0, pricePerKg: 8,
      acceptedCategories: ['Vêtements'], refusedCategories: ['Électronique'],
      senderNote: 'Handle with care', cashAccepted: true,
      confirmedParcelCount: 0, pendingBidCount: 0, reservedRevenueEuros: 0,
      createdAt: '2026-05-01T00:00:00Z',
    }
    applyTemplate(template)
    expect(form.departureCity).toEqual(validPlace)
    expect(form.availableWeightKg).toBe(20)
    expect(form.pricePerKg).toBe(8)
    expect(form.cashAccepted).toBe(true)
    expect(form.departureDate).toBe('')
  })

  it('netPrice computes 88% of pricePerKg correctly', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, netPrice } = useAnnouncementForm()
    form.pricePerKg = 8
    expect(netPrice.value).toBeCloseTo(7.04, 2)
    form.pricePerKg = 5
    expect(netPrice.value).toBeCloseTo(4.40, 2)
  })

  it('submitEdit calls updateAnnouncement with tripId and correct payload', async () => {
    mockUpdate.mockResolvedValue({ id: 'trip-edit', status: 'PUBLISHED' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submitEdit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-07-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    const result = await submitEdit('trip-edit')
    expect(mockUpdate).toHaveBeenCalledWith('trip-edit', expect.objectContaining({ transportMode: 'AVION', departureDate: '2026-07-01' }))
    expect(result.id).toBe('trip-edit')
  })

  it('submitEdit throws when form is invalid', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { submitEdit } = useAnnouncementForm()
    await expect(submitEdit('trip-x')).rejects.toThrow('Formulaire invalide')
  })
})
