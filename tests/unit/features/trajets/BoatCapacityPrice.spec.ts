import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BoatCapacityPrice from '@/features/trajets/components/BoatCapacityPrice.vue'

const norm = (s: string) => s.replace(/[  ]/g, ' ')

describe('BoatCapacityPrice', () => {
  it('affiche le net au m³ dans la devise du trajet', () => {
    const w = mount(BoatCapacityPrice, { props: { volume: 12, price: 600, currency: 'EUR' } })
    expect(norm(w.text())).toContain('600,00 €/m³')
  })

  it('émet le volume et le prix saisis, null pour un champ vidé', async () => {
    const w = mount(BoatCapacityPrice, { props: { volume: null, price: null, currency: 'EUR' } })
    await w.get('[data-test="boat-volume"]').setValue('4.5')
    await w.get('[data-test="boat-price-m3"]').setValue('600')
    expect(w.emitted('update:volume')![0]).toEqual([4.5])
    expect(w.emitted('update:price')![0]).toEqual([600])
    await w.get('[data-test="boat-volume"]').setValue('')
    expect(w.emitted('update:volume')![1]).toEqual([null])
  })

  it('affiche les erreurs reçues', () => {
    const w = mount(BoatCapacityPrice, {
      props: { volume: null, price: null, currency: 'EUR', errors: { volume: 'Volume requis', price: 'Prix requis' } },
    })
    expect(w.text()).toContain('Volume requis')
    expect(w.text()).toContain('Prix requis')
  })

  it('en francs CFA, le prix avance de 1 en 1', () => {
    const w = mount(BoatCapacityPrice, { props: { volume: 5, price: 300000, currency: 'XOF' } })
    expect(w.get('[data-test="boat-price-m3"]').attributes('step')).toBe('1')
  })
})
