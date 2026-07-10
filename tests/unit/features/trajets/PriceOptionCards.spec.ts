// tests/unit/features/trajets/PriceOptionCards.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceOptionCards from '@/features/trajets/components/PriceOptionCards.vue'

describe('PriceOptionCards', () => {
  it('affiche le net par défaut avec la commission de 12 %', () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7 },
    })
    // 8 €/kg → 7.04 net avec 12 %
    expect(wrapper.text()).toContain('7.04')
  })

  it('affiche le net selon le taux de commission passé en prop', () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7, commissionRate: 0.2 },
    })
    // 8 €/kg → 6.40 net avec 20 %
    expect(wrapper.text()).toContain('6.40')
    expect(wrapper.text()).not.toContain('7.04')
  })

  it('émet update:modelValue au clic sur une option', async () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7 },
    })
    await wrapper.find('[data-test="price-5"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([5])
  })
})
