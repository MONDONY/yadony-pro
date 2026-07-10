import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Field, Input } from '@/components/ui/input'

describe('Field', () => {
  it('links the label to the control via a shared id', () => {
    const w = mount(Field, {
      props: { label: 'Prix par kg' },
      slots: { default: '<template #default="{ id }"><input :id="id" /></template>' },
    })
    const forId = w.get('label').attributes('for')
    const inputId = w.get('input').attributes('id')
    expect(forId).toBeTruthy()
    expect(forId).toBe(inputId)
  })

  it('shows the error message and hides the hint when in error', () => {
    const w = mount(Field, {
      props: { label: 'x', hint: 'aide', error: 'Champ requis' },
      slots: { default: '<input />' },
    })
    expect(w.text()).toContain('Champ requis')
    expect(w.text()).not.toContain('aide')
  })

  it('marks the input invalid when Field is in error (via slot prop)', () => {
    const w = mount(Field, {
      props: { error: 'x' },
      slots: {
        default: '<template #default="{ id, invalid }"><Input :id="id" :invalid="invalid" /></template>',
      },
      global: { components: { Input } },
    })
    expect(w.get('input').attributes('aria-invalid')).toBe('true')
  })
})
