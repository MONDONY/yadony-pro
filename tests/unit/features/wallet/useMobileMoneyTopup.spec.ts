import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'

const svc = {
  getMobileMoneyProviders: vi.fn(),
  startMobileMoneyTopup: vi.fn(),
  getTopupStatus: vi.fn(),
}
vi.mock('@/features/wallet/services/walletService', () => ({ walletService: () => svc }))

const providers = {
  country: 'SN', currency: 'XOF', msisdnMasked: '+221 77 *** ** 67', detected: 'WAVE_SEN',
  providers: [
    { code: 'ORANGE_SEN', label: 'Orange Money', detected: false },
    { code: 'WAVE_SEN', label: 'Wave', detected: true },
  ],
}
const started = {
  topupId: 'tp1', currency: 'XOF', provider: 'WAVE_SEN', providerLabel: 'Wave',
  msisdnMasked: '+221 77 *** ** 67', authorizationUrl: 'https://wave.test/pay',
}
const status = (s: string, extra = {}) => ({
  topupId: 'tp1', status: s, amount: 5000, currency: 'XOF', providerLabel: 'Wave',
  authorizationUrl: null, failureReason: null, walletBalance: 5000, ...extra,
})

async function setup(onConfirmed?: () => void) {
  const { useMobileMoneyTopup } = await import('@/features/wallet/composables/useMobileMoneyTopup')
  const scope = effectScope()
  const api = scope.run(() => useMobileMoneyTopup(onConfirmed))!
  return { api, scope }
}

describe('useMobileMoneyTopup', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    Object.values(svc).forEach((f) => f.mockReset())
  })
  afterEach(() => vi.useRealTimers())

  it('refuse de chercher les réseaux sans numéro', async () => {
    const { api } = await setup()
    await api.lookupProviders()
    expect(svc.getMobileMoneyProviders).not.toHaveBeenCalled()
    expect(api.error.value).toMatch(/numéro/)
  })

  it('présélectionne le réseau détecté et passe aux détails', async () => {
    svc.getMobileMoneyProviders.mockResolvedValue(providers)
    const { api } = await setup()
    api.phone.value = ' +221771234567 '
    await api.lookupProviders()
    expect(svc.getMobileMoneyProviders).toHaveBeenCalledWith('+221771234567')
    expect(api.step.value).toBe('details')
    expect(api.provider.value).toBe('WAVE_SEN')
    expect(api.currency.value).toBe('XOF')
  })

  it('affiche le message du serveur quand le numéro est refusé', async () => {
    svc.getMobileMoneyProviders.mockRejectedValue({ data: { code: 'x', detail: 'Pays non supporté.' } })
    const { api } = await setup()
    api.phone.value = '+33612345678'
    await api.lookupProviders()
    expect(api.step.value).toBe('phone')
    expect(api.error.value).toBe('Pays non supporté.')
  })

  async function toWaiting(onConfirmed?: () => void) {
    svc.getMobileMoneyProviders.mockResolvedValue(providers)
    svc.startMobileMoneyTopup.mockResolvedValue(started)
    const ctx = await setup(onConfirmed)
    ctx.api.phone.value = '+221771234567'
    await ctx.api.lookupProviders()
    await ctx.api.pay(5000)
    return ctx
  }

  it('lance la recharge puis relit le statut jusqu\'à confirmation', async () => {
    const onConfirmed = vi.fn()
    svc.getTopupStatus
      .mockResolvedValueOnce(status('PENDING'))
      .mockResolvedValueOnce(status('CONFIRMED'))
    const { api } = await toWaiting(onConfirmed)
    expect(svc.startMobileMoneyTopup).toHaveBeenCalledWith({ amount: 5000, phoneNumber: '+221771234567', provider: 'WAVE_SEN' })
    expect(api.step.value).toBe('waiting')
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.step.value).toBe('waiting')
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.step.value).toBe('done')
    expect(api.state.value?.status).toBe('CONFIRMED')
    expect(onConfirmed).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(10000)
    expect(svc.getTopupStatus).toHaveBeenCalledTimes(2)
  })

  it('s\'arrête sur un échec sans notifier de succès', async () => {
    const onConfirmed = vi.fn()
    svc.getTopupStatus.mockResolvedValue(status('FAILED', { failureReason: 'Solde insuffisant' }))
    const { api } = await toWaiting(onConfirmed)
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.step.value).toBe('done')
    expect(api.state.value?.failureReason).toBe('Solde insuffisant')
    expect(onConfirmed).not.toHaveBeenCalled()
  })

  it('survit à une lecture ratée et abandonne au bout de 3 minutes', async () => {
    svc.getTopupStatus.mockRejectedValue(new Error('network'))
    const { api } = await toWaiting()
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 3000)
    expect(api.timedOut.value).toBe(true)
    expect(api.step.value).toBe('waiting')
    const calls = svc.getTopupStatus.mock.calls.length
    await vi.advanceTimersByTimeAsync(30000)
    expect(svc.getTopupStatus).toHaveBeenCalledTimes(calls)
  })

  it('coupe la relecture quand la portée est détruite', async () => {
    svc.getTopupStatus.mockResolvedValue(status('PENDING'))
    const { scope } = await toWaiting()
    scope.stop()
    await vi.advanceTimersByTimeAsync(10000)
    expect(svc.getTopupStatus).not.toHaveBeenCalled()
  })

  it('signale l\'erreur du paiement refusé et reste sur les détails', async () => {
    svc.getMobileMoneyProviders.mockResolvedValue(providers)
    svc.startMobileMoneyTopup.mockRejectedValue({ data: { detail: 'Montant trop faible.' } })
    const { api } = await setup()
    api.phone.value = '+221771234567'
    await api.lookupProviders()
    await api.pay(10)
    expect(api.step.value).toBe('details')
    expect(api.error.value).toBe('Montant trop faible.')
  })

  it('reset revient au numéro et coupe la relecture', async () => {
    svc.getTopupStatus.mockResolvedValue(status('PENDING'))
    const { api } = await toWaiting()
    api.reset()
    expect(api.step.value).toBe('phone')
    await vi.advanceTimersByTimeAsync(10000)
    expect(svc.getTopupStatus).not.toHaveBeenCalled()
  })
})
