// tests/unit/composables/useCommissionRate.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApi = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApi,
}))

async function importComposable() {
  const mod = await import('@/composables/useCommissionRate')
  return mod
}

describe('useCommissionRate', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
  })

  it('getRate fetches the rate from GET /config/commission-rate', async () => {
    mockApi.mockResolvedValue({ rate: 0.15 })
    const { useCommissionRate } = await importComposable()
    const { getRate } = useCommissionRate()
    const rate = await getRate()
    expect(rate).toBe(0.15)
    expect(mockApi).toHaveBeenCalledWith('/config/commission-rate')
  })

  it('getRate shares a single in-flight request between concurrent callers', async () => {
    mockApi.mockResolvedValue({ rate: 0.1 })
    const { useCommissionRate } = await importComposable()
    const [a, b] = await Promise.all([useCommissionRate().getRate(), useCommissionRate().getRate()])
    expect([a, b]).toEqual([0.1, 0.1])
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('getRate caches the rate — a single API call for multiple invocations', async () => {
    mockApi.mockResolvedValue({ rate: 0.12 })
    const { useCommissionRate } = await importComposable()
    const { getRate } = useCommissionRate()
    await getRate()
    await getRate()
    await getRate()
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('getRate shares the cache across composable instances', async () => {
    mockApi.mockResolvedValue({ rate: 0.12 })
    const { useCommissionRate } = await importComposable()
    await useCommissionRate().getRate()
    await useCommissionRate().getRate()
    expect(mockApi).toHaveBeenCalledTimes(1)
  })

  it('getRate returns null (no invented rate) when the API call fails', async () => {
    mockApi.mockRejectedValue(new Error('network down'))
    const { useCommissionRate } = await importComposable()
    const rate = await useCommissionRate().getRate()
    expect(rate).toBeNull()
  })

  it('getRate returns null on an invalid payload', async () => {
    mockApi.mockResolvedValue({ rate: 'abc' })
    const { useCommissionRate } = await importComposable()
    const rate = await useCommissionRate().getRate()
    expect(rate).toBeNull()
  })

  it('does not cache a failure — retries on next call', async () => {
    mockApi.mockRejectedValueOnce(new Error('boom'))
    mockApi.mockResolvedValue({ rate: 0.18 })
    const { useCommissionRate } = await importComposable()
    const first = await useCommissionRate().getRate()
    const second = await useCommissionRate().getRate()
    expect(first).toBeNull()
    expect(second).toBe(0.18)
    expect(mockApi).toHaveBeenCalledTimes(2)
  })

  it('resetCommissionRateCache clears the cached value', async () => {
    mockApi.mockResolvedValue({ rate: 0.15 })
    const { useCommissionRate, resetCommissionRateCache } = await importComposable()
    await useCommissionRate().getRate()
    resetCommissionRateCache()
    await useCommissionRate().getRate()
    expect(mockApi).toHaveBeenCalledTimes(2)
  })
})
