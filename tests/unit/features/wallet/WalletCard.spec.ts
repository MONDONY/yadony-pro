// tests/unit/features/wallet/WalletCard.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const state = {
  balance: ref<number | null>(42.5),
  currency: ref('EUR'),
  transactions: ref([
    { type: 'TOPUP', amount: 20, balanceAfter: 42.5, paymentRef: 'pi_1', createdAt: '2026-07-01T10:00:00Z' },
  ]),
  isLoading: ref(false),
  isToppingUp: ref(false),
  error: ref<string | null>(null),
  fetchBalance: vi.fn(),
  startTopup: vi.fn(),
}

vi.mock('@/features/wallet/composables/useWallet', () => ({
  useWallet: () => state,
}))

async function mountCard() {
  const { default: WalletCard } = await import('@/features/wallet/components/WalletCard.vue')
  return mount(WalletCard)
}

describe('WalletCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.balance.value = 42.5
    state.isLoading.value = false
    state.error.value = null
  })

  it('affiche le solde et la devise', async () => {
    const wrapper = await mountCard()
    expect(wrapper.text()).toContain('42.50')
    expect(wrapper.text()).toContain('€')
  })

  it('liste les transactions', async () => {
    const wrapper = await mountCard()
    expect(wrapper.text()).toContain('Recharge')
  })

  it('recharge Wave : appelle startTopup et redirige', async () => {
    state.startTopup.mockResolvedValue('https://wave.example/pay')
    const assignSpy = vi.fn()
    const original = window.location
    Object.defineProperty(window, 'location', { value: { ...original, assign: assignSpy }, writable: true })

    const wrapper = await mountCard()
    await wrapper.find('[data-test="topup-amount"]').setValue('25')
    await wrapper.find('[data-test="topup-method"]').setValue('WAVE')
    await wrapper.find('[data-test="topup-submit"]').trigger('click')
    await vi.waitFor(() => expect(state.startTopup).toHaveBeenCalledWith(25, 'WAVE'))
    await vi.waitFor(() => expect(assignSpy).toHaveBeenCalledWith('https://wave.example/pay'))

    Object.defineProperty(window, 'location', { value: original, writable: true })
  })

  it('bouton recharge désactivé sans montant valide', async () => {
    const wrapper = await mountCard()
    await wrapper.find('[data-test="topup-amount"]').setValue('0')
    expect(wrapper.find('[data-test="topup-submit"]').attributes('disabled')).toBeDefined()
  })
})
