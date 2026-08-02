import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginLeftPanel from '@/features/auth/components/LoginLeftPanel.vue'

describe('LoginLeftPanel', () => {
  it('renders the yadony logo text', () => {
    const wrapper = mount(LoginLeftPanel)
    expect(wrapper.text()).toContain('yadony')
  })

  it('renders the PRO badge', () => {
    const wrapper = mount(LoginLeftPanel)
    expect(wrapper.text()).toContain('PRO')
  })

  it('shows an editorial headline instead of a mascot (redesign Comptoir)', () => {
    const wrapper = mount(LoginLeftPanel)
    // La mascotte a été retirée au profit d'une accroche typographique.
    expect(wrapper.find('img[src*="mascots"]').exists()).toBe(false)
    expect(wrapper.find('h2').exists()).toBe(true)
  })

  it('renders 3 security reassurance items', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items).toHaveLength(3)
  })

  it('mentions Stripe in the first security item', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items[0].text()).toContain('Stripe')
  })

  it('mentions KYC in the second security item', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items[1].text()).toContain('Identité vérifiée')
  })

  it('mentions SMS in the third security item', () => {
    const wrapper = mount(LoginLeftPanel)
    const items = wrapper.findAll('[data-test="security-item"]')
    expect(items[2].text()).toContain('SMS')
  })
})
