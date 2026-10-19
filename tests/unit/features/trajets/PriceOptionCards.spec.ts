// tests/unit/features/trajets/PriceOptionCards.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceOptionCards from '@/features/trajets/components/PriceOptionCards.vue'

const compact = (t: string) => t.replace(/[\s  ]/g, '')

describe('PriceOptionCards', () => {
  it('affiche les paliers du prix net au kilo, sans aucune déduction ni pourcentage', () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7 },
    })
    expect(compact(wrapper.text())).toContain('5,00€')
    expect(compact(wrapper.text())).toContain('8,00€')
    expect(wrapper.text()).toContain('net par kg')
    expect(wrapper.text()).not.toContain('%')
    // L'ancien aperçu « 8 € → 7,04 € nets » déduisait une commission du prix saisi.
    expect(compact(wrapper.text())).not.toContain('7,04€')
  })

  it('propose des paliers ronds sans centime en francs CFA', () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 5000, currency: 'XOF' },
    })
    expect(wrapper.find('[data-test="price-5000"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="price-7"]').exists()).toBe(false)
    expect(compact(wrapper.text())).toContain('5000FCFA')
    expect(wrapper.text()).not.toContain('€')
  })

  it('émet update:modelValue au clic sur une option', async () => {
    const wrapper = mount(PriceOptionCards, {
      props: { modelValue: 7 },
    })
    await wrapper.find('[data-test="price-5"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([5])
  })

  it('affiche l’erreur transmise', () => {
    const wrapper = mount(PriceOptionCards, { props: { modelValue: 7, error: 'Prix invalide' } })
    expect(wrapper.text()).toContain('Prix invalide')
  })
})
