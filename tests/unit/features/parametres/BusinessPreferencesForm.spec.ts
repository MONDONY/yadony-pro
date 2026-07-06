import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BusinessPreferencesForm from '@/features/parametres/components/BusinessPreferencesForm.vue'
import type { BusinessPreferences } from '@/features/parametres/types/index'

const base: BusinessPreferences = {
  weightUnit: 'kg',
  currencyCode: 'EUR',
  pickupRadiusKm: 10,
  defaultPackageWeightKg: 23,
  minBidPriceEur: 0,
  contactMode: null,
  responseDelayHours: null,
}

describe('BusinessPreferencesForm', () => {
  it('renders fields from modelValue', () => {
    const wrapper = mount(BusinessPreferencesForm, { props: { modelValue: base, isSaving: false } })
    expect((wrapper.find('[data-test="field-weightUnit"]').element as HTMLSelectElement).value).toBe('kg')
    expect((wrapper.find('[data-test="field-pickupRadiusKm"]').element as HTMLInputElement).value).toBe('10')
  })

  it('emits submit with the updated values', async () => {
    const wrapper = mount(BusinessPreferencesForm, { props: { modelValue: base, isSaving: false } })
    await wrapper.find('[data-test="field-pickupRadiusKm"]').setValue(25)
    await wrapper.find('[data-test="field-contactMode"]').setValue('both')
    await wrapper.find('[data-test="business-prefs-form"]').trigger('submit')
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as BusinessPreferences
    expect(payload.pickupRadiusKm).toBe(25)
    expect(payload.contactMode).toBe('both')
    expect(payload.responseDelayHours).toBeNull()
  })

  it('disables the submit button and shows a saving label when isSaving is true', () => {
    const wrapper = mount(BusinessPreferencesForm, { props: { modelValue: base, isSaving: true } })
    const btn = wrapper.find('[data-test="submit-prefs"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Enregistrement')
  })

  it('syncs the local form when modelValue changes', async () => {
    const wrapper = mount(BusinessPreferencesForm, { props: { modelValue: base, isSaving: false } })
    await wrapper.setProps({ modelValue: { ...base, currencyCode: 'XOF' } })
    expect((wrapper.find('[data-test="field-currencyCode"]').element as HTMLSelectElement).value).toBe('XOF')
  })
})
