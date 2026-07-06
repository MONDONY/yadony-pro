import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

async function importService() {
  const mod = await import('@/features/pricing/services/pricingService')
  return mod.pricingService
}

describe('pricingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('fetchMarketPrice calls GET /announcements/market-price with the corridor query', async () => {
    mockApiFn.mockResolvedValue({ median: 12.5, currency: 'EUR' })
    const svc = (await importService())()
    const result = await svc.fetchMarketPrice('PARIS_DAKAR')
    expect(mockApiFn).toHaveBeenCalledWith('/announcements/market-price', { query: { corridor: 'PARIS_DAKAR' } })
    expect(result.median).toBe(12.5)
  })

  it('fetchCommissionRate calls GET /config/commission-rate', async () => {
    mockApiFn.mockResolvedValue({ rate: 0.12 })
    const svc = (await importService())()
    const result = await svc.fetchCommissionRate()
    expect(mockApiFn).toHaveBeenCalledWith('/config/commission-rate')
    expect(result.rate).toBe(0.12)
  })
})
