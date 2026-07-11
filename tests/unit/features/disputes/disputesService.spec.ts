// tests/unit/features/disputes/disputesService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

describe('disputesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('getMyDisputes interroge GET /disputes/me', async () => {
    mockApiFn.mockResolvedValue([
      { id: 'd1', bidId: 'b1', type: 'DAMAGED', status: 'OPEN', refundFrozen: true, createdAt: '2026-07-01T10:00:00' },
    ])
    const { disputesService } = await import('@/features/disputes/services/disputesService')
    const res = await disputesService().getMyDisputes()
    expect(mockApiFn).toHaveBeenCalledWith('/disputes/me', {})
    expect(res).toHaveLength(1)
    expect(res[0].status).toBe('OPEN')
  })
})
