import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PayoutCard from '@/features/payout/components/PayoutCard.vue'

function mountCard(props: Record<string, unknown> = {}) {
  return mount(PayoutCard, {
    props: {
      label: 'Paiements non configurés',
      description: 'Configure ton compte.',
      tone: 'neutral',
      action: 'setup',
      canRefresh: false,
      isWorking: false,
      ...props,
    },
  })
}

describe('PayoutCard', () => {
  it('renders the label and description', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-test="payout-label"]').text()).toBe('Paiements non configurés')
    expect(wrapper.find('[data-test="payout-description"]').text()).toBe('Configure ton compte.')
  })

  it('shows the setup button and emits setup when action is "setup"', async () => {
    const wrapper = mountCard({ action: 'setup' })
    const btn = wrapper.find('[data-test="payout-setup"]')
    expect(btn.text()).toContain('Configurer mes paiements')
    await btn.trigger('click')
    expect(wrapper.emitted('setup')).toBeTruthy()
  })

  it('shows a "continue" label and a refresh button when onboarding is pending', async () => {
    const wrapper = mountCard({ action: 'continue', canRefresh: true, tone: 'warning' })
    expect(wrapper.find('[data-test="payout-setup"]').text()).toContain('Continuer la configuration')
    const refresh = wrapper.find('[data-test="payout-refresh"]')
    expect(refresh.exists()).toBe(true)
    await refresh.trigger('click')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('hides all buttons when no action and no refresh (account complete)', () => {
    const wrapper = mountCard({ action: 'none', canRefresh: false, tone: 'success', label: 'Paiements activés' })
    expect(wrapper.find('[data-test="payout-setup"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="payout-refresh"]').exists()).toBe(false)
  })

  it('disables the setup button and shows an opening label while working', () => {
    const wrapper = mountCard({ isWorking: true })
    const btn = wrapper.find('[data-test="payout-setup"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Ouverture')
  })
})
