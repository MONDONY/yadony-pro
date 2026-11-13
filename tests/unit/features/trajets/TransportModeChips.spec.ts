import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TransportModeChips from '@/features/trajets/components/TransportModeChips.vue'
import { BOAT_NOT_VERIFIED_MESSAGE } from '@/lib/transportModes'

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

  it('une puce désactivée reste visible, non cliquable, et porte sa raison', async () => {
    const w = mount(TransportModeChips, {
      props: { modelValue: null, modes: ['PLANE', 'BOAT'], disabledModes: ['BOAT'], disabledReason: BOAT_NOT_VERIFIED_MESSAGE },
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
    })
    const boat = w.get('[data-test="transport-BOAT"]')
    expect(boat.attributes('disabled')).toBeDefined()
    expect(boat.attributes('aria-disabled')).toBe('true')
    expect(boat.text()).toBe('Bateau')
    await boat.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.get('[data-test="transport-disabled-reason"]').text()).toContain('transporteurs vérifiés')
    expect(w.get('a[href="/upgrade"]').text()).toBe('Passer en PRO')
    // les autres puces restent cliquables
    await w.get('[data-test="transport-PLANE"]').trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['PLANE'])
  })

  it('une autre raison s’affiche sans lien PRO', () => {
    const w = mount(TransportModeChips, {
      props: { modelValue: null, modes: ['PLANE', 'BOAT'], disabledModes: ['BOAT'], disabledReason: "Le mode Bateau n'est pas encore ouvert." },
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
    })
    expect(w.text()).toContain("pas encore ouvert")
    expect(w.find('a').exists()).toBe(false)
  })
})
