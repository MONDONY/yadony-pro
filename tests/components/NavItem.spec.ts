import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NavItem from '@/components/layout/NavItem.vue'

// Stub NuxtLink pour les tests
const NuxtLinkStub = {
  name: 'NuxtLink',
  template: '<a :href="to" :class="$attrs.class"><slot /></a>',
  props: ['to'],
}

describe('NavItem', () => {
  it('renders label and icon slot', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/trajets', label: 'Mes Trajets' },
      slots: { icon: '<svg data-test="icon" />' },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    })
    expect(wrapper.text()).toContain('Mes Trajets')
    expect(wrapper.find('[data-test="icon"]').exists()).toBe(true)
  })

  it('shows badge count when badge prop is set and > 0', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/colis', label: 'Mes Colis', badge: 3 },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    })
    expect(wrapper.text()).toContain('3')
  })

  it('does not render badge when badge is 0', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/colis', label: 'Mes Colis', badge: 0 },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    })
    expect(wrapper.find('[data-test="badge"]').exists()).toBe(false)
  })
})
