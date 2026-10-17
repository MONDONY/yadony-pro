import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicProfilePreview from '@/features/profil-public/components/PublicProfilePreview.vue'

const base = {
  userId: 'u1',
  displayName: 'Awa Diallo',
  avatarUrl: null,
  kycVerified: true,
  isProAccount: true,
  gpPro: true,
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

  it('highlights the GP Pro and KYC badges when present', () => {
    const wrapper = mount(PublicProfilePreview, { props: { profile: base } })
    const badge = wrapper.find('[data-test="pp-gppro"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('GP Pro')
    expect(badge.attributes('title')).toBe("Voyageur régulier reconnu par l'équipe Yadony")
    expect(wrapper.find('[data-test="pp-kyc"]').exists()).toBe(true)
  })

  it('hides the GP Pro badge and shows "Pas encore noté" without ratings', () => {
    const wrapper = mount(PublicProfilePreview, {
      props: { profile: { ...base, gpPro: false, ratingCount: 0 } },
    })
    expect(wrapper.find('[data-test="pp-gppro"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="pp-rating"]').text()).toContain('Pas encore noté')
  })

  it('hides the GP Pro badge when an older backend omits gpPro', () => {
    const { gpPro: _omitted, ...legacy } = base
    const wrapper = mount(PublicProfilePreview, { props: { profile: legacy } })
    expect(wrapper.find('[data-test="pp-gppro"]').exists()).toBe(false)
  })
})
