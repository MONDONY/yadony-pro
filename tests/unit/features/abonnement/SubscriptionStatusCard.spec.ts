import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriptionStatusCard from '@/features/abonnement/components/SubscriptionStatusCard.vue'
import type { ProSubscription } from '@/features/abonnement/types/index'

const NuxtLink = {
  name: 'NuxtLink',
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

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

  it('shows a dedicated billing-cycle label, never the catalogue price (a legacy or promo subscriber may not pay the current rate)', () => {
    const monthly = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ billingCycle: 'MONTHLY' }) },
    })
    expect(monthly.find('[data-test="subscription-status-cycle"]').text()).toBe('Mensuel')

    const yearly = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ billingCycle: 'YEARLY' }) },
    })
    expect(yearly.find('[data-test="subscription-status-cycle"]').text()).toBe('Annuel')
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
      global: { stubs: { NuxtLink } },
    })
    expect(wrapper.find('[data-test="subscription-status-portal-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="subscription-status-label"]').text()).toBe('Aucun abonnement')
    // Sans client Stripe, l'utilisateur n'a physiquement aucun autre moyen de
    // payer depuis le portail : ce lien vers /upgrade doit exister.
    expect(wrapper.find('[data-test="subscription-status-upgrade-link"]').exists()).toBe(true)
  })

  it('hides the portal button when the subscription is not a Stripe customer (admin grant), but offers a link to subscribe', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ source: 'ADMIN_GRANT', status: 'ACTIVE' }) },
      global: { stubs: { NuxtLink } },
    })
    expect(wrapper.find('[data-test="subscription-status-portal-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="subscription-status-upgrade-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="subscription-status-upgrade-link"]').attributes('href')).toBe('/upgrade')
  })

  it('hides the upgrade link when a Stripe subscription is already attached', () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription({ source: 'STRIPE' }) },
      global: { stubs: { NuxtLink } },
    })
    expect(wrapper.find('[data-test="subscription-status-upgrade-link"]').exists()).toBe(false)
  })

  it('emits manage-portal when the portal button is clicked', async () => {
    const wrapper = mount(SubscriptionStatusCard, {
      props: { subscription: buildSubscription() },
    })
    await wrapper.find('[data-test="subscription-status-portal-button"]').trigger('click')
    expect(wrapper.emitted('manage-portal')).toHaveLength(1)
  })
})
