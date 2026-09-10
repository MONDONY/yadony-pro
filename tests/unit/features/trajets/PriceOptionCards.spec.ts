// tests/unit/features/trajets/PriceOptionCards.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceOptionCards from '@/features/trajets/components/PriceOptionCards.vue'

const compact = (t: string) => t.replace(/[\s  ]/g, '')

describe('PriceOptionCards', () => {
  it('affiche le net par défaut avec la commission de 12 %', () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7 },
    })
    // 8 €/kg → 7,04 € net avec 12 % (format français)
    expect(compact(wrapper.text())).toContain('7,04€')
  })

  it('affiche le net selon le taux de commission passé en prop', () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7, commissionRate: 0.2 },
    })
    // 8 €/kg → 6,40 € net avec 20 %
    expect(compact(wrapper.text())).toContain('6,40€')
    expect(compact(wrapper.text())).not.toContain('7,04€')
  })

  it('propose des paliers ronds et des nets sans centime en francs CFA', () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 5000, currency: 'XOF' },
    })
    expect(wrapper.find('[data-test="price-5000"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="price-7"]').exists()).toBe(false)
    // 5 000 F CFA/kg → 4 400 F CFA nets avec 12 %
    expect(compact(wrapper.text())).toContain('5000FCFA→4400FCFAnets')
    expect(wrapper.text()).not.toContain('€')
  })

  it('émet update:modelValue au clic sur une option', async () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7 },
    })
    await wrapper.find('[data-test="price-5"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([5])
  })
})
