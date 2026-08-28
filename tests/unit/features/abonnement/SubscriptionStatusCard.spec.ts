import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriptionStatusCard from '@/features/abonnement/components/SubscriptionStatusCard.vue'
import type { ProSubscription } from '@/features/abonnement/types/index'

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

describe('SubscriptionStatusCard', () => {
  it('shows the French status label, cycle and due date, and the portal button for a Stripe subscription', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription() },
    })
    expect(wrapper.find('[data-test="subscription-status-label"]').text()).toBe('Actif')
    expect(wrapper.find('[data-test="subscription-status-cycle"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="subscription-status-period-end"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="subscription-status-portal-button"]').exists()).toBe(true)
  })

  it('shows a cancellation notice when cancelAtPeriodEnd is true', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ cancelAtPeriodEnd: true }) },
    })
    expect(wrapper.find('[data-test="subscription-status-cancel-notice"]').exists()).toBe(true)
  })

  it('hides the cancellation notice when cancelAtPeriodEnd is false', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ cancelAtPeriodEnd: false }) },
    })
    expect(wrapper.find('[data-test="subscription-status-cancel-notice"]').exists()).toBe(false)
  })

  it('hides the cycle when there is none', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ billingCycle: null }) },
    })
    expect(wrapper.find('[data-test="subscription-status-cycle"]').exists()).toBe(false)
  })

  it('hides the due date when there is none', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ currentPeriodEnd: null }) },
    })
    expect(wrapper.find('[data-test="subscription-status-period-end"]').exists()).toBe(false)
  })

  it('hides the portal button when no paid subscription is attached (no subscription at all)', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: null },
    })
    expect(wrapper.find('[data-test="subscription-status-portal-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="subscription-status-label"]').text()).toBe('Aucun abonnement')
  })

  it('hides the portal button when the subscription is not a Stripe customer (admin grant)', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ source: 'ADMIN_GRANT', status: 'ACTIVE' }) },
    })
    expect(wrapper.find('[data-test="subscription-status-portal-button"]').exists()).toBe(false)
  })

  it('emits manage-portal when the portal button is clicked', async () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription() },
    })
    await wrapper.find('[data-test="subscription-status-portal-button"]').trigger('click')
    expect(wrapper.emitted('manage-portal')).toHaveLength(1)
  })
})
