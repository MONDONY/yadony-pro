import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingAssistant from '@/features/pricing/components/PricingAssistant.vue'
import { PRICING_CORRIDORS } from '@/features/pricing/types/index'

function mountAssistant(props: Record<string, unknown> = {}) {
  return mount(PricingAssistant, {
    props: {
      corridors: PRICING_CORRIDORS,
      marketPrice: null,
      commissionRate: 0.12,
      isLoading: false,
      ...props,
    },
  })
}

describe('PricingAssistant', () => {
  it('emits select-corridor when a corridor is chosen', async () => {
    const wrapper = mountAssistant()
    await wrapper.find('[data-test="corridor-select"]').setValue('PARIS_DAKAR')
    expect(wrapper.emitted('select-corridor')![0][0]).toBe('PARIS_DAKAR')
  })

  it('shows the market median when provided', () => {
    const wrapper = mountAssistant({ marketPrice: { median: 12.5, currency: 'EUR' } })
    expect(wrapper.find('[data-test="market-median"]').text()).toContain('12.50')
  })

  it('computes the net per kg after commission from the entered price', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    await wrapper.find('[data-test="price-input"]').setValue(10)
    expect(wrapper.find('[data-test="net-per-kg"]').text()).toContain('8.80')
  })

  it('flags a price aligned with the market', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    await wrapper.find('[data-test="price-input"]').setValue(10)
    expect(wrapper.find('[data-test="comparison"]').text()).toContain('Aligné')
  })

  it('flags a price above the market', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    await wrapper.find('[data-test="price-input"]').setValue(13)
    expect(wrapper.find('[data-test="comparison"]').text()).toContain('Au-dessus')
  })
})
