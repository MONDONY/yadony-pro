import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LandingFaq from '@/features/landing/components/LandingFaq.vue'
import { SUBSCRIPTION_PRICING } from '@/features/abonnement/types/index'

describe('LandingFaq', () => {
  it('never claims the plan is chosen directly on the landing page (it is chosen on /upgrade, after login)', () => {
    const wrapper = mount(LandingFaq)
    expect(wrapper.text()).not.toMatch(/directement sur cette page/i)
  })

  it('answers how much yadony PRO costs, deriving the amounts from the pricing constants (never a hardcoded price)', () => {
    const wrapper = mount(LandingFaq)
    const text = wrapper.text()
    // La landing vend désormais un abonnement PAYANT : elle doit en dire le prix.
    expect(text).toContain(SUBSCRIPTION_PRICING.MONTHLY.label)
    expect(text).toContain(SUBSCRIPTION_PRICING.YEARLY.label)
  })
})
