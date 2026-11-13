import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransportModeChips from '@/features/trajets/components/TransportModeChips.vue'

describe('TransportModeChips', () => {
  it('n’affiche que les modes reçus, Route pour CAR', () => {
    const w = mount(TransportModeChips, { props: { modelValue: null, modes: ['PLANE', 'CAR'] } })
    expect(w.findAll('button').map((b) => b.text())).toEqual(['Avion', 'Route'])
  })

  it('ordre Avion, Bateau, Route, Train, Autre', () => {
    const w = mount(TransportModeChips, { props: { modelValue: null, modes: ['OTHER', 'CAR', 'TRAIN', 'BOAT', 'PLANE'] } })
    expect(w.findAll('button').map((b) => b.text())).toEqual(['Avion', 'Bateau', 'Route', 'Train', 'Autre'])
  })

  it('émet le mode cliqué et marque le mode actif', async () => {
    const w = mount(TransportModeChips, { props: { modelValue: 'PLANE', modes: ['PLANE', 'CAR'], error: 'Mode de transport requis' } })
    await w.get('[data-test="transport-CAR"]').trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['CAR'])
    expect(w.get('[data-test="transport-PLANE"]').classes()).toContain('border-primary')
    expect(w.text()).toContain('Mode de transport requis')
  })
})
