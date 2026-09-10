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

  it('affiche le solde dans la devise du portefeuille', async () => {
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="wallet-balance"]').text().replace(/[\s  ]/g, '')).toBe('42,50€')
  })

  it('affiche le solde en francs CFA sans centime', async () => {
    state.balance.value = 15000
    state.currency.value = 'XOF'
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="wallet-balance"]').text().replace(/[\s  ]/g, '')).toBe('15000FCFA')
    expect(wrapper.text()).not.toContain('€')
    state.currency.value = 'EUR'
  })

  it('liste les transactions, chacune dans sa devise', async () => {
    state.transactions.value = [
      { type: 'TOPUP', amount: 20, balanceAfter: 42.5, paymentRef: 'pi_1', createdAt: '2026-07-01T10:00:00Z' },
      { type: 'COMMISSION', amount: -6000, balanceAfter: 9000, paymentRef: null, createdAt: '2026-07-02T10:00:00Z', currency: 'XOF' },
    ]
    const wrapper = await mountCard()
    expect(wrapper.text()).toContain('Recharge')
    expect(wrapper.find('[data-test="wallet-tx-0"]').text().replace(/[\s  ]/g, '')).toBe('+20,00€')
    expect(wrapper.find('[data-test="wallet-tx-1"]').text().replace(/[\s  ]/g, '')).toBe('−6000FCFA')
  })

  it('ne propose plus de recharge depuis le portail mais renvoie vers l’app mobile', async () => {
    // Le backend refuse Wave et Orange Money (422) et la carte exige un SDK Stripe :
    // le formulaire menait à une erreur muette.
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="topup-submit"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="topup-method"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="topup-mobile-hint"]').text()).toContain('app mobile Yadony')
    expect(state.startTopup).not.toHaveBeenCalled()
  })

  it('affiche l’erreur de chargement', async () => {
    state.error.value = 'Impossible de charger ton portefeuille.'
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="wallet-error"]').text()).toContain('Impossible de charger')
  })
})
