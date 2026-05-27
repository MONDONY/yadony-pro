import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicProfilePreview from '@/features/profil-public/components/PublicProfilePreview.vue'

const base = {
  userId: 'u1',
  displayName: 'Awa Diallo',
  avatarUrl: null,
  kycVerified: true,
  isProAccount: true,
  isKiloPro: true,
  completedBidsCount: 12,
  averageRating: 4.8,
  ratingCount: 9,
  memberSince: '2025-01-15',
  badges: ['Ambassadeur'],
  contactMode: null,
  responseDelayHours: null,
}

describe('PublicProfilePreview', () => {
  it('renders name, completed deliveries and rating', () => {
    const wrapper = mount(PublicProfilePreview, { props: { profile: base } })
    expect(wrapper.find('[data-test="pp-name"]').text()).toBe('Awa Diallo')
    expect(wrapper.find('[data-test="pp-completed"]').text()).toBe('12')
    expect(wrapper.find('[data-test="pp-rating"]').text()).toContain('4.8')
  })

  it('highlights the Kilo Pro and KYC badges when present', () => {
    const wrapper = mount(PublicProfilePreview, { props: { profile: base } })
    expect(wrapper.find('[data-test="pp-kilopro"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="pp-kyc"]').exists()).toBe(true)
  })

  it('hides the Kilo Pro badge and shows "Pas encore noté" without ratings', () => {
    const wrapper = mount(PublicProfilePreview, {
      props: { profile: { ...base, isKiloPro: false, ratingCount: 0 } },
    })
    expect(wrapper.find('[data-test="pp-kilopro"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="pp-rating"]').text()).toContain('Pas encore noté')
  })
})
