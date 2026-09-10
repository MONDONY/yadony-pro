import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReferralPanel from '@/features/parrainage/components/ReferralPanel.vue'

const info = {
  code: 'YADONY-AB12',
  shareUrl: 'https://yadony.app/r/YADONY-AB12',
  totalInvited: 3,
  signedUp: 2,
  rewarded: 1,
  activeVoucherCount: 2,
  voucherFactor: 0.5,
  nextVoucherExpiresAt: '2026-12-31T00:00:00',
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
    expect(wrapper.find('[data-test="referral-code"]').text()).toBe('YADONY-AB12')
    expect(wrapper.find('[data-test="referral-url"]').text()).toContain('yadony.app/r/YADONY-AB12')
    expect(wrapper.find('[data-test="stat-invited"]').text()).toBe('3')
    expect(wrapper.find('[data-test="stat-vouchers"]').text()).toBe('2')
    expect(wrapper.find('[data-test="voucher-discount"]').text()).toContain('−50 %')
    expect(wrapper.find('[data-test="voucher-expiry"]').text()).toContain('2026')
    expect(wrapper.text()).not.toContain('NaN')
  })

  it('copies the share url to the clipboard and shows a confirmation', async () => {
    const wrapper = mount(ReferralPanel, { props: { referral: info, isRegenerating: false } })
    await wrapper.find('[data-test="referral-copy"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('https://yadony.app/r/YADONY-AB12')
    expect(wrapper.find('[data-test="referral-copy"]').text()).toContain('Copié')
  })

  it('emits regenerate when the regenerate button is clicked', async () => {
    const wrapper = mount(ReferralPanel, { props: { referral: info, isRegenerating: false } })
    await wrapper.find('[data-test="referral-regenerate"]').trigger('click')
    expect(wrapper.emitted('regenerate')).toBeTruthy()
  })
})
