import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import QrScanner from '@/features/trajets/components/QrScanner.vue'

describe('QrScanner', () => {
  it('affiche le message "non supporté" et émet error quand BarcodeDetector est absent', async () => {
    // En environnement de test, ni BarcodeDetector ni getUserMedia ne sont disponibles.
    const wrapper = mount(QrScanner)
    await flushPromises()
    expect(wrapper.find('[data-test="qr-unsupported"]').exists()).toBe(true)
    expect(wrapper.emitted('error')).toBeTruthy()
  })
})
