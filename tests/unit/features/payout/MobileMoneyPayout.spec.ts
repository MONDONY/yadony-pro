import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const svc = {
  fetchMobileMoneyAccount: vi.fn(),
  lookupMobileMoneyProviders: vi.fn(),
  activateMobileMoney: vi.fn(),
  updateMobileMoneyProviders: vi.fn(),
  disableMobileMoney: vi.fn(),
}
vi.mock('@/features/payout/services/payoutService', () => ({ payoutService: () => svc }))

const inactive = { status: 'NOT_CONFIGURED', msisdnMasked: null, provider: null, providerLabel: null, country: null, currency: null, verifiedAt: null, providers: [] }
const active = {
  status: 'ACTIVE', msisdnMasked: '+221 77 *** ** 67', provider: 'WAVE_SEN', providerLabel: 'Wave', country: 'SN',
  currency: 'XOF', verifiedAt: '2026-10-01T10:00:00Z',
  providers: [{ code: 'WAVE_SEN', label: 'Wave' }, { code: 'ORANGE_SEN', label: 'Orange Money' }],
}
const catalogue = {
  country: 'SN', currency: 'XOF', msisdnMasked: '+221 77 *** ** 67', detected: 'WAVE_SEN',
  providers: [{ code: 'ORANGE_SEN', label: 'Orange Money', detected: false }, { code: 'WAVE_SEN', label: 'Wave', detected: true }],
}

async function mountCard() {
  const { default: Card } = await import('@/features/payout/components/MobileMoneyPayoutCard.vue')
  const w = mount(Card)
  await flushPromises()
  return w
}

describe('MobileMoneyPayoutCard', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.values(svc).forEach((f) => f.mockReset())
    svc.fetchMobileMoneyAccount.mockResolvedValue(inactive)
  })

  it('active le versement : numéro, réseau détecté coché, activation', async () => {
    svc.lookupMobileMoneyProviders.mockResolvedValue(catalogue)
    svc.activateMobileMoney.mockResolvedValue(active)
    const w = await mountCard()
    expect((w.find('[data-test="mm-payout-lookup"]').element as HTMLButtonElement).disabled).toBe(true)
    await w.find('[data-test="mm-payout-phone"]').setValue('+221771234567')
    await w.find('[data-test="mm-payout-lookup"]').trigger('submit')
    await flushPromises()
    expect(svc.lookupMobileMoneyProviders).toHaveBeenCalledWith('+221771234567')
    expect((w.find('[data-test="mm-payout-provider-WAVE_SEN"]').element as HTMLInputElement).checked).toBe(true)
    expect((w.find('[data-test="mm-payout-provider-ORANGE_SEN"]').element as HTMLInputElement).checked).toBe(false)
    await w.find('[data-test="mm-payout-provider-ORANGE_SEN"]').setValue(true)
    await w.find('[data-test="mm-payout-activate"]').trigger('click')
    await flushPromises()
    expect(svc.activateMobileMoney).toHaveBeenCalledWith('+221771234567', ['WAVE_SEN', 'ORANGE_SEN'])
    expect(w.find('[data-test="mm-payout-active"]').text()).toContain('Activé')
    expect(w.find('[data-test="mm-payout-number"]').text()).toBe('+221 77 *** ** 67')
  })

  it('refuse d\'activer sans réseau coché', async () => {
    svc.lookupMobileMoneyProviders.mockResolvedValue(catalogue)
    const w = await mountCard()
    await w.find('[data-test="mm-payout-phone"]').setValue('+221771234567')
    await w.find('[data-test="mm-payout-lookup"]').trigger('submit')
    await flushPromises()
    await w.find('[data-test="mm-payout-provider-WAVE_SEN"]').setValue(false)
    expect((w.find('[data-test="mm-payout-activate"]').element as HTMLButtonElement).disabled).toBe(true)
    expect(svc.activateMobileMoney).not.toHaveBeenCalled()
  })

  it('traduit le refus d\'un numéro invalide', async () => {
    svc.lookupMobileMoneyProviders.mockRejectedValue({ data: { code: 'mobile-money-invalid-phone', detail: 'raw' } })
    const w = await mountCard()
    await w.find('[data-test="mm-payout-phone"]').setValue('12')
    await w.find('[data-test="mm-payout-lookup"]').trigger('submit')
    await flushPromises()
    expect(w.find('[data-test="mm-payout-error"]').text()).toContain('invalide')
    expect(w.find('[data-test="mm-payout-catalogue"]').exists()).toBe(false)
  })

  it('modifie les réseaux d\'un compte actif sans ressaisir le numéro', async () => {
    svc.fetchMobileMoneyAccount.mockResolvedValue(active)
    svc.updateMobileMoneyProviders.mockResolvedValue({ ...active, providers: [{ code: 'WAVE_SEN', label: 'Wave' }] })
    const w = await mountCard()
    expect(w.find('[data-test="mm-payout-save"]').exists()).toBe(false)
    await w.find('[data-test="mm-payout-edit-ORANGE_SEN"]').setValue(false)
    await w.find('[data-test="mm-payout-save"]').trigger('click')
    await flushPromises()
    expect(svc.updateMobileMoneyProviders).toHaveBeenCalledWith(['WAVE_SEN'])
    expect(w.find('[data-test="mm-payout-save"]').exists()).toBe(false)
  })

  it('désactive le versement puis propose de le réactiver', async () => {
    svc.fetchMobileMoneyAccount.mockResolvedValue(active)
    svc.disableMobileMoney.mockResolvedValue({ ...active, status: 'DISABLED' })
    const w = await mountCard()
    await w.find('[data-test="mm-payout-disable"]').trigger('click')
    await flushPromises()
    expect(svc.disableMobileMoney).toHaveBeenCalled()
    expect(w.find('[data-test="mm-payout-setup"]').text()).toContain('réactiver')
  })

  it('masque la carte quand le rail est indisponible sur le serveur', async () => {
    svc.fetchMobileMoneyAccount.mockRejectedValue({ status: 503 })
    const w = await mountCard()
    expect(w.find('[data-test="mm-payout-card"]').exists()).toBe(false)
  })

  it('affiche une erreur de chargement pour un autre échec', async () => {
    svc.fetchMobileMoneyAccount.mockRejectedValue({ status: 500 })
    const w = await mountCard()
    expect(w.find('[data-test="mm-payout-error"]').text()).toContain('Impossible de charger')
  })
})
