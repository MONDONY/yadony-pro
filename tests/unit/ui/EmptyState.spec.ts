import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { EmptyState } from '@/components/ui/empty-state'

const StubIcon = { render: () => h('svg', { 'data-test': 'icon' }) }

describe('EmptyState', () => {
  it('renders title and description', () => {
    const w = mount(EmptyState, { props: { title: 'Aucun trajet', description: 'Créez votre premier trajet.' } })
    expect(w.text()).toContain('Aucun trajet')
    expect(w.text()).toContain('Créez votre premier trajet.')
  })

  it('renders a line icon (never an emoji) when provided', () => {
    const w = mount(EmptyState, { props: { title: 'x', icon: StubIcon } })
    expect(w.find('[data-test="icon"]').exists()).toBe(true)
  })

  it('renders an action slot', () => {
    const w = mount(EmptyState, { props: { title: 'x' }, slots: { default: '<button>Créer</button>' } })
    expect(w.find('button').exists()).toBe(true)
  })
})
