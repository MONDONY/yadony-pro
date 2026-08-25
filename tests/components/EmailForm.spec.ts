import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EmailForm from '@/features/auth/components/EmailForm.vue'

const sendEmailOtpMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/features/auth/composables/useFirebaseAuth', () => ({
  useFirebaseAuth: () => ({ sendEmailOtp: sendEmailOtpMock }),
}))

describe('EmailForm', () => {
  beforeEach(() => { sendEmailOtpMock.mockClear() })

  it('renders the email field', () => {
    const wrapper = mount(EmailForm)
    expect(wrapper.text()).toContain('Adresse email')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('shows an error when email is invalid', async () => {
    const wrapper = mount(EmailForm)
    await wrapper.find('input[type="email"]').setValue('mauvais-email')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Adresse email invalide')
    expect(sendEmailOtpMock).not.toHaveBeenCalled()
  })

  it('normalizes email, sends OTP and emits sent', async () => {
    const wrapper = mount(EmailForm)
    await wrapper.find('input[type="email"]').setValue(' USER@Example.COM ')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(sendEmailOtpMock).toHaveBeenCalledWith('user@example.com')
    expect(wrapper.emitted('sent')![0]).toEqual(['user@example.com'])
  })

  it('shows network error when sendEmailOtp rejects', async () => {
    sendEmailOtpMock.mockRejectedValueOnce(new Error('email-service-error'))
    const wrapper = mount(EmailForm)
    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('email-service-error')
  })

  it("remplace l'erreur technique d'envoi OTP par un message utilisateur", async () => {
    sendEmailOtpMock.mockRejectedValueOnce(new Error('[POST] "https://api.yadony.com/api/v1/auth/email-otp/send": 400'))
    const wrapper = mount(EmailForm)
    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain("Impossible d'envoyer le code")
    expect(wrapper.text()).not.toContain('[POST]')
    expect(wrapper.text()).not.toContain('api.yadony.com')
  })

  it('disables submit button while loading', async () => {
    let resolveSendEmailOtp!: () => void
    sendEmailOtpMock.mockImplementationOnce(
      () => new Promise<void>(resolve => { resolveSendEmailOtp = resolve }),
    )
    const wrapper = mount(EmailForm)
    await wrapper.find('input[type="email"]').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.text()).toContain('Envoi en cours')
    expect(btn.attributes('disabled')).toBeDefined()
    resolveSendEmailOtp()
    await wrapper.vm.$nextTick()
  })
})
