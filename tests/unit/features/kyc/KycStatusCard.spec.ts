import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KycStatusCard from '@/features/kyc/components/KycStatusCard.vue'

describe('KycStatusCard', () => {
  it('renders the label', () => {
    const wrapper = mount(KycStatusCard, {
      props: { label: 'Identité vérifiée', tone: 'success', canVerify: false, isStarting: false },
    })
    expect(wrapper.find('[data-test="kyc-label"]').text()).toBe('Identité vérifiée')
  })

  it('hides the verify button when canVerify is false', () => {
    const wrapper = mount(KycStatusCard, {
      props: { label: 'Identité vérifiée', tone: 'success', canVerify: false, isStarting: false },
    })
    expect(wrapper.find('[data-test="kyc-verify"]').exists()).toBe(false)
  })

  it('shows and emits verify when canVerify is true', async () => {
    const wrapper = mount(KycStatusCard, {
      props: { label: 'Identité non vérifiée', tone: 'neutral', canVerify: true, isStarting: false },
    })
    const btn = wrapper.find('[data-test="kyc-verify"]')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(wrapper.emitted('verify')).toBeTruthy()
  })

  it('disables the button and shows an opening label while starting', () => {
    const wrapper = mount(KycStatusCard, {
      props: { label: 'Vérification à reprendre', tone: 'error', canVerify: true, isStarting: true },
    })
    const btn = wrapper.find('[data-test="kyc-verify"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Ouverture')
  })
})
