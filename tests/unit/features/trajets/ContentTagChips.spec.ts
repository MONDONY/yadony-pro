import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentTagChips from '@/features/trajets/components/ContentTagChips.vue'

describe('ContentTagChips', () => {
  it('affiche l’emoji devant le libellé quand presetEmojis est fourni, sans changer la valeur émise', async () => {
    const wrapper = mount(ContentTagChips, {
      props: {
        modelValue: [],
        presets: ['Documents & administratif', 'Vêtements & tissus'],
        presetEmojis: { 'Documents & administratif': '📄', 'Vêtements & tissus': '👗' },
      },
    })
    const buttons = wrapper.findAll('button')
    const docButton = buttons.find((b) => b.text().includes('Documents & administratif'))
    expect(docButton!.text()).toContain('📄')

    await docButton!.trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect((emitted![0] as unknown[])[0]).toEqual(['Documents & administratif'])
  })

  it('fonctionne sans presetEmojis (rétro-compatible)', () => {
    const wrapper = mount(ContentTagChips, {
      props: { modelValue: [], presets: ['Documents & administratif'] },
    })
    const button = wrapper.findAll('button').find((b) => b.text().includes('Documents & administratif'))
    expect(button).toBeTruthy()
  })

  it('la saisie libre reste possible et émet la valeur telle quelle', async () => {
    const wrapper = mount(ContentTagChips, {
      props: { modelValue: [], presets: ['Documents & administratif'] },
    })
    const input = wrapper.find('input[type="text"]')
    await input.setValue('Poissons')
    await input.trigger('keydown', { key: 'Enter' })
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect((emitted![0] as unknown[])[0]).toEqual(['Poissons'])
  })
})
