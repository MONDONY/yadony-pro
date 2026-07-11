// tests/unit/features/cash/cashCommissionService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/cash/services/cashCommissionService')
  return mod.cashCommissionService
}

describe('cashCommissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('getMethod interroge GET /traveler/commission-method', async () => {
    mockApiFn.mockResolvedValue({ brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027, expirationStatus: 'VALID' })
    const svc = (await importService())()
    const res = await svc.getMethod()
    expect(mockApiFn).toHaveBeenCalledWith('/traveler/commission-method', {})
    expect(res?.last4).toBe('4242')
  })

  it('getMethod renvoie null sur 204 (aucune méthode)', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    const res = await svc.getMethod()
    expect(res).toBeNull()
  })

  it('detachMethod supprime via DELETE /traveler/commission-method', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const svc = (await importService())()
    await svc.detachMethod()
    expect(mockApiFn).toHaveBeenCalledWith('/traveler/commission-method', { method: 'DELETE' })
  })
})
