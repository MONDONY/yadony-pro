// tests/unit/features/cancellation/cancellationService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/cancellation/services/cancellationService')
  return mod.cancellationService
}

describe('cancellationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('reportNoShow POSTe /cancellations/bids/:id/report-noshow', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.reportNoShow('bid-1')
    expect(mockApiFn).toHaveBeenCalledWith('/cancellations/bids/bid-1/report-noshow', { method: 'POST' })
  })

  it('cancelAfterHandover POSTe /bids/:id/cancel-after-handover', async () => {
    mockApiFn.mockResolvedValue({ id: 'bid-1', status: 'CANCELLED' })
    const svc = (await importService())()
    await svc.cancelAfterHandover('bid-1')
    expect(mockApiFn).toHaveBeenCalledWith('/bids/bid-1/cancel-after-handover', { method: 'POST' })
  })

  it('confirmReturn POSTe le code à 6 chiffres et renvoie l’état du retour', async () => {
    mockApiFn.mockResolvedValue({ returnCode: null, returnDeadline: '2026-07-20T10:00:00', returnedAt: '2026-07-12T09:00:00' })
    const svc = (await importService())()
    const res = await svc.confirmReturn('bid-1', '123456')
    expect(mockApiFn).toHaveBeenCalledWith('/cancellations/bids/bid-1/confirm-return', {
      method: 'POST',
      body: { returnCode: '123456' },
    })
    expect(res.returnedAt).toBe('2026-07-12T09:00:00')
  })
})
