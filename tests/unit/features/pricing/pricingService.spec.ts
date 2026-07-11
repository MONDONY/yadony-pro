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

  it('fetchCorridors appelle GET /cities/corridors/popular et mappe en PricingCorridor', async () => {
    mockApiFn.mockResolvedValue([
      { departureCity: 'Paris', departureCountry: 'FR', arrivalCity: 'Dakar', arrivalCountry: 'SN' },
      { departureCity: 'Lyon', departureCountry: 'FR', arrivalCity: 'Abidjan', arrivalCountry: 'CI' },
    ])
    const svc = (await importService())()
    const result = await svc.fetchCorridors()
    expect(mockApiFn).toHaveBeenCalledWith('/cities/corridors/popular', { query: { limit: 6 } })
    expect(result).toEqual([
      { key: 'PARIS_DAKAR', label: 'Paris → Dakar' },
      { key: 'LYON_ABIDJAN', label: 'Lyon → Abidjan' },
    ])
  })

  it('fetchCorridors normalise les accents dans la clé corridor', async () => {
    mockApiFn.mockResolvedValue([
      { departureCity: 'Genève', departureCountry: 'CH', arrivalCity: 'Bamako', arrivalCountry: 'ML' },
    ])
    const svc = (await importService())()
    const result = await svc.fetchCorridors()
    expect(result[0].key).toBe('GENEVE_BAMAKO')
    expect(result[0].label).toBe('Genève → Bamako')
  })

  it('fetchCorridors retombe sur la liste statique si le back échoue', async () => {
    mockApiFn.mockRejectedValue(new Error('boom'))
    const svc = (await importService())()
    const result = await svc.fetchCorridors()
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('key')
    expect(result[0]).toHaveProperty('label')
  })

  it('fetchCorridors retombe sur la liste statique si le back renvoie une liste vide', async () => {
    mockApiFn.mockResolvedValue([])
    const svc = (await importService())()
    const result = await svc.fetchCorridors()
    expect(result.length).toBeGreaterThan(0)
  })
})
