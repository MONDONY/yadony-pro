import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const catalogSample = [
  { code: 'DOCUMENTS', label: 'Documents & administratif', emoji: '📄' },
  { code: 'PRODUITS_FRAIS', label: 'Produits frais / périssables', emoji: '🐟' },
  { code: 'VETEMENTS', label: 'Vêtements & tissus', emoji: '👗' },
]

const mockFetchContentCategories = vi.fn()

vi.mock('@/features/trajets/services/configService', () => ({
  configService: () => ({ fetchContentCategories: mockFetchContentCategories }),
}))

vi.mock('@/features/trajets/composables/useTrips', () => ({
  useTrips: () => ({ fetchTemplates: vi.fn().mockResolvedValue([]) }),
}))

vi.mock('@/features/trajets/services/tripTemplateService', () => ({
  tripTemplateService: () => ({
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
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

async function mountForm() {
  const { default: NewAnnouncementForm } = await import(
    '@/features/trajets/components/NewAnnouncementForm.vue'
  )
  const wrapper = mount(NewAnnouncementForm, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('NewAnnouncementForm — catalogue de contenus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockFetchContentCategories.mockResolvedValue(catalogSample)
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
})
