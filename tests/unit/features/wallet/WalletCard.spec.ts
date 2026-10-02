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
  balances: ref<unknown[]>([]),
  estimatedTotal: ref<number | null>(null),
  estimateComplete: ref(true),
  isLoading: ref(false),
  isToppingUp: ref(false),
  error: ref<string | null>(null),
  fetchBalance: vi.fn(),
  startTopup: vi.fn(),
  startCardTopup: vi.fn(),
}

const routeQuery: Record<string, string> = {}
const routerReplace = vi.fn().mockResolvedValue(undefined)
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ replace: routerReplace }),
}))

vi.mock('@/features/wallet/services/walletService', () => ({
  walletService: () => ({
    listRefundRequests: vi.fn().mockResolvedValue([]),
    listEligibleTopups: vi.fn().mockResolvedValue([]),
    getMobileMoneyProviders: vi.fn(),
    startMobileMoneyTopup: vi.fn(),
    getTopupStatus: vi.fn(),
  }),
}))

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

  it('recharge par carte : ouvre la session Checkout renvoyée par le serveur', async () => {
    state.startCardTopup.mockResolvedValue({ status: 'redirect', url: 'https://checkout.stripe.com/c/pay/cs_test' })
    const assignSpy = vi.fn()
    const original = window.location
    Object.defineProperty(window, 'location', { value: { ...original, assign: assignSpy }, writable: true })
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="topup-currency"]').text()).toBe('€')
    await wrapper.find('[data-test="topup-amount"]').setValue('25')
    await wrapper.find('[data-test="topup-submit"]').trigger('click')
    await vi.waitFor(() => expect(state.startCardTopup).toHaveBeenCalledWith(25))
    await vi.waitFor(() => expect(assignSpy).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test'))
    expect(state.startTopup).not.toHaveBeenCalled()
    Object.defineProperty(window, 'location', { value: original, writable: true })
  })

  it('renvoie vers l’app mobile quand le serveur ne connaît pas encore la recharge web', async () => {
    state.startCardTopup.mockResolvedValue({ status: 'unavailable' })
    const wrapper = await mountCard()
    await wrapper.find('[data-test="topup-amount"]').setValue('25')
    await wrapper.find('[data-test="topup-submit"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[data-test="topup-mobile-hint"]').exists()).toBe(true))
    expect(wrapper.find('[data-test="topup-card-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="topup-mobile-hint"]').text()).toContain('app mobile Yadony')
  })

  it('affiche l’erreur de préparation de la recharge', async () => {
    state.startCardTopup.mockResolvedValue({ status: 'error', message: 'Stripe est indisponible.' })
    const wrapper = await mountCard()
    await wrapper.find('[data-test="topup-amount"]').setValue('25')
    await wrapper.find('[data-test="topup-submit"]').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[data-test="topup-error"]').text()).toBe('Stripe est indisponible.'))
  })

  it('propose le mobile money, pas la carte, sur un portefeuille en francs CFA', async () => {
    state.currency.value = 'XOF'
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="topup-mm"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="topup-card-form"]').exists()).toBe(false)
    state.currency.value = 'EUR'
  })

  it('liste les portefeuilles par devise avec le total estimé quand il y en a plusieurs', async () => {
    state.balances.value = [
      { currency: 'EUR', balance: 42.5, active: true, refundEligible: false, refundableAmount: 0, nonRefundableAmount: 0, refundFeeAmount: 0, refundNetAmount: 0, estimatedInActive: null },
      { currency: 'XOF', balance: 15000, active: false, refundEligible: false, refundableAmount: 0, nonRefundableAmount: 0, refundFeeAmount: 0, refundNetAmount: 0, estimatedInActive: 22.9 },
    ]
    state.estimatedTotal.value = 65.4
    state.estimateComplete.value = false
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="wallet-balance-XOF"]').text().replace(/[\s  ]/g, '')).toContain('15000FCFA')
    const total = wrapper.find('[data-test="wallet-estimated-total"]').text()
    expect(total.replace(/[\s  ]/g, '')).toContain('65,40€')
    expect(total).toContain('partiel')
    state.balances.value = []
    state.estimatedTotal.value = null
    state.estimateComplete.value = true
  })

  it('masque la liste des portefeuilles quand il n\'y en a qu\'un', async () => {
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="wallet-balances"]').exists()).toBe(false)
  })

  it('affiche le retour de Stripe Checkout et nettoie l’URL', async () => {
    routeQuery.topup = 'success'
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="topup-return-success"]').text()).toContain('Paiement validé')
    expect(routerReplace).toHaveBeenCalledWith({ query: { topup: undefined } })
    delete routeQuery.topup
    routeQuery.topup = 'canceled'
    const wrapper2 = await mountCard()
    expect(wrapper2.find('[data-test="topup-return-canceled"]').text()).toContain('annulée')
    delete routeQuery.topup
  })

  it('affiche l’erreur de chargement', async () => {
    state.error.value = 'Impossible de charger ton portefeuille.'
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="wallet-error"]').text()).toContain('Impossible de charger')
  })
})
