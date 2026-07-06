import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfileInfoCard from '@/features/parametres/components/ProfileInfoCard.vue'

describe('ProfileInfoCard', () => {
  it('shows name, phone, PRO badge and roles', () => {
    const wrapper = mount(ProfileInfoCard, {
      props: {
        displayName: 'Awa Diallo',
        phoneNumber: '+221770000000',
        isProAccount: true,
        roles: ['ROLE_TRAVELER'],
      },
    })
    expect(wrapper.find('[data-test="profile-name"]').text()).toBe('Awa Diallo')
    expect(wrapper.find('[data-test="profile-phone"]').text()).toBe('+221770000000')
    expect(wrapper.find('[data-test="profile-pro-badge"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('traveler')
  })

  it('falls back to "Voyageur" and hides phone / PRO badge when missing', () => {
    const wrapper = mount(ProfileInfoCard, {
      props: { displayName: null, phoneNumber: null, isProAccount: false, roles: [] },
    })
    expect(wrapper.find('[data-test="profile-name"]').text()).toBe('Voyageur')
    expect(wrapper.find('[data-test="profile-phone"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="profile-pro-badge"]').exists()).toBe(false)
  })
})
