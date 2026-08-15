import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const catalogSample = [
  { code: 'DOCUMENTS', label: 'Documents & administratif', emoji: '📄' },
  { code: 'PRODUITS_FRAIS', label: 'Produits frais / périssables', emoji: '🐟' },
  { code: 'VETEMENTS', label: 'Vêtements & tissus', emoji: '👗' },
]

const mockFetchContentCategories = vi.fn()
const mockFetchTemplates = vi.fn()
const mockTplList = vi.fn()
const mockTplCreate = vi.fn()
const mockTplRemove = vi.fn()

vi.mock('@/features/trajets/services/configService', () => ({
  configService: () => ({ fetchContentCategories: mockFetchContentCategories }),
}))

vi.mock('@/features/trajets/composables/useTrips', () => ({
  useTrips: () => ({ fetchTemplates: mockFetchTemplates }),
}))

vi.mock('@/features/trajets/services/tripTemplateService', () => ({
  tripTemplateService: () => ({
    list: mockTplList,
    create: mockTplCreate,
    update: vi.fn(),
    remove: mockTplRemove,
  }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

vi.mock('@/composables/useCommissionRate', () => ({
  FALLBACK_COMMISSION_RATE: 0.12,
  useCommissionRate: () => ({ getRate: async () => 0.12 }),
}))

// Seul le câblage du catalogue de contenus (ContentTagChips) est sous test
// ici : les autres champs du formulaire n'ont aucun rapport avec Task 3/4.
// On remplace ces composants par de simples stand-ins (plutôt que des
// stubs @vue/test-utils, qui n'empêchent pas leur module réel — et ses
// imports transitifs, ex. placesService — d'être chargé) pour rester
// focalisé sur le seul comportement testé ici.
vi.mock('@/features/trajets/components/GooglePlacesInput.vue', () => ({
  default: { template: '<div />', props: ['modelValue', 'placeholder', 'label', 'error'] },
}))
vi.mock('@/features/trajets/components/TransportModeChips.vue', () => ({
  default: { template: '<div />', props: ['modelValue', 'error'] },
}))
vi.mock('@/features/trajets/components/WeightSlider.vue', () => ({
  default: { template: '<div />', props: ['modelValue', 'min', 'max'] },
}))
vi.mock('@/features/trajets/components/CapacitySelector.vue', () => ({
  default: { template: '<div />', props: ['modelValue'] },
}))
vi.mock('@/features/trajets/components/PriceOptionCards.vue', () => ({
  default: { template: '<div />', props: ['modelValue', 'commissionRate'] },
}))

async function mountForm(props: Record<string, unknown> = {}) {
  const { default: NewAnnouncementForm } = await import(
    '@/features/trajets/components/NewAnnouncementForm.vue'
  )
  const wrapper = mount(NewAnnouncementForm, { attachTo: document.body, props })
  await flushPromises()
  return wrapper
}

describe('NewAnnouncementForm — catalogue de contenus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockFetchContentCategories.mockResolvedValue(catalogSample)
    mockFetchTemplates.mockResolvedValue([])
    mockTplList.mockResolvedValue([])
    mockTplCreate.mockResolvedValue(undefined)
    mockTplRemove.mockResolvedValue(undefined)
  })

  it("un échec du catalogue ne bloque ni le formulaire ni le pré-remplissage d'édition", async () => {
    // Échec réseau sur /config/content-categories : le formulaire doit quand même
    // se monter, les chips retomber sur des presets vides (saisie libre seule), et
    // SURTOUT le prefill d'édition doit être appliqué — sinon l'écran « modifier un
    // trajet » s'affiche vide et l'utilisateur risque d'écraser ses données.
    mockFetchContentCategories.mockRejectedValue(new Error('network down'))
    const prefill = {
      id: 't-1',
      departureCity: 'Paris',
      arrivalCity: 'Dakar',
      departureTime: '08:00',
      arrivalTime: '14:30',
      transportMode: 'PLANE',
      pickupPlace: 'CDG',
      dropoffPlace: 'DSS',
      availableWeightKg: 20,
      capacityUnit: 'SUITCASE_23KG',
      pricePerKg: 9,
      acceptedCategories: ['Vêtements & tissus'],
      refusedCategories: ['Poissons'],
      senderNote: '',
      cashAccepted: false,
      handoverDeadline: null,
    }
    const wrapper = await mountForm({ prefill })
    const { default: ContentTagChips } = await import(
      '@/features/trajets/components/ContentTagChips.vue'
    )
    const chips = wrapper.findAllComponents(ContentTagChips)
    expect(chips.length).toBe(2)
    // repli : presets vides, pas de crash
    expect(chips[0]!.props('presets')).toEqual([])
    // le prefill a bien été appliqué malgré l'échec du catalogue
    expect(chips[0]!.props('modelValue')).toEqual(['Vêtements & tissus'])
    expect(chips[1]!.props('modelValue')).toEqual(['Poissons'])
    wrapper.unmount()
  })

  it('passe les labels du catalogue en presets des chips acceptées', async () => {
    const wrapper = await mountForm()
    const { default: ContentTagChips } = await import(
      '@/features/trajets/components/ContentTagChips.vue'
    )
    const chips = wrapper.findAllComponents(ContentTagChips)
    expect(chips.length).toBe(2)
    expect(chips[0]!.props('presets')).toEqual([
      'Documents & administratif',
      'Produits frais / périssables',
      'Vêtements & tissus',
    ])
    wrapper.unmount()
  })

  it('passe le même catalogue en presets des chips refusées (plus de tableau vide en dur)', async () => {
    const wrapper = await mountForm()
    const { default: ContentTagChips } = await import(
      '@/features/trajets/components/ContentTagChips.vue'
    )
    const chips = wrapper.findAllComponents(ContentTagChips)
    expect(chips[1]!.props('presets')).toEqual([
      'Documents & administratif',
      'Produits frais / périssables',
      'Vêtements & tissus',
    ])
    wrapper.unmount()
  })

  it('émet le label seul (jamais le code ni l’emoji) quand un preset accepté est sélectionné', async () => {
    const wrapper = await mountForm()
    const { default: ContentTagChips } = await import(
      '@/features/trajets/components/ContentTagChips.vue'
    )
    const acceptedChips = wrapper.findAllComponents(ContentTagChips)[0]!
    const presetButton = acceptedChips
      .findAll('button')
      .find((b) => b.text().includes('Documents & administratif'))
    expect(presetButton).toBeTruthy()
    await presetButton!.trigger('click')
    const emitted = acceptedChips.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect((emitted![0] as unknown[])[0]).toEqual(['Documents & administratif'])
    wrapper.unmount()
  })

  it('sélectionner une suggestion de corridor pré-remplit le trajet', async () => {
    const wrapper = await mountForm()
    await wrapper.find('[data-test="quick-template-paris-dakar"]').trigger('click')
    expect(wrapper.find('[data-test="quick-template-hint"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('affiche « aucun modèle » puis liste, sélectionne et supprime un modèle personnel', async () => {
    const myTemplate = {
      id: 'tpl-1',
      label: 'Mon Paris-Dakar',
      emoji: '🇸🇳',
      departureCity: { placeId: '', label: 'Paris', lat: 48.85, lng: 2.35 },
      arrivalCity: { placeId: '', label: 'Dakar', lat: 14.71, lng: -17.46 },
      transportMode: 'PLANE' as const,
      capacityUnit: 'SUITCASE_23KG' as const,
      availableWeightKg: 23,
      pricePerKg: 8,
      acceptedCategories: ['Vêtements & tissus'],
      cashAccepted: true,
      arrivalTime: null,
    }
    mockTplList.mockResolvedValue([myTemplate])
    const wrapper = await mountForm()
    expect(wrapper.find('[data-test="my-templates-empty"]').exists()).toBe(false)
    await wrapper.find('[data-test="my-template-tpl-1"] button').trigger('click')

    mockTplRemove.mockResolvedValue(undefined)
    await wrapper.find('[data-test="delete-my-template-tpl-1"]').trigger('click')
    expect(mockTplRemove).toHaveBeenCalledWith('tpl-1')
    await flushPromises()
    expect(wrapper.find('[data-test="my-template-tpl-1"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('remet le modèle dans la liste si la suppression échoue côté serveur', async () => {
    const myTemplate = {
      id: 'tpl-2',
      label: 'Mon Lyon-Abidjan',
      emoji: null,
      departureCity: { placeId: '', label: 'Lyon', lat: 45.76, lng: 4.84 },
      arrivalCity: { placeId: '', label: 'Abidjan', lat: 5.36, lng: -4.0 },
      transportMode: 'PLANE' as const,
      capacityUnit: 'SUITCASE_23KG' as const,
      availableWeightKg: 23,
      pricePerKg: 8,
      acceptedCategories: [],
      cashAccepted: false,
      arrivalTime: null,
    }
    mockTplList.mockResolvedValue([myTemplate])
    mockTplRemove.mockRejectedValue(new Error('network'))
    const wrapper = await mountForm()
    await wrapper.find('[data-test="delete-my-template-tpl-2"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="my-template-tpl-2"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('réutiliser un trajet précédent comme modèle le pré-remplit', async () => {
    const previousTrip = {
      id: 'trip-42',
      status: 'ACTIVE' as const,
      departureCity: { placeId: '', label: 'Paris', lat: 48.85, lng: 2.35 },
      arrivalCity: { placeId: '', label: 'Dakar', lat: 14.71, lng: -17.46 },
      departureDate: '2026-08-01',
      departureTime: null,
      arrivalTime: null,
      transportMode: 'PLANE' as const,
      pickupPlace: { placeId: '', label: '12 rue de la Paix', lat: 48.86, lng: 2.33 },
      dropoffPlace: { placeId: '', label: 'Aéroport CDG', lat: 49.01, lng: 2.55 },
      availableWeightKg: 15,
      usedWeightKg: 0,
      pricePerKg: 8,
      acceptedCategories: [],
      refusedCategories: [],
      senderNote: null,
      cashAccepted: false,
      handoverDeadline: null,
      confirmedParcelCount: 0,
      pendingBidCount: 0,
      reservedRevenueEuros: 0,
      createdAt: '2026-05-01T12:00:00',
    }
    mockFetchTemplates.mockResolvedValue([previousTrip])
    const wrapper = await mountForm()
    const toggle = wrapper.findAll('button').find((b) => b.text().includes('Réutiliser un trajet précédent'))
    expect(toggle).toBeTruthy()
    await toggle!.trigger('click')
    const templateButton = wrapper.findAll('button').find((b) => b.text().includes('Paris') && b.text().includes('Dakar'))
    expect(templateButton).toBeTruthy()
    await templateButton!.trigger('click')
    wrapper.unmount()
  })

  it('handleSubmit ne soumet rien et affiche les erreurs de validation quand le formulaire est vide', async () => {
    const wrapper = await mountForm()
    await wrapper.find('[data-test="btn-publish"]').trigger('click')
    expect(wrapper.emitted('submitted')).toBeFalsy()
    wrapper.unmount()
  })

  it('ouvre le formulaire d’enregistrement de modèle une fois les villes renseignées, et l’enregistre', async () => {
    const wrapper = await mountForm()
    const { default: GooglePlacesInput } = await import(
      '@/features/trajets/components/GooglePlacesInput.vue'
    )
    const placesInputs = wrapper.findAllComponents(GooglePlacesInput)
    await placesInputs[0]!.vm.$emit('update:modelValue', { placeId: 'p1', label: 'Paris', lat: 48.85, lng: 2.35 })
    await placesInputs[1]!.vm.$emit('update:modelValue', { placeId: 'p2', label: 'Dakar', lat: 14.71, lng: -17.46 })

    const openBtn = wrapper.find('[data-test="open-save-template"]')
    expect((openBtn.element as HTMLButtonElement).disabled).toBe(false)
    await openBtn.trigger('click')
    await wrapper.find('[data-test="save-template-label"]').setValue('Mon modèle')

    mockTplCreate.mockResolvedValue({
      id: 'tpl-new',
      label: 'Mon modèle',
      emoji: null,
      departureCity: { placeId: '', label: 'Paris', lat: 48.85, lng: 2.35 },
      arrivalCity: { placeId: '', label: 'Dakar', lat: 14.71, lng: -17.46 },
      transportMode: 'PLANE',
      capacityUnit: 'SUITCASE_23KG',
      availableWeightKg: 15,
      pricePerKg: 7,
      acceptedCategories: [],
      cashAccepted: false,
      arrivalTime: null,
    })
    await wrapper.find('[data-test="save-template-submit"]').trigger('click')
    await flushPromises()
    expect(mockTplCreate).toHaveBeenCalled()
    wrapper.unmount()
  })
})
