import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReferralPanel from '@/features/parrainage/components/ReferralPanel.vue'

const info = {
  code: 'DONY-AB12',
  shareUrl: 'https://dony.app/r/DONY-AB12',
  totalInvited: 3,
  signedUp: 2,
  rewarded: 1,
  totalEarnedCents: 500,
}

const writeText = vi.fn().mockResolvedValue(undefined)

describe('ReferralPanel', () => {
  beforeEach(() => {
    writeText.mockClear()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
  })

  it('renders the code, share url and stats', () => {
    const wrapper = mount(ReferralPanel, { props: { referral: info, isRegenerating: false } })
    expect(wrapper.find('[data-test="referral-code"]').text()).toBe('DONY-AB12')
    expect(wrapper.find('[data-test="referral-url"]').text()).toContain('dony.app/r/DONY-AB12')
    expect(wrapper.find('[data-test="stat-invited"]').text()).toBe('3')
    expect(wrapper.find('[data-test="stat-earned"]').text()).toContain('5.00')
  })

  it('copies the share url to the clipboard and shows a confirmation', async () => {
    const wrapper = mount(ReferralPanel, { props: { referral: info, isRegenerating: false } })
    await wrapper.find('[data-test="referral-copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('https://dony.app/r/DONY-AB12')
    expect(wrapper.find('[data-test="referral-copy"]').text()).toContain('Copié')
  })

  it('emits regenerate when the regenerate button is clicked', async () => {
    const wrapper = mount(ReferralPanel, { props: { referral: info, isRegenerating: false } })
    await wrapper.find('[data-test="referral-regenerate"]').trigger('click')
    expect(wrapper.emitted('regenerate')).toBeTruthy()
  })
})
