import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({
    createAnnouncement: mockCreate,
    updateAnnouncement: mockUpdate,
    publishAnnouncement: vi.fn(),
    getTemplates: vi.fn().mockResolvedValue([]),
  }),
}))
vi.mock('@/features/trajets/services/configService', () => ({
  configService: () => ({ fetchContentCategories: vi.fn().mockResolvedValue([]) }),
}))
vi.mock('@/features/trajets/composables/useTrips', () => ({
  useTrips: () => ({ fetchTemplates: vi.fn().mockResolvedValue([]) }),
}))
vi.mock('@/features/trajets/services/tripTemplateService', () => ({
  tripTemplateService: () => ({ list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), remove: vi.fn() }),
}))
vi.mock('@/features/tarifs/composables/usePriceGrid', () => ({
  usePriceGrid: () => ({ items: ref([]), isLoading: ref(false), error: ref(null), fetchItems: vi.fn().mockResolvedValue(undefined) }),
}))
vi.mock('@/composables/useTransportModes', () => ({
  useTransportModes: () => ({ getFlags: async () => ({ road: true, boat: true }) }),
}))
vi.mock('@/composables/useApi', () => ({ useApi: () => vi.fn(), _resetApiInstance: vi.fn() }))
vi.mock('@/composables/useCommissionGrid', () => ({ useCommissionGrid: () => ({ getGrid: async () => null }) }))
vi.mock('@/stores/preferences', () => ({
  usePreferencesStore: () => ({ currency: 'EUR', loaded: true, load: async () => 'EUR', setCurrency: vi.fn() }),
}))
let mockProfile: { gpPro: boolean; proAccount: boolean } = { gpPro: true, proAccount: false }
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn(), carrierProfile: mockProfile }),
}))
vi.mock('@/features/trajets/components/GooglePlacesInput.vue', () => ({
  default: { template: '<div />', props: ['modelValue', 'placeholder', 'label', 'error'] },
}))

const place = (label: string) => ({ placeId: label, label, lat: 1, lng: 1 })
const boatTrip = {
  id: 'b1', status: 'ACTIVE', departureCity: place('Marseille'), arrivalCity: place('Dakar'),
  departureDate: '2026-12-01', departureTime: null, arrivalTime: null,
  arrivalDate: '2027-01-10', arrivalDateMax: '2027-01-25', transportMode: 'BOAT',
  pickupPlace: place('Port'), dropoffPlace: place('Port Dakar'),
  availableWeightKg: null, pricePerKg: null, volumeCapacityM3: 12, pricePerM3: 600,
  acceptedCategories: [], refusedCategories: [], senderNote: null, cashAccepted: false, handoverDeadline: '2026-11-28',
}

async function mountForm(props: Record<string, unknown> = {}) {
  const { default: NewAnnouncementForm } = await import('@/features/trajets/components/NewAnnouncementForm.vue')
  const w = mount(NewAnnouncementForm, {
    attachTo: document.body,
    props,
    global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  })
  await flushPromises()
  return w
}

const problem = (status: number, code: string, detail?: string) => Object.assign(new Error('x'), { data: { status, code, detail } })

async function publish(w: Awaited<ReturnType<typeof mountForm>>) {
  await w.get('[data-test="btn-publish"]').trigger('click')
  await flushPromises()
}

describe('NewAnnouncementForm : bateau', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = { gpPro: true, proAccount: false }
    setActivePinia(createPinia())
  })

  it('transporteur non vérifié : puce Bateau désactivée et lien PRO', async () => {
    mockProfile = { gpPro: false, proAccount: false }
    const w = await mountForm()
    expect(w.get('[data-test="transport-BOAT"]').attributes('disabled')).toBeDefined()
    expect(w.get('[data-test="transport-disabled-reason"]').text()).toContain('transporteurs vérifiés')
    expect(w.find('a[href="/upgrade"]').exists()).toBe(true)
    await w.get('[data-test="transport-BOAT"]').trigger('click')
    expect(w.find('[data-test="boat-volume"]').exists()).toBe(false)
    w.unmount()
  })

  it('transporteur vérifié : puce Bateau active, volume et prix au m³ remplacent les kilos', async () => {
    const w = await mountForm()
    expect(w.get('[data-test="transport-BOAT"]').attributes('disabled')).toBeUndefined()
    expect(w.find('[data-test="transport-disabled-reason"]').exists()).toBe(false)
    expect(w.find('[data-test="pricing-mode-MIXED"]').exists()).toBe(true)
    await w.get('[data-test="transport-BOAT"]').trigger('click')
    expect(w.find('[data-test="boat-volume"]').exists()).toBe(true)
    expect(w.find('[data-test="boat-price-m3"]').exists()).toBe(true)
    expect(w.find('[data-test="pricing-mode-MIXED"]').exists()).toBe(false)
    expect(w.find('[data-test="arrival-date-min"]').exists()).toBe(true)
    await w.get('input[type="date"]').setValue('2026-12-01')
    expect(w.get('[data-test="arrival-date-max"]').attributes('max')).toBe('2027-03-31')
    w.unmount()
  })

  it('bateau : « Enregistrer ce trajet » désactivé avec son infobulle', async () => {
    const w = await mountForm()
    await w.get('[data-test="transport-BOAT"]').trigger('click')
    const btn = w.get('[data-test="open-save-template"]')
    expect(btn.attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('un trajet bateau en édition garde sa puce même sans badge', async () => {
    mockProfile = { gpPro: false, proAccount: false }
    const w = await mountForm({ prefill: boatTrip, editTripId: 'b1' })
    expect(w.get('[data-test="transport-BOAT"]').attributes('disabled')).toBeUndefined()
    expect((w.get('[data-test="boat-volume"]').element as HTMLInputElement).value).toBe('12')
    expect((w.get('[data-test="arrival-date-max"]').element as HTMLInputElement).value).toBe('2027-01-25')
    w.unmount()
  })

  it('403 boat-carrier-not-verified : message lisible, saisie conservée', async () => {
    mockUpdate.mockRejectedValue(problem(403, 'boat-carrier-not-verified'))
    const w = await mountForm({ prefill: boatTrip, editTripId: 'b1' })
    await w.get('input[data-test="handover-deadline"]').setValue('2026-11-28')
    await w.findAll('input[type="date"]')[0]!.setValue('2026-12-01')
    await publish(w)
    expect(w.text()).toContain('réservé aux entreprises et aux transporteurs vérifiés')
    expect((w.get('[data-test="boat-volume"]').element as HTMLInputElement).value).toBe('12')
    w.unmount()
  })

  it.each([
    ['boat-price-required', 'se vend au m³'],
    ['boat-volume-required', 'Volume proposé requis'],
    ['boat-volume-unit-invalid', 'kilo libre'],
    ['arrival-range-invalid', 'Vérifiez l\'arrivée estimée'],
    ['boat-template-unsupported', 'ne s\'enregistre pas comme modèle'],
    ['transport-mode-disabled', 'pas encore ouvert'],
    ['pricing-unit-locked', 'son unité de prix ne peut plus changer'],
    ['modification-impossible', 'ne peut plus être modifié'],
  ])('erreur serveur %s : message lisible', async (code, fragment) => {
    mockUpdate.mockRejectedValue(problem(422, code))
    const w = await mountForm({ prefill: boatTrip, editTripId: 'b1' })
    await w.get('input[data-test="handover-deadline"]').setValue('2026-11-28')
    await w.findAll('input[type="date"]')[0]!.setValue('2026-12-01')
    await publish(w)
    expect(w.text()).toContain(fragment)
    w.unmount()
  })

  it('arrival-too-far : détail du serveur, sinon repli local', async () => {
    mockUpdate.mockRejectedValueOnce(problem(422, 'arrival-too-far', 'Arrivée trop lointaine (serveur)'))
    const w = await mountForm({ prefill: boatTrip, editTripId: 'b1' })
    await w.get('input[data-test="handover-deadline"]').setValue('2026-11-28')
    await w.findAll('input[type="date"]')[0]!.setValue('2026-12-01')
    await publish(w)
    expect(w.text()).toContain('Arrivée trop lointaine (serveur)')
    mockUpdate.mockRejectedValueOnce(problem(422, 'arrival-too-far'))
    await publish(w)
    expect(w.text()).toContain("L'arrivée estimée est trop éloignée du départ.")
    w.unmount()
  })

  it('publication bateau : la demande part au m³', async () => {
    mockUpdate.mockResolvedValue({ id: 'b1', status: 'ACTIVE' })
    const w = await mountForm({ prefill: boatTrip, editTripId: 'b1' })
    await w.get('input[data-test="handover-deadline"]').setValue('2026-11-28')
    await w.findAll('input[type="date"]')[0]!.setValue('2026-12-01')
    await publish(w)
    expect(mockUpdate).toHaveBeenCalledWith('b1', expect.objectContaining({
      transportMode: 'BOAT', availableKg: null, pricePerKg: null, pricePerM3: 600, volumeCapacityM3: 12,
      arrivalDate: '2027-01-10', arrivalDateMax: '2027-01-25',
    }))
    expect(w.emitted('submitted')).toBeTruthy()
    w.unmount()
  })

  it('bateau d’avant le lot 3 : formulaire en kilos', async () => {
    const legacy = { ...boatTrip, availableWeightKg: 20, pricePerKg: 8, volumeCapacityM3: null, pricePerM3: null, arrivalDateMax: null }
    const w = await mountForm({ prefill: legacy, editTripId: 'b1' })
    expect(w.find('[data-test="boat-volume"]').exists()).toBe(false)
    expect(w.find('[data-test="pricing-mode-KG"]').exists()).toBe(true)
    expect(w.find('[data-test="arrival-date-max"]').exists()).toBe(false)
    w.unmount()
  })
})
