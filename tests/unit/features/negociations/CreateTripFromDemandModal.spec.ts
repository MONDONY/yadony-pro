import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateAnnouncement = vi.fn()
const mockStartNegotiation = vi.fn()

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({ createAnnouncement: mockCreateAnnouncement }),
}))

vi.mock('@/features/negociations/services/negotiationService', () => ({
  negotiationService: () => ({ startNegotiation: mockStartNegotiation }),
}))

vi.mock('@/features/trajets/services/placesService', () => ({
  placesService: () => ({ autocomplete: vi.fn().mockResolvedValue([]), getDetails: vi.fn() }),
}))

let mockFlags = { road: false, boat: false }
vi.mock('@/composables/useTransportModes', () => ({
  useTransportModes: () => ({ getFlags: async () => mockFlags }),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

let mockProfile: { gpPro: boolean; proAccount: boolean } = { gpPro: false, proAccount: false }
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ carrierProfile: mockProfile }),
}))

async function importModal() {
  const { default: Modal } = await import('@/features/demandes/components/CreateTripFromDemandModal.vue')
  return Modal
}

const fakeRequest = {
  id: 'req-1', tripId: 'trip-1', tripCorridor: 'Paris → Dakar',
  tripDepartureDate: '2026-06-15', tripAvailableKg: 20,
  senderName: 'Fatou D.', senderInitials: 'FD', senderRating: 4.8, senderTotalSent: 12,
  weightKg: 5, contentType: 'Vêtements', budgetPerKg: 9,
  messageExcerpt: '...', matchScore: 88, requestedAt: '2026-05-16T08:00:00Z',
}

const pickup = { placeId: 'p1', label: '12 rue de la Paix, Paris', lat: 48.86, lng: 2.33 }
const dropoff = { placeId: 'p2', label: 'Plateau, Dakar', lat: 14.69, lng: -17.44 }

/** Renseigne les deux lieux comme le ferait l'utilisateur via l'autocomplétion. */
async function fillPlaces(wrapper: { findAllComponents: (q: { name: string }) => Array<{ vm: { $emit: (e: string, v: unknown) => void } }> }) {
  const inputs = wrapper.findAllComponents({ name: 'GooglePlacesInput' })
  inputs[0]!.vm.$emit('update:modelValue', pickup)
  inputs[1]!.vm.$emit('update:modelValue', dropoff)
  await new Promise(r => setTimeout(r, 0))
}

describe('CreateTripFromDemandModal', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateAnnouncement.mockReset()
    mockStartNegotiation.mockReset()
    mockFlags = { road: false, boat: false }
    mockProfile = { gpPro: false, proAccount: false }
  })

  it('extracts departureCity and arrivalCity from tripCorridor', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    expect(wrapper.text()).toContain('Paris')
    expect(wrapper.text()).toContain('Dakar')
  })

  it('exige les deux lieux et transmet leurs vraies coordonnées', async () => {
    mockCreateAnnouncement.mockResolvedValue({ id: 'ann-geo', status: 'ACTIVE' })
    mockStartNegotiation.mockResolvedValue({ id: 'thread-geo' })
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await wrapper.find('[data-test="create-trip-date"]').setValue('2026-06-20')
    expect(wrapper.find('[data-test="create-trip-submit"]').attributes('disabled')).toBeDefined()
    await fillPlaces(wrapper)
    await wrapper.find('[data-test="create-trip-submit"]').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      pickupAddress: { label: pickup.label, lat: 48.86, lng: 2.33 },
      deliveryAddress: { label: dropoff.label, lat: 14.69, lng: -17.44 },
    }))
  })

  it('pre-fills suggested price as budgetPerKg × weightKg', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    // 9 €/kg × 5 kg = 45 €
    expect(wrapper.find('[data-test="create-trip-price"]').text()).toContain('45')
  })

  it('calls createAnnouncement then startNegotiation on submit', async () => {
    mockCreateAnnouncement.mockResolvedValue({ id: 'ann-new', status: 'ACTIVE' })
    mockStartNegotiation.mockResolvedValue({ id: 'thread-1' })
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await fillPlaces(wrapper)
    await wrapper.find('[data-test="create-trip-date"]').setValue('2026-06-20')
    await wrapper.find('[data-test="create-trip-submit"]').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(mockCreateAnnouncement).toHaveBeenCalledOnce()
    expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      capacityUnit: 'KG_FREE',
      pricingMode: 'KG',
      negotiable: true,
      currency: 'EUR',
      acceptedPaymentMethods: ['STRIPE'],
      handoverDeadline: null,
    }))
    expect(mockStartNegotiation).toHaveBeenCalledWith(
      expect.objectContaining({
        packageRequestId: 'req-1',
        travelerAnnouncementId: 'ann-new',
        proposedPriceEur: 45,
      }),
    )
  })

  it('crée le trajet dans la devise de la demande, avec les rails de cette devise', async () => {
    // Régression : « EUR » en dur faisait d'un budget de 20 000 F CFA/kg un trajet
    // à 20 000 €/kg, et la carte était déclarée sur une devise qui l'interdit.
    mockCreateAnnouncement.mockResolvedValue({ id: 'ann-xof', status: 'ACTIVE' })
    mockStartNegotiation.mockResolvedValue({ id: 'thread-xof' })
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, {
      props: { request: { ...fakeRequest, currency: 'XOF', budgetPerKg: 20000, weightKg: 5 } },
    })
    expect(wrapper.find('[data-test="create-trip-price"]').text().replace(/[\s  ]/g, '')).toBe('100000FCFA')
    expect(wrapper.text()).not.toContain('€')
    await fillPlaces(wrapper)
    await wrapper.find('[data-test="create-trip-date"]').setValue('2026-06-20')
    await wrapper.find('[data-test="create-trip-submit"]').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      currency: 'XOF',
      pricePerKg: 20000,
      acceptedPaymentMethods: ['MOBILE_MONEY', 'CASH'],
    }))
    expect(mockStartNegotiation).toHaveBeenCalledWith(expect.objectContaining({ proposedPriceEur: 100000 }))
  })

  it('ne plafonne plus le prix proposé à 500 € : seul le budget de l’expéditeur borne', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    // 20 000 F CFA/kg × 20 kg = 400 000 F CFA, plus de plafond métier (dony-back #315).
    const wrapper = mount(Modal, {
      props: { request: { ...fakeRequest, currency: 'XOF', budgetPerKg: 20000, weightKg: 20 } },
    })
    expect(wrapper.find('[data-test="create-trip-price"]').text().replace(/[\s  ]/g, '')).toBe('400000FCFA')
    expect(wrapper.text().replace(/[\s  ]/g, '')).toContain('Max400000FCFA')
  })

  it('affiche le message du serveur quand la création du trajet est refusée', async () => {
    mockCreateAnnouncement.mockRejectedValue({
      data: { code: 'stripe-onboarding-incomplete', detail: 'Connectez votre compte bancaire pour accepter la carte.' },
    })
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await fillPlaces(wrapper)
    await wrapper.find('[data-test="create-trip-date"]').setValue('2026-06-20')
    await wrapper.find('[data-test="create-trip-submit"]').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.text()).toContain('Connectez votre compte bancaire pour accepter la carte.')
    expect(mockStartNegotiation).not.toHaveBeenCalled()
  })

  it('fait varier le prix par pas de devise entre le plancher et le budget', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    const price = () => wrapper.find('[data-test="create-trip-price"]').text().replace(/[\s  ]/g, '')
    expect(price()).toBe('45,00€')
    const buttons = wrapper.findAll('button')
    const minus = buttons.find((b) => b.html().includes('lucide-minus'))!
    const plus = buttons.find((b) => b.html().includes('lucide-plus'))!
    await minus.trigger('click')
    expect(price()).toBe('44,00€')
    await plus.trigger('click')
    await plus.trigger('click')
    expect(price()).toBe('45,00€') // jamais au-dessus du budget de l'expéditeur
    for (let i = 0; i < 50; i++) await minus.trigger('click')
    expect(price()).toBe('1,00€') // jamais sous le plancher
  })

  it('change le mode de transport et se ferme depuis la croix et le fond', async () => {
    mockFlags = { road: true, boat: false }
    const Modal = await importModal()
    const { mount, flushPromises } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await flushPromises()
    const road = wrapper.findAll('button').find((b) => b.text().includes('Route'))!
    await road.trigger('click')
    expect(road.attributes('class')).toContain('primary')
    await wrapper.find('[data-test="create-trip-close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.find('[data-test="create-trip-kg"]').setValue(12)
    expect((wrapper.find('[data-test="create-trip-kg"]').element as HTMLInputElement).value).toBe('12')
  })

  it('ne rend rien sans demande', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: null } })
    expect(wrapper.find('[data-test="create-trip-submit"]').exists()).toBe(false)
  })

  it('emits close when cancel is clicked', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await wrapper.find('[data-test="create-trip-cancel"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  describe('mode de transport', () => {
    async function mountWith(request: Record<string, unknown>, flags = { road: false, boat: false }) {
      mockFlags = flags
      const Modal = await importModal()
      const { mount, flushPromises } = await import('@vue/test-utils')
      const wrapper = mount(Modal, { props: { request } })
      await flushPromises()
      return wrapper
    }
    const modeLabels = (w: { findAll: (q: string) => Array<{ text: () => string }> }) =>
      w.findAll('[data-test^="create-trip-mode-"]').map((b) => b.text())

    it('demande Route, route allumée : mode figé sur Route', async () => {
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'CAR' }, { road: true, boat: false })
      expect(modeLabels(w)).toEqual(['Route'])
      expect(w.find('[data-test="create-trip-blocked"]').exists()).toBe(false)
    })

    it('demande Route, route éteinte : bouton désactivé avec la raison', async () => {
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'BUS' })
      expect(w.get('[data-test="create-trip-submit"]').attributes('disabled')).toBeDefined()
      expect(w.get('[data-test="create-trip-blocked"]').text()).toContain('Route')
    })

    it('demande bateau, transporteur vérifié : mode figé sur Bateau et champs m³', async () => {
      mockProfile = { gpPro: true, proAccount: false }
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'BOAT' }, { road: true, boat: true })
      expect(modeLabels(w)).toEqual(['Bateau'])
      expect(w.find('[data-test="create-trip-volume"]').exists()).toBe(true)
      expect(w.find('[data-test="create-trip-price-m3"]').exists()).toBe(true)
      expect(w.find('[data-test="create-trip-kg"]').exists()).toBe(false)
      expect(w.find('[data-test="create-trip-blocked"]').exists()).toBe(false)
    })

    it('demande bateau, transporteur non vérifié : bouton désactivé avec la raison', async () => {
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'BOAT' }, { road: true, boat: true })
      await w.find('[data-test="create-trip-date"]').setValue('2026-06-20')
      await fillPlaces(w)
      expect(w.get('[data-test="create-trip-submit"]').attributes('disabled')).toBeDefined()
      expect(w.get('[data-test="create-trip-blocked"]').text()).toContain('transporteurs vérifiés')
    })

    it('demande bateau, interrupteur éteint : raison « pas encore ouvert »', async () => {
      mockProfile = { gpPro: true, proAccount: true }
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'BOAT' }, { road: true, boat: false })
      expect(w.get('[data-test="create-trip-blocked"]').text()).toContain("n'est pas encore ouvert")
    })

    async function fillBoat(w: Awaited<ReturnType<typeof mountWith>>, v: { volume: number | string; price: number | string; min: string; max: string }) {
      await w.find('[data-test="create-trip-date"]').setValue('2026-12-01')
      await fillPlaces(w)
      await w.find('[data-test="create-trip-volume"]').setValue(v.volume)
      await w.find('[data-test="create-trip-price-m3"]').setValue(v.price)
      await w.find('[data-test="create-trip-arrival-min"]').setValue(v.min)
      await w.find('[data-test="create-trip-arrival-max"]').setValue(v.max)
    }

    it('soumission bateau : payload au m³ avec la fourchette', async () => {
      mockProfile = { gpPro: true, proAccount: false }
      mockCreateAnnouncement.mockResolvedValue({ id: 'ann-boat', status: 'ACTIVE' })
      mockStartNegotiation.mockResolvedValue({ id: 'thread-boat' })
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'BOAT' }, { road: true, boat: true })
      await fillBoat(w, { volume: 12, price: 600, min: '2027-01-10', max: '2027-01-25' })
      await w.find('[data-test="create-trip-submit"]').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
        transportMode: 'BOAT', availableKg: null, pricePerKg: null, capacityUnit: 'KG_EXACT',
        volumeCapacityM3: 12, pricePerM3: 600, arrivalDate: '2027-01-10', arrivalDateMax: '2027-01-25',
      }))
      expect(mockStartNegotiation).toHaveBeenCalledWith(expect.objectContaining({
        travelerAnnouncementId: 'ann-boat', travelerAvailableKg: 5,
      }))
    })

    it('fourchette incohérente : soumission bloquée avec le message', async () => {
      mockProfile = { gpPro: true, proAccount: false }
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'BOAT' }, { road: true, boat: true })
      await fillBoat(w, { volume: 12, price: 600, min: '2027-01-25', max: '2027-01-10' })
      expect(w.get('[data-test="create-trip-submit"]').attributes('disabled')).toBeDefined()
      expect(w.get('[data-test="create-trip-arrival-error"]').text()).toContain('au plus tard')
    })

    it('volume ou prix manquant : soumission bloquée', async () => {
      mockProfile = { gpPro: true, proAccount: false }
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'BOAT' }, { road: true, boat: true })
      await fillBoat(w, { volume: '', price: 600, min: '2027-01-10', max: '2027-01-25' })
      expect(w.get('[data-test="create-trip-submit"]').attributes('disabled')).toBeDefined()
    })

    it('demande peu importe (null) : avion et route proposés, avion par défaut', async () => {
      const w = await mountWith({ ...fakeRequest, requestTransportMode: null }, { road: true, boat: false })
      expect(modeLabels(w)).toEqual(['Avion', 'Route'])
      expect(w.get('[data-test="create-trip-mode-PLANE"]').classes()).toContain('border-primary')
    })

    it('ancien back (champ absent), route éteinte : avion seul et envoi PLANE', async () => {
      mockCreateAnnouncement.mockResolvedValue({ id: 'ann-1', status: 'ACTIVE' })
      mockStartNegotiation.mockResolvedValue({ id: 'thread-1' })
      const w = await mountWith(fakeRequest)
      expect(modeLabels(w)).toEqual(['Avion'])
      await w.find('[data-test="create-trip-date"]').setValue('2026-06-20')
      await fillPlaces(w)
      await w.find('[data-test="create-trip-submit"]').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ transportMode: 'PLANE' }))
    })

    it('demande Route : le trajet est créé dans le mode de la demande', async () => {
      mockCreateAnnouncement.mockResolvedValue({ id: 'ann-2', status: 'ACTIVE' })
      mockStartNegotiation.mockResolvedValue({ id: 'thread-2' })
      const w = await mountWith({ ...fakeRequest, requestTransportMode: 'CAR' }, { road: true, boat: false })
      await w.find('[data-test="create-trip-date"]').setValue('2026-06-20')
      await fillPlaces(w)
      await w.find('[data-test="create-trip-submit"]').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ transportMode: 'CAR' }))
    })
  })
})
