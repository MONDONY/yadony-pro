import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PhoneNumberForm from '@/features/auth/components/PhoneNumberForm.vue'

const sendOtpMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/auth/composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({ sendOtp: sendOtpMock }),
}))

describe('PhoneNumberForm', () => {
  beforeEach(() => { sendOtpMock.mockClear() })

  it('renders country selector button with default FR', () => {
    const wrapper = mount(PhoneNumberForm)
    expect(wrapper.text()).toContain('+33')
    expect(wrapper.text()).toContain('🇫🇷')
  })

  it('renders 4 quick country chips', () => {
    const wrapper = mount(PhoneNumberForm)
    const chips = wrapper.findAll('[data-test="country-chip"]')
    expect(chips).toHaveLength(4)
  })

  it('clicking SN chip switches dial code to +221', async () => {
    const wrapper = mount(PhoneNumberForm)
    const chips = wrapper.findAll('[data-test="country-chip"]')
    await chips[1].trigger('click') // Sénégal
    await wrapper.find('input[type="tel"]').setValue('771234567')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(sendOtpMock).toHaveBeenCalledWith('+221771234567', 'recaptcha-container')
  })

  it('shows error when local number is empty on submit', async () => {
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Numéro invalide')
    expect(sendOtpMock).not.toHaveBeenCalled()
  })

  it('shows error when local number has fewer than 7 digits', async () => {
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('input[type="tel"]').setValue('123')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Numéro invalide')
  })

  it('calls sendOtp with concatenated dial+local and emits sent', async () => {
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('input[type="tel"]').setValue('612345678')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(sendOtpMock).toHaveBeenCalledWith('+33612345678', 'recaptcha-container')
    expect(wrapper.emitted('sent')).toBeTruthy()
    expect(wrapper.emitted('sent')![0]).toEqual(['+33612345678'])
  })

  it('calls sendOtp with SN dial code when SN chip selected', async () => {
    const wrapper = mount(PhoneNumberForm)
    const chips = wrapper.findAll('[data-test="country-chip"]')
    await chips[1].trigger('click') // Sénégal +221
    await wrapper.find('input[type="tel"]').setValue('771234567')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(sendOtpMock).toHaveBeenCalledWith('+221771234567', 'recaptcha-container')
  })

  it('shows network error message when sendOtp rejects', async () => {
    sendOtpMock.mockRejectedValueOnce(new Error('auth/too-many-requests'))
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('input[type="tel"]').setValue('612345678')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('auth/too-many-requests')
  })

  it('active chip has text-primary class', async () => {
    const wrapper = mount(PhoneNumberForm)
    const chips = wrapper.findAll('[data-test="country-chip"]')
    // FR est actif par défaut
    expect(chips[0].classes()).toContain('text-primary')
    // Après clic sur SN, SN doit être actif
    await chips[1].trigger('click')
    expect(chips[1].classes()).toContain('text-primary')
    expect(chips[0].classes()).not.toContain('text-primary')
  })

  it('shows generic error when sendOtp rejects without message', async () => {
    sendOtpMock.mockRejectedValueOnce(new Error(''))
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('input[type="tel"]').setValue('612345678')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Erreur envoi OTP')
  })

  it('disables submit button while loading and shows loading text', async () => {
    let resolveSendOtp!: () => void
    sendOtpMock.mockImplementationOnce(
      () => new Promise<void>(resolve => { resolveSendOtp = resolve }),
    )
    const wrapper = mount(PhoneNumberForm)
    await wrapper.find('input[type="tel"]').setValue('612345678')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.text()).toContain('Envoi en cours')
    expect(btn.attributes('disabled')).toBeDefined()
    resolveSendOtp()
    await wrapper.vm.$nextTick()
  })

  describe('FLUTTER-JD : numéros hors France', () => {
    async function submitWith(wrapper: ReturnType<typeof mount>, value: string) {
      await wrapper.find('input[type="tel"]').setValue(value)
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()
    }

    it('accepte un numéro américain collé en +1 et bascule le sélecteur', async () => {
      const wrapper = mount(PhoneNumberForm)
      await submitWith(wrapper, '+1 713 555 0100')
      expect(sendOtpMock).toHaveBeenCalledWith('+17135550100', 'recaptcha-container')
      expect(wrapper.text()).toContain('🇺🇸')
    })

    it('convertit 0033 en +33', async () => {
      const wrapper = mount(PhoneNumberForm)
      await submitWith(wrapper, '0033 6 12 34 56 78')
      expect(sendOtpMock).toHaveBeenCalledWith('+33612345678', 'recaptcha-container')
    })

    it('retire le 0 national français', async () => {
      const wrapper = mount(PhoneNumberForm)
      await submitWith(wrapper, '06 12 34 56 78')
      expect(sendOtpMock).toHaveBeenCalledWith('+33612345678', 'recaptcha-container')
    })

    it('garde le 0 ivoirien', async () => {
      const wrapper = mount(PhoneNumberForm)
      await wrapper.findAll('[data-test="country-chip"]')[2]!.trigger('click') // CI
      await submitWith(wrapper, '07 48 84 08 74')
      expect(sendOtpMock).toHaveBeenCalledWith('+2250748840874', 'recaptcha-container')
    })

    it('accepte un numéro canadien choisi dans la liste', async () => {
      const wrapper = mount(PhoneNumberForm)
      await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
      await wrapper.find('[data-test="country-search"]').setValue('canada')
      await wrapper.find('li[role="option"]').trigger('click')
      expect(wrapper.find('input[type="tel"]').attributes('placeholder')).toBe('514 555 0123')
      await submitWith(wrapper, '514 555 0123')
      expect(sendOtpMock).toHaveBeenCalledWith('+15145550123', 'recaptcha-container')
    })

    it('garde le Canada choisi quand on colle un numéro en +1', async () => {
      const wrapper = mount(PhoneNumberForm)
      await wrapper.find('button[aria-haspopup="listbox"]').trigger('click')
      await wrapper.find('[data-test="country-search"]').setValue('canada')
      await wrapper.find('li[role="option"]').trigger('click')
      await submitWith(wrapper, '+1 514 555 0123')
      expect(wrapper.text()).toContain('🇨🇦')
      expect(sendOtpMock).toHaveBeenCalledWith('+15145550123', 'recaptcha-container')
    })

    it('ne bascule pas le sélecteur pour un indicatif inconnu, et refuse le numéro', async () => {
      const wrapper = mount(PhoneNumberForm)
      await submitWith(wrapper, '+33+1713')
      expect(wrapper.text()).toContain('🇫🇷')
      expect(wrapper.text()).toContain('Numéro invalide (ex : 06 12 34 56 78)')
      expect(sendOtpMock).not.toHaveBeenCalled()
    })

    it('refuse un numéro contenant des lettres', async () => {
      const wrapper = mount(PhoneNumberForm)
      await submitWith(wrapper, '06 12 AB 56 78')
      expect(wrapper.text()).toContain('Numéro invalide')
      expect(sendOtpMock).not.toHaveBeenCalled()
    })
  })
})
