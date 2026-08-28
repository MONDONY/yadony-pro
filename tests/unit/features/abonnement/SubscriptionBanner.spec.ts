import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriptionBanner from '@/features/abonnement/components/SubscriptionBanner.vue'
import type { ProSubscription } from '@/features/abonnement/types/index'

const DAY_MS = 24 * 60 * 60 * 1000

function buildSubscription(overrides: Partial<ProSubscription> = {}): ProSubscription {
  return {
    active: true,
    status: 'ACTIVE',
    source: 'STRIPE',
    billingCycle: 'MONTHLY',
    currentPeriodEnd: '2026-09-26T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    graceExpiresAt: null,
    ...overrides,
  }
}

function isoInDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

describe('SubscriptionBanner', () => {
  it('renders nothing when there is no subscription', () => {
    const wrapper = mount(SubscriptionBanner, { props: { subscription: null } })
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('renders nothing for an active subscription', () => {
    const wrapper = mount(SubscriptionBanner, {
      props: { subscription: buildSubscription({ status: 'ACTIVE' }) },
    })
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('renders nothing for a canceled or expired subscription', () => {
    const canceled = mount(SubscriptionBanner, {
      props: { subscription: buildSubscription({ status: 'CANCELED' }) },
    })
    const expired = mount(SubscriptionBanner, {
      props: { subscription: buildSubscription({ status: 'EXPIRED' }) },
    })
    expect(canceled.find('[data-test="subscription-banner"]').exists()).toBe(false)
    expect(expired.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('shows a danger banner for a past due subscription', () => {
    const wrapper = mount(SubscriptionBanner, {
      props: { subscription: buildSubscription({ status: 'PAST_DUE' }) },
    })
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.classes().join(' ')).toContain('danger')
  })

  it('shows a warning banner with the days remaining when the legacy grace ends in fewer than 7 days', () => {
    const wrapper = mount(SubscriptionBanner, {
      props: {
        subscription: buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(3) }),
      },
    })
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.classes().join(' ')).toContain('warning')
    expect(wrapper.find('[data-test="subscription-banner-days"]').text()).toContain('3')
  })

  it('shows the banner at the boundary of 7 days remaining', () => {
    const wrapper = mount(SubscriptionBanner, {
      props: {
        subscription: buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(7) }),
      },
    })
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.exists()).toBe(true)
    expect(wrapper.find('[data-test="subscription-banner-days"]').text()).toContain('7')
  })

  it('hides the banner just past the boundary, at 8 days remaining', () => {
    const wrapper = mount(SubscriptionBanner, {
      props: {
        subscription: buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(8) }),
      },
    })
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('hides the banner when the legacy grace has no known expiry date', () => {
    const wrapper = mount(SubscriptionBanner, {
      props: {
        subscription: buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: null }),
      },
    })
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })
})
