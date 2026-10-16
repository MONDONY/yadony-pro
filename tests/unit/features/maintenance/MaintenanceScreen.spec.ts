import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/composables/useApi', () => ({ useApi: () => vi.fn() }))

import MaintenanceScreen from '@/features/maintenance/components/MaintenanceScreen.vue'
import { useMaintenanceStore } from '@/stores/maintenance'

describe('MaintenanceScreen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('texte par défaut sans heure de retour', () => {
    const w = mount(MaintenanceScreen)
    expect(w.text()).toContain('Yadony est en maintenance')
    expect(w.find('[data-test="maintenance-message"]').text()).toContain('Nous améliorons Yadony')
    expect(w.find('[data-test="maintenance-end"]').exists()).toBe(false)
  })

  it('message de l’admin et heure de retour', () => {
    const store = useMaintenanceStore()
    store.message = 'Mise à jour du paiement'
    store.estimatedEndAt = '2026-10-16T14:30:00Z'
    const w = mount(MaintenanceScreen)
    expect(w.find('[data-test="maintenance-message"]').text()).toBe('Mise à jour du paiement')
    const expected = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
      .format(new Date('2026-10-16T14:30:00Z'))
    expect(w.find('[data-test="maintenance-end"]').text()).toBe(`Retour prévu vers ${expected}`)
  })

  it('heure illisible ignorée', () => {
    useMaintenanceStore().estimatedEndAt = 'n/a'
    expect(mount(MaintenanceScreen).find('[data-test="maintenance-end"]').exists()).toBe(false)
  })

  it('Réessayer relance la vérification et se désactive pendant', async () => {
    const store = useMaintenanceStore()
    const retry = vi.spyOn(store, 'retry').mockResolvedValue()
    const w = mount(MaintenanceScreen)
    await w.find('[data-test="maintenance-retry"]').trigger('click')
    expect(retry).toHaveBeenCalled()
    store.checking = true
    await w.vm.$nextTick()
    expect(w.find('[data-test="maintenance-retry"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="maintenance-retry"]').text()).toBe('Vérification…')
  })
})
