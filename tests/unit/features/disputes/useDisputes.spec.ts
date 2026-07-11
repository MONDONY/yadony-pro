// tests/unit/features/disputes/useDisputes.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetMyDisputes = vi.fn()

vi.mock('@/features/disputes/services/disputesService', () => ({
  disputesService: () => ({ getMyDisputes: mockGetMyDisputes }),
}))

describe('useDisputes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchDisputes charge la liste', async () => {
    mockGetMyDisputes.mockResolvedValue([
      { id: 'd1', bidId: 'b1', type: 'DAMAGED', status: 'OPEN', refundFrozen: false, createdAt: '2026-07-01' },
    ])
    const { useDisputes } = await import('@/features/disputes/composables/useDisputes')
    const { disputes, isLoading, fetchDisputes } = useDisputes()
    const p = fetchDisputes()
    expect(isLoading.value).toBe(true)
    await p
    expect(isLoading.value).toBe(false)
    expect(disputes.value).toHaveLength(1)
  })

  it('fetchDisputes pose une erreur en cas d’échec', async () => {
    mockGetMyDisputes.mockRejectedValue(new Error('boom'))
    const { useDisputes } = await import('@/features/disputes/composables/useDisputes')
    const { error, fetchDisputes } = useDisputes()
    await fetchDisputes()
    expect(error.value).toBe('Impossible de charger tes litiges.')
  })
})
