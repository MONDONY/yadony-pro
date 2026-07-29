import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginLeftPanel from '@/features/auth/components/LoginLeftPanel.vue'

describe('LoginLeftPanel', () => {
  it('renders the Yadony PRO logo', () => {
    const wrapper = mount(LoginLeftPanel)
    expect(wrapper.find('img[alt="Yadony"]').attributes('src')).toBe('/logos/logo-yadony.png')
    expect(wrapper.text()).toContain('PRO')
  })

  it('renders the travel mascot', () => {
    const wrapper = mount(LoginLeftPanel)
    const mascot = wrapper.find('img[alt="Mascotte Yadony prête à voyager"]')
    expect(mascot.exists()).toBe(true)
    expect(mascot.attributes('src')).toBe('/mascots/travel.png')
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
