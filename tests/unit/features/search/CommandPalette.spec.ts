// tests/unit/features/search/CommandPalette.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const state = {
  isOpen: ref(true),
  query: ref(''),
  results: ref({ colis: [], trajets: [], tracking: null }),
  isLoading: ref(false),
  navShortcuts: ref([
    { id: 'nav-cockpit', type: 'navigation', title: 'Cockpit', to: '/cockpit' },
    { id: 'nav-colis', type: 'navigation', title: 'Colis', to: '/colis' },
  ]),
  open: vi.fn(),
  close: vi.fn(),
  toggle: vi.fn(),
}

vi.mock('@/features/search/composables/useGlobalSearch', () => ({
  useGlobalSearch: () => state,
}))

async function mountPalette() {
  const { default: CommandPalette } = await import('@/features/search/components/CommandPalette.vue')
  return mount(CommandPalette, { global: { stubs: { teleport: true } } })
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.isOpen.value = true
    state.query.value = ''
    state.results.value = { colis: [], trajets: [], tracking: null }
    state.isLoading.value = false
  })

  it('ne rend rien quand isOpen est faux', async () => {
    state.isOpen.value = false
    const wrapper = await mountPalette()
    expect(wrapper.find('[data-test="command-palette"]').exists()).toBe(false)
  })

  it('affiche le champ de recherche et les raccourcis de navigation', async () => {
    const wrapper = await mountPalette()
    expect(wrapper.find('[data-test="palette-input"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cockpit')
    expect(wrapper.text()).toContain('Colis')
  })

  it('affiche les résultats colis/trajets/tracking par section', async () => {
    state.results.value = {
      colis: [{ id: 'b1', type: 'colis', title: 'Alice — Vêtements', subtitle: 'Paris → Dakar', to: '/colis?bid=b1' }],
      trajets: [{ id: 't1', type: 'trajet', title: 'Paris → Dakar', subtitle: '1 août', to: '/trajets/t1' }],
      tracking: { id: 'b2', type: 'tracking', title: 'DON-42X', subtitle: 'En transit', to: '/colis?bid=b2' },
    }
    const wrapper = await mountPalette()
    expect(wrapper.text()).toContain('Alice — Vêtements')
    expect(wrapper.text()).toContain('Paris → Dakar')
    expect(wrapper.text()).toContain('DON-42X')
  })

  it('navigue et ferme au clic sur un résultat', async () => {
    state.results.value = {
      colis: [{ id: 'b1', type: 'colis', title: 'Alice', to: '/colis?bid=b1' }],
      trajets: [],
      tracking: null,
    }
    const wrapper = await mountPalette()
    await wrapper.find('[data-test="palette-item-b1"]').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/colis?bid=b1')
    expect(state.close).toHaveBeenCalled()
  })

  it('Escape ferme la palette', async () => {
    const wrapper = await mountPalette()
    await wrapper.find('[data-test="palette-input"]').trigger('keydown', { key: 'Escape' })
    expect(state.close).toHaveBeenCalled()
  })

  it('Enter navigue vers l’élément sélectionné (premier par défaut)', async () => {
    state.results.value = {
      colis: [{ id: 'b1', type: 'colis', title: 'Alice', to: '/colis?bid=b1' }],
      trajets: [],
      tracking: null,
    }
    state.query.value = 'Al'
    const wrapper = await mountPalette()
    await wrapper.find('[data-test="palette-input"]').trigger('keydown', { key: 'Enter' })
    expect(pushMock).toHaveBeenCalledWith('/colis?bid=b1')
  })

  it('ArrowDown déplace la sélection puis Enter navigue vers le second', async () => {
    state.results.value = {
      colis: [
        { id: 'b1', type: 'colis', title: 'Alice', to: '/colis?bid=b1' },
        { id: 'b2', type: 'colis', title: 'Bob', to: '/colis?bid=b2' },
      ],
      trajets: [],
      tracking: null,
    }
    state.query.value = 'x'
    const wrapper = await mountPalette()
    const input = wrapper.find('[data-test="palette-input"]')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    expect(pushMock).toHaveBeenCalledWith('/colis?bid=b2')
  })

  it('affiche un état vide quand la recherche ne donne rien', async () => {
    state.query.value = 'zzzz'
    state.navShortcuts.value = []
    const wrapper = await mountPalette()
    expect(wrapper.find('[data-test="palette-empty"]').exists()).toBe(true)
  })
})
