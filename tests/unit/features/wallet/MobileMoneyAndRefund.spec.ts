import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const svc = {
  getMobileMoneyProviders: vi.fn(),
  startMobileMoneyTopup: vi.fn(),
  getTopupStatus: vi.fn(),
  listEligibleTopups: vi.fn(),
  requestRefund: vi.fn(),
  listRefundRequests: vi.fn(),
}
vi.mock('@/features/wallet/services/walletService', () => ({ walletService: () => svc }))

const compact = (s: string) => s.replace(/[\s  ]/g, '')

describe('MobileMoneyTopupForm', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    Object.values(svc).forEach((f) => f.mockReset())
    svc.getMobileMoneyProviders.mockResolvedValue({
      country: 'SN', currency: 'XOF', msisdnMasked: '+221 77 *** ** 67', detected: 'WAVE_SEN',
      providers: [
        { code: 'ORANGE_SEN', label: 'Orange Money', detected: false },
        { code: 'WAVE_SEN', label: 'Wave', detected: true },
      ],
    })
    svc.startMobileMoneyTopup.mockResolvedValue({
      topupId: 'tp1', currency: 'XOF', provider: 'WAVE_SEN', providerLabel: 'Wave',
      msisdnMasked: '+221 77 *** ** 67', authorizationUrl: 'https://wave.test/pay',
    })
  })
  afterEach(() => vi.useRealTimers())

  async function mountForm() {
    const { default: Form } = await import('@/features/wallet/components/MobileMoneyTopupForm.vue')
    return mount(Form)
  }

  it('déroule numéro, réseau détecté, paiement puis confirmation', async () => {
    svc.getTopupStatus.mockResolvedValue({
      topupId: 'tp1', status: 'CONFIRMED', amount: 5000, currency: 'XOF', providerLabel: 'Wave',
      authorizationUrl: null, failureReason: null, walletBalance: 5000,
    })
    const w = await mountForm()
    expect((w.find('[data-test="mm-continue"]').element as HTMLButtonElement).disabled).toBe(true)
    await w.find('[data-test="mm-phone"]').setValue('+221771234567')
    await w.find('[data-test="mm-phone-step"]').trigger('submit')
    await flushPromises()
    expect(w.find('[data-test="mm-currency"]').text()).toBe('XOF')
    expect((w.find('[data-test="mm-provider-WAVE_SEN"]').element as HTMLInputElement).checked).toBe(true)

    await w.find('[data-test="mm-amount"]').setValue('100')
    expect((w.find('[data-test="mm-pay"]').element as HTMLButtonElement).disabled).toBe(true)
    await w.find('[data-test="mm-amount"]').setValue('5000')
    await w.find('[data-test="mm-details-step"]').trigger('submit')
    await flushPromises()
    expect(w.find('[data-test="mm-waiting"]').text()).toContain('Wave')
    expect(w.find('[data-test="mm-authorize"]').attributes('href')).toBe('https://wave.test/pay')

    await vi.advanceTimersByTimeAsync(3000)
    await flushPromises()
    expect(compact(w.find('[data-test="mm-confirmed"]').text())).toContain('5000FCFA')
    expect(w.emitted('confirmed')).toHaveLength(1)
  })

  it('montre l\'échec avec son motif et permet de recommencer', async () => {
    svc.getTopupStatus.mockResolvedValue({
      topupId: 'tp1', status: 'FAILED', amount: 5000, currency: 'XOF', providerLabel: 'Wave',
      authorizationUrl: null, failureReason: 'Code PIN erroné', walletBalance: null,
    })
    const w = await mountForm()
    await w.find('[data-test="mm-phone"]').setValue('+221771234567')
    await w.find('[data-test="mm-phone-step"]').trigger('submit')
    await flushPromises()
    await w.find('[data-test="mm-amount"]').setValue('5000')
    await w.find('[data-test="mm-details-step"]').trigger('submit')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(3000)
    await flushPromises()
    expect(w.find('[data-test="mm-failed"]').text()).toContain('Code PIN erroné')
    expect(w.emitted('confirmed')).toBeUndefined()
    await w.find('[data-test="mm-again"]').trigger('click')
    expect(w.find('[data-test="mm-phone-step"]').exists()).toBe(true)
  })

  it('affiche l\'erreur quand le numéro est refusé', async () => {
    svc.getMobileMoneyProviders.mockRejectedValue({ data: { detail: 'Numéro non pris en charge.' } })
    const w = await mountForm()
    await w.find('[data-test="mm-phone"]').setValue('+33612345678')
    await w.find('[data-test="mm-phone-step"]').trigger('submit')
    await flushPromises()
    expect(w.find('[data-test="mm-error"]').text()).toBe('Numéro non pris en charge.')
  })
})

describe('WalletRefundPanel', () => {
  const balance = (over = {}) => ({
    currency: 'EUR', balance: 30, active: true, refundEligible: true, refundableAmount: 30,
    nonRefundableAmount: 0, refundFeeAmount: 0.8, refundNetAmount: 29.2, estimatedInActive: null, ...over,
  })

  beforeEach(() => {
    vi.resetModules()
    Object.values(svc).forEach((f) => f.mockReset())
    svc.listRefundRequests.mockResolvedValue([])
    svc.listEligibleTopups.mockResolvedValue([
      { id: 'a', amount: 20, originalAmount: 20, paymentRef: 'pi_a', createdAt: '2026-09-01T10:00:00Z', feeAmount: 0.5 },
    ])
  })

  async function mountPanel(balances: unknown[]) {
    const { default: Panel } = await import('@/features/wallet/components/WalletRefundPanel.vue')
    const w = mount(Panel, { props: { balances } as never })
    await flushPromises()
    return w
  }

  it('reste masqué sans solde remboursable ni demande', async () => {
    const w = await mountPanel([balance({ refundEligible: false })])
    expect(w.find('[data-test="wallet-refund"]').exists()).toBe(false)
  })

  it('affiche le montant remboursable avec frais et net', async () => {
    const w = await mountPanel([balance()])
    const text = compact(w.find('[data-test="refund-EUR"]').text())
    expect(text).toContain('30,00€remboursable')
    expect(text).toContain('29,20€')
  })

  it('demande le remboursement des recharges cochées et prévient le parent', async () => {
    svc.requestRefund.mockResolvedValue({
      id: 'r1', currency: 'EUR', amount: 20, status: 'PENDING', requestedAt: '2026-10-01T10:00:00Z',
      resolvedAt: null, feeAmount: 0.5, netAmount: 19.5, rail: 'STRIPE', destinationMasked: '•••• 4242',
    })
    const w = await mountPanel([balance()])
    await w.find('[data-test="refund-open-EUR"]').trigger('click')
    await flushPromises()
    expect((w.find('[data-test="refund-select-a"]').element as HTMLInputElement).checked).toBe(true)
    await w.find('[data-test="refund-submit"]').trigger('click')
    await flushPromises()
    expect(svc.requestRefund).toHaveBeenCalledWith('EUR', ['a'])
    expect(w.emitted('requested')).toHaveLength(1)
    const list = w.find('[data-test="refund-requests"]').text()
    expect(list).toContain('En attente')
    expect(list).toContain('Carte')
    expect(list).toContain('•••• 4242')
  })

  it('montre l\'historique des demandes même sans solde remboursable', async () => {
    svc.listRefundRequests.mockResolvedValue([{
      id: 'r0', currency: 'XOF', amount: 5000, status: 'COMPLETED', requestedAt: '2026-09-20T10:00:00Z',
      resolvedAt: '2026-09-21T10:00:00Z', feeAmount: 100, netAmount: 4900, rail: 'PAWAPAY', destinationMasked: '+221 77 *** 67',
    }])
    const w = await mountPanel([])
    const list = w.find('[data-test="refund-requests"]')
    expect(list.text()).toContain('Remboursé')
    expect(list.text()).toContain('Mobile money')
    expect(compact(list.text())).toContain('4900FCFA')
  })
})
