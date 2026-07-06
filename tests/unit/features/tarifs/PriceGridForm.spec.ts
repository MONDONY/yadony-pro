import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceGridForm from '@/features/tarifs/components/PriceGridForm.vue'

const existing = { id: 'i1', label: 'Paris → Dakar', unitPriceNet: 12, unitPriceDisplay: 13.5, position: 0 }

describe('PriceGridForm', () => {
  it('emits submit with the entered label and price in add mode', async () => {
    const wrapper = mount(PriceGridForm, { props: { editing: null, isSaving: false } })
    await wrapper.find('[data-test="pg-label"]').setValue('Lyon → Abidjan')
    await wrapper.find('[data-test="pg-price"]').setValue(15)
    await wrapper.find('[data-test="price-grid-form"]').trigger('submit')
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ label: 'Lyon → Abidjan', unitPriceNet: 15 })
  })

  it('disables submit while the form is invalid', async () => {
    const wrapper = mount(PriceGridForm, { props: { editing: null, isSaving: false } })
    expect(wrapper.find('[data-test="pg-submit"]').attributes('disabled')).toBeDefined()
    await wrapper.find('[data-test="pg-label"]').setValue('X')
    await wrapper.find('[data-test="pg-price"]').setValue(0) // below 0.01
    expect(wrapper.find('[data-test="pg-submit"]').attributes('disabled')).toBeDefined()
  })

  it('prefills fields in edit mode and shows a cancel button', async () => {
    const wrapper = mount(PriceGridForm, { props: { editing: existing, isSaving: false } })
    expect((wrapper.find('[data-test="pg-label"]').element as HTMLInputElement).value).toBe('Paris → Dakar')
    expect(wrapper.find('[data-test="pg-submit"]').text()).toBe('Modifier')
    const cancel = wrapper.find('[data-test="pg-cancel"]')
    expect(cancel.exists()).toBe(true)
    await cancel.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
