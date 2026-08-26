import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const mocks = vi.hoisted(() => ({
  openSearch: vi.fn(),
  signOut: vi.fn(),
  toggleSidebar: vi.fn(),
}))

vi.mock('@/features/auth/composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({ signOut: mocks.signOut }),
}))

vi.mock('@/features/search/composables/useGlobalSearch', () => ({
  useGlobalSearch: () => ({ open: mocks.openSearch }),
}))

vi.mock('@/composables/useSidebar', () => ({
  useSidebar: () => ({ toggle: mocks.toggleSidebar }),
}))

describe('AppTopbar', () => {
  function mountTopbar() {
    mocks.openSearch.mockClear()
    mocks.signOut.mockClear()
    mocks.toggleSidebar.mockClear()

    return mount(AppTopbar, {
      props: { title: 'Centre de commandes', subtitle: 'Aujourd’hui' },
      global: {
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })
  }

  it('links the notification bell to the notifications page', () => {
    const wrapper = mountTopbar()

    expect(wrapper.find('[data-test="topbar-notifications"]').attributes('href')).toBe('/notifications')
  })

  it('triggers topbar actions from the visible controls', async () => {
    const wrapper = mountTopbar()

    await wrapper.find('[data-test="topbar-menu"]').trigger('click')
    await wrapper.find('[data-test="topbar-search"]').trigger('click')
    await wrapper.find('[data-test="topbar-search-icon"]').trigger('click')
    await wrapper.findAll('button').at(-1)?.trigger('click')

    expect(wrapper.text()).toContain('Centre de commandes')
    expect(wrapper.text()).toContain('Aujourd’hui')
    expect(mocks.toggleSidebar).toHaveBeenCalledOnce()
    expect(mocks.openSearch).toHaveBeenCalledTimes(2)
    expect(mocks.signOut).toHaveBeenCalledOnce()
  })
})
