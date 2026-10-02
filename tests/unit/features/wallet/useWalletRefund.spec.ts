import { describe, it, expect, vi, beforeEach } from 'vitest'

const svc = {
  listEligibleTopups: vi.fn(),
  requestRefund: vi.fn(),
  listRefundRequests: vi.fn(),
}
vi.mock('@/features/wallet/services/walletService', () => ({ walletService: () => svc }))

const topups = [
  { id: 'a', amount: 20, originalAmount: 20, paymentRef: 'pi_a', createdAt: '2026-09-01T10:00:00Z', feeAmount: 0.5 },
  { id: 'b', amount: 10, originalAmount: 30, paymentRef: 'pi_b', createdAt: '2026-09-05T10:00:00Z', feeAmount: 0.3 },
]
const created = { id: 'r1', currency: 'EUR', amount: 30, status: 'PENDING', requestedAt: '2026-10-01T10:00:00Z', resolvedAt: null, feeAmount: 0.8, netAmount: 29.2, rail: 'STRIPE', destinationMasked: '•••• 4242' }

async function load(onRequested?: () => void) {
  const { useWalletRefund } = await import('@/features/wallet/composables/useWalletRefund')
  return useWalletRefund(onRequested)
}

describe('useWalletRefund', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.values(svc).forEach((f) => f.mockReset())
  })

  it('charge les recharges remboursables, toutes cochées par défaut', async () => {
    svc.listEligibleTopups.mockResolvedValue(topups)
    const r = await load()
    await r.loadEligible('EUR')
    expect(svc.listEligibleTopups).toHaveBeenCalledWith('EUR')
    expect(r.selected.value).toEqual(['a', 'b'])
  })

  it('permet de décocher une recharge', async () => {
    svc.listEligibleTopups.mockResolvedValue(topups)
    const r = await load()
    await r.loadEligible('EUR')
    r.toggle('a')
    expect(r.selected.value).toEqual(['b'])
    r.toggle('a')
    expect(r.selected.value).toEqual(['b', 'a'])
  })

  it('demande le remboursement des recharges cochées puis notifie', async () => {
    svc.listEligibleTopups.mockResolvedValue(topups)
    svc.requestRefund.mockResolvedValue(created)
    const onRequested = vi.fn()
    const r = await load(onRequested)
    await r.loadEligible('EUR')
    r.toggle('b')
    await expect(r.request('EUR')).resolves.toEqual(created)
    expect(svc.requestRefund).toHaveBeenCalledWith('EUR', ['a'])
    expect(r.requests.value[0]).toEqual(created)
    expect(r.eligible.value).toEqual([])
    expect(onRequested).toHaveBeenCalledOnce()
  })

  it('ne demande rien sans sélection', async () => {
    const r = await load()
    await expect(r.request('EUR')).resolves.toBeNull()
    expect(svc.requestRefund).not.toHaveBeenCalled()
  })

  it('affiche le motif du serveur quand la demande est refusée', async () => {
    svc.listEligibleTopups.mockResolvedValue(topups)
    svc.requestRefund.mockRejectedValue({ data: { detail: 'Un remboursement est déjà en cours.' } })
    const r = await load()
    await r.loadEligible('EUR')
    await expect(r.request('EUR')).resolves.toBeNull()
    expect(r.error.value).toBe('Un remboursement est déjà en cours.')
    expect(r.isRequesting.value).toBe(false)
  })

  it('garde une liste vide quand le chargement échoue', async () => {
    svc.listEligibleTopups.mockRejectedValue(new Error('500'))
    svc.listRefundRequests.mockRejectedValue(new Error('500'))
    const r = await load()
    await r.loadEligible('EUR')
    await r.loadRequests()
    expect(r.eligible.value).toEqual([])
    expect(r.requests.value).toEqual([])
    expect(r.error.value).toMatch(/Impossible/)
  })
})
