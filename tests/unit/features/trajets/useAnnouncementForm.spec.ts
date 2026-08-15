import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockPublish = vi.fn()

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({
    listTrips: vi.fn(),
    createAnnouncement: mockCreate,
    updateAnnouncement: mockUpdate,
    publishAnnouncement: mockPublish,
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

let mockCommissionRate = 0.12
vi.mock('@/composables/useCommissionRate', () => ({
  FALLBACK_COMMISSION_RATE: 0.12,
  useCommissionRate: () => ({ getRate: async () => mockCommissionRate }),
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
    mockCommissionRate = 0.12
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
    expect(form.capacityUnit).toBe('SUITCASE_23KG')
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
    expect(errors.handoverDeadline).toBe('La date limite de dépôt est obligatoire')
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
    form.handoverDeadline = '2026-06-01'
    const errors = validate()
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('validate rejects a deadline after the departure date', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, validate } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-06-02'
    const errors = validate()
    expect(errors.handoverDeadline).toBe('La date limite de dépôt doit précéder le départ')
  })

  it('validate accepts a deadline several days before departure', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, validate } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.departureTime = '09:00'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-05-28'
    const errors = validate()
    expect(errors.handoverDeadline).toBeUndefined()
  })

  it('validate accepts a deadline on the departure day itself', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, validate } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-06-01'
    const errors = validate()
    expect(errors.handoverDeadline).toBeUndefined()
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
    form.handoverDeadline = '2026-06-01'
    const result = await submit('PUBLISHED')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ transportMode: 'AVION' }),
      { saveAsDraft: false },
    )
    expect(result.status).toBe('PUBLISHED')
  })

  it('buildPayload envoie la date limite en ISO UTC, bornée à la fin de journée', async () => {
    mockCreate.mockResolvedValue({ id: 'trip-hw', status: 'PUBLISHED' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-05'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-06-01'
    await submit('PUBLISHED')
    const payload = mockCreate.mock.calls[0][0]
    expect(payload.handoverDeadline).toBe(new Date('2026-06-01T23:59:00').toISOString())
  })

  it("buildPayload borne la date limite à l'heure de départ quand c'est le jour du départ", async () => {
    mockCreate.mockResolvedValue({ id: 'trip-hw2', status: 'PUBLISHED' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.departureTime = '09:00'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-06-01'
    await submit('PUBLISHED')
    const payload = mockCreate.mock.calls[0][0]
    // 23:59 serait refusé par le backend (postérieur au départ).
    expect(payload.handoverDeadline).toBe(new Date('2026-06-01T09:00').toISOString())
  })

  it('buildPayload includes capacityUnit in the payload', async () => {
    mockCreate.mockResolvedValue({ id: 'trip-cu', status: 'PUBLISHED' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-06-01'
    form.capacityUnit = 'SUITCASE_32KG'
    await submit('PUBLISHED')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ capacityUnit: 'SUITCASE_32KG' }),
      { saveAsDraft: false },
    )
  })

  it('buildPayload defaults capacityUnit to SUITCASE_23KG when not changed', async () => {
    mockCreate.mockResolvedValue({ id: 'trip-default', status: 'PUBLISHED' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-06-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-06-01'
    await submit('PUBLISHED')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ capacityUnit: 'SUITCASE_23KG' }),
      { saveAsDraft: false },
    )
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
    form.handoverDeadline = '2026-06-01'
    const result = await submit('DRAFT')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ transportMode: 'VOITURE' }),
      { saveAsDraft: true },
    )
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
      handoverDeadline: '2026-05-01T16:00:00Z',
      confirmedParcelCount: 0, pendingBidCount: 0, reservedRevenueEuros: 0,
      createdAt: '2026-05-01T00:00:00Z',
    }
    applyTemplate(template)
    expect(form.departureCity).toEqual(validPlace)
    expect(form.availableWeightKg).toBe(20)
    expect(form.pricePerKg).toBe(8)
    expect(form.cashAccepted).toBe(true)
    expect(form.departureDate).toBe('')
    // La date limite du modèle est reprise en valeur <input type="date">.
    expect(form.handoverDeadline).toBe('2026-05-01')
  })

  it('applyTemplate leaves the deadline empty when the trip has none', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, applyTemplate } = useAnnouncementForm()
    applyTemplate({
      id: 't1b', status: 'COMPLETED' as const,
      departureCity: validPlace, arrivalCity: validPlace2,
      departureDate: '2026-05-01', departureTime: null, arrivalTime: null,
      transportMode: 'AVION' as const, pickupPlace: validPlace, dropoffPlace: validPlace2,
      availableWeightKg: 20, usedWeightKg: 0, pricePerKg: 8,
      acceptedCategories: [], refusedCategories: [],
      senderNote: null, cashAccepted: false,
      handoverDeadline: null,
      confirmedParcelCount: 0, pendingBidCount: 0, reservedRevenueEuros: 0,
      createdAt: '2026-05-01T00:00:00Z',
    })
    expect(form.handoverDeadline).toBe('')
  })

  it('applyTemplate sets capacityUnit from trip, defaults to SUITCASE_23KG when absent', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, applyTemplate } = useAnnouncementForm()
    const base = {
      id: 't2', status: 'COMPLETED' as const,
      departureCity: validPlace, arrivalCity: validPlace2,
      departureDate: '2026-05-01', departureTime: null, arrivalTime: null,
      transportMode: 'AVION' as const, pickupPlace: validPlace, dropoffPlace: validPlace2,
      availableWeightKg: 10, usedWeightKg: 0, pricePerKg: 6,
      acceptedCategories: [], refusedCategories: [],
      senderNote: null, cashAccepted: false,
      handoverDeadline: null,
      confirmedParcelCount: 0, pendingBidCount: 0, reservedRevenueEuros: 0,
      createdAt: '2026-05-01T00:00:00Z',
    }
    // With explicit capacityUnit
    applyTemplate({ ...base, capacityUnit: 'SUITCASE_32KG' as const })
    expect(form.capacityUnit).toBe('SUITCASE_32KG')
    // Without capacityUnit (undefined) → fallback
    applyTemplate({ ...base })
    expect(form.capacityUnit).toBe('SUITCASE_23KG')
  })

  it('applyQuickTemplate pre-fills corridor/price/content but leaves date and addresses empty', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, applyQuickTemplate } = useAnnouncementForm()
    applyQuickTemplate({
      id: 'paris-dakar',
      label: 'Paris → Dakar',
      emoji: '🇸🇳',
      departureCity: { placeId: '', label: 'Paris', lat: 48.8566, lng: 2.3522 },
      arrivalCity: { placeId: '', label: 'Dakar', lat: 14.7167, lng: -17.4677 },
      transportMode: 'PLANE',
      capacityUnit: 'SUITCASE_23KG',
      availableWeightKg: 23,
      pricePerKg: 8,
      acceptedCategories: ['Vêtements', 'Documents'],
    })
    expect(form.departureCity?.label).toBe('Paris')
    expect(form.arrivalCity?.label).toBe('Dakar')
    expect(form.transportMode).toBe('PLANE')
    expect(form.availableWeightKg).toBe(23)
    expect(form.pricePerKg).toBe(8)
    expect(form.acceptedCategories).toEqual(['Vêtements', 'Documents'])
    // Champs personnels laissés vides
    expect(form.departureDate).toBe('')
    expect(form.pickupPlace).toBeNull()
    expect(form.dropoffPlace).toBeNull()
  })

  it('netPrice computes 88% of pricePerKg correctly', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, netPrice } = useAnnouncementForm()
    form.pricePerKg = 8
    expect(netPrice.value).toBeCloseTo(7.04, 2)
    form.pricePerKg = 5
    expect(netPrice.value).toBeCloseTo(4.40, 2)
  })

  it('netPrice applique le taux de commission dynamique une fois chargé', async () => {
    mockCommissionRate = 0.2
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, netPrice, commissionRate } = useAnnouncementForm()
    form.pricePerKg = 10
    await vi.waitFor(() => expect(commissionRate.value).toBe(0.2))
    expect(netPrice.value).toBeCloseTo(8, 2) // 10 × (1 − 0,20)
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
    form.handoverDeadline = '2026-07-01'
    const result = await submitEdit('trip-edit', 'PUBLISHED')
    expect(mockUpdate).toHaveBeenCalledWith('trip-edit', expect.objectContaining({ transportMode: 'AVION', departureDate: '2026-07-01' }))
    expect(result.id).toBe('trip-edit')
  })

  it('submitEdit throws when form is invalid', async () => {
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { submitEdit } = useAnnouncementForm()
    await expect(submitEdit('trip-x', 'DRAFT')).rejects.toThrow('Formulaire invalide')
  })

  it('submitEdit publie le trajet quand le statut visé est PUBLISHED et que l’update retourne un brouillon', async () => {
    mockUpdate.mockResolvedValue({ id: 'trip-draft', status: 'DRAFT' })
    mockPublish.mockResolvedValue({ id: 'trip-draft', status: 'PUBLISHED' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submitEdit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-07-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-07-01'
    const result = await submitEdit('trip-draft', 'PUBLISHED')
    expect(mockUpdate).toHaveBeenCalledWith('trip-draft', expect.objectContaining({ transportMode: 'AVION' }))
    expect(mockPublish).toHaveBeenCalledWith('trip-draft')
    expect(result.status).toBe('PUBLISHED')
  })

  it('submitEdit ne republie pas un trajet dont l’update retourne déjà le statut ACTIVE', async () => {
    mockUpdate.mockResolvedValue({ id: 'trip-active', status: 'ACTIVE' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submitEdit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-07-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-07-01'
    const result = await submitEdit('trip-active', 'PUBLISHED')
    expect(mockPublish).not.toHaveBeenCalled()
    expect(result.status).toBe('ACTIVE')
  })

  it('submitEdit n’appelle jamais publishAnnouncement quand le statut visé est DRAFT', async () => {
    mockUpdate.mockResolvedValue({ id: 'trip-draft2', status: 'DRAFT' })
    const useAnnouncementForm = await importUseAnnouncementForm()
    const { form, submitEdit } = useAnnouncementForm()
    form.departureCity = validPlace
    form.arrivalCity = validPlace2
    form.departureDate = '2026-07-01'
    form.transportMode = 'AVION'
    form.pickupPlace = validPlace
    form.dropoffPlace = validPlace2
    form.handoverDeadline = '2026-07-01'
    const result = await submitEdit('trip-draft2', 'DRAFT')
    expect(mockPublish).not.toHaveBeenCalled()
    expect(result.status).toBe('DRAFT')
  })
})
