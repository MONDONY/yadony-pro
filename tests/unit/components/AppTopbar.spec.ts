import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTopbar from '@/components/layout/AppTopbar.vue'

vi.mock('@/features/auth/composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({ signOut: vi.fn() }),
}))

vi.mock('@/features/search/composables/useGlobalSearch', () => ({
  useGlobalSearch: () => ({ open: vi.fn() }),
}))

vi.mock('@/composables/useSidebar', () => ({
  useSidebar: () => ({ toggle: vi.fn() }),
}))

describe('AppTopbar', () => {
  it('links the notification bell to the notifications page', () => {
    const wrapper = mount(AppTopbar, {
      props: { title: 'Centre de commandes' },
      global: {
        stubs: {
          NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
        },
      },
    })

    expect(wrapper.find('[data-test="topbar-notifications"]').attributes('href')).toBe('/notifications')
  })
})
