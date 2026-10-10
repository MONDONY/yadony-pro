import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CountrySelector from '@/features/auth/components/CountrySelector.vue'
import { COUNTRIES } from '@/features/auth/data/countries'

const defaultCountry = COUNTRIES[0]!

describe('CountrySelector', () => {
  it('shows selected country flag and dial code', () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    expect(wrapper.text()).toContain('🇫🇷')
    expect(wrapper.text()).toContain('+33')
  })

  it('opens dropdown on button click', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)
  })

  it('lists every country in dropdown', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    const items = wrapper.findAll('li[role="option"]')
    expect(items).toHaveLength(COUNTRIES.length)
  })

  it('filtre par nom sans accents (« etats » trouve États-Unis)', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-test="country-search"]').setValue('etats')
    const items = wrapper.findAll('li[role="option"]')
    expect(items).toHaveLength(1)
    expect(items[0]!.text()).toContain('États-Unis')
  })

  it('filtre par apostrophe courbe (« côte d’ivoire »)', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-test="country-search"]').setValue('côte d\u2019ivoire')
    expect(wrapper.findAll('li[role="option"]').map(i => i.text())).toEqual([expect.stringContaining("Côte d'Ivoire")])
  })

  it('filtre par indicatif (+1 → Canada et États-Unis)', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-test="country-search"]').setValue('+1')
    const texts = wrapper.findAll('li[role="option"]').map(i => i.text())
    expect(texts).toHaveLength(2)
    expect(texts.join(' ')).toContain('Canada')
    expect(texts.join(' ')).toContain('États-Unis')
  })

  it('filtre par code ISO (us)', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-test="country-search"]').setValue('us')
    expect(wrapper.findAll('li[role="option"]').map(i => i.text())).toContain('🇺🇸États-Unis+1')
  })

  it('affiche un message quand aucun pays ne correspond', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-test="country-search"]').setValue('atlantide')
    expect(wrapper.findAll('li[role="option"]')).toHaveLength(0)
    expect(wrapper.find('[data-test="country-empty"]').exists()).toBe(true)
  })

  it('Entrée sélectionne le premier résultat', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    const search = wrapper.find('[data-test="country-search"]')
    await search.setValue('etats')
    await search.trigger('keydown', { key: 'Enter' })
    const emitted = wrapper.emitted('update:modelValue')![0]![0] as typeof defaultCountry
    expect(emitted.code).toBe('US')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
  })

  it('Entrée sans résultat ne sélectionne rien', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    const search = wrapper.find('[data-test="country-search"]')
    await search.setValue('atlantide')
    await search.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('Échap ferme la liste', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-test="country-search"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
  })

  it('vide la recherche à la réouverture', async () => {
    const wrapper = mount(CountrySelector, { props: { modelValue: defaultCountry } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('[data-test="country-search"]').setValue('etats')
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('li[role="option"]')).toHaveLength(COUNTRIES.length)
  })

  it('emits update:modelValue when a country is selected', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    const items = wrapper.findAll('li[role="option"]')
    await items[1].trigger('click') // Sénégal
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')![0][0] as typeof defaultCountry
    expect(emitted.code).toBe('SN')
    expect(emitted.dial).toBe('+221')
  })

  it('closes dropdown after selection', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    await wrapper.findAll('li[role="option"]')[0].trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
  })

  it('toggles dropdown closed when button is clicked again', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
  })

  it('closes dropdown when clicking outside the component', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
      attachTo: document.body,
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)

    // Simulate click outside by dispatching a click event on document body
    const outsideElement = document.createElement('div')
    document.body.appendChild(outsideElement)
    outsideElement.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false)
    outsideElement.remove()
    wrapper.unmount()
  })

  it('does not close dropdown when clicking inside the component', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
      attachTo: document.body,
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)

    // Dispatch click inside the container — the component itself
    wrapper.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    // Dropdown should still be open (click was inside the container)
    // Note: button.stop prevents toggle, but the handleClickOutside won't close it
    expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('marks the currently selected country with aria-selected', async () => {
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    await wrapper.find('button').trigger('click')
    const items = wrapper.findAll('li[role="option"]')
    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('aria-selected')).toBe('false')
  })

  it('removes click listener on unmount', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const wrapper = mount(CountrySelector, {
      props: { modelValue: defaultCountry },
    })
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function), true)
    removeSpy.mockRestore()
  })
})
