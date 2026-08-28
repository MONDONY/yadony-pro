import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingCard from '@/features/abonnement/components/PricingCard.vue'
import { SUBSCRIPTION_PRICING } from '@/features/abonnement/types/index'

describe('PricingCard', () => {
  it('shows the monthly price and hides the savings mention', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'MONTHLY' },
    })
    expect(wrapper.find('[data-test="pricing-card-price"]').text()).toContain(
      SUBSCRIPTION_PRICING.MONTHLY.label,
    )
    expect(wrapper.find('[data-test="pricing-card-savings"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="pricing-card-featured-badge"]').exists()).toBe(false)
  })

  it('shows the yearly price and the savings mention', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'YEARLY' },
    })
    expect(wrapper.find('[data-test="pricing-card-price"]').text()).toContain(
      SUBSCRIPTION_PRICING.YEARLY.label,
    )
    expect(wrapper.find('[data-test="pricing-card-savings"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="pricing-card-savings"]').text()).toMatch(/mois/i)
  })

  it('shows the featured badge only when featured is true', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'YEARLY', featured: true },
    })
    expect(wrapper.find('[data-test="pricing-card-featured-badge"]').exists()).toBe(true)
  })

  it('emits subscribe with the cycle when the button is clicked', async () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'MONTHLY' },
    })
    await wrapper.find('[data-test="pricing-card-subscribe-button"]').trigger('click')
    expect(wrapper.emitted('subscribe')).toEqual([['MONTHLY']])
  })

  it('disables the button while loading', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'MONTHLY', isLoading: true },
    })
    expect(wrapper.find('[data-test="pricing-card-subscribe-button"]').attributes('disabled')).toBeDefined()
  })
})
