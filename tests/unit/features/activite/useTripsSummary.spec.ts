import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApi = vi.fn()
vi.mock('@/composables/useApi', () => ({ useApi: () => mockApi }))

const summary = {
  activeTrips: 2, kgSold: 14.5, revenue: 320, tripsPublished: 5, parcelsSent: 1,
  period: '30d', revenueCurrency: 'EUR', revenueConverted: true,
}
const revenues = {
  period: '30d', deliveries: 2,
  groups: [{ currency: 'XOF', total: 60000, deliveries: 2, items: [] }],
}
const kg = { period: '30d', totalKg: 14.5, parcels: 3, trips: [] }

function route(url: string) {
  if (url.endsWith('/revenues')) return Promise.resolve(revenues)
  if (url.endsWith('/kg-sold')) return Promise.resolve(kg)
  return Promise.resolve(summary)
}

async function load() {
  const { useTripsSummary } = await import('@/features/activite/composables/useTripsSummary')
  return useTripsSummary()
}

describe('useTripsSummary', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
  })

  it('charge le résumé et les deux détails pour la période choisie', async () => {
    mockApi.mockImplementation(route)
    const s = await load()
    await s.fetchAll()
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/trips-summary', { query: { period: '30d' } })
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/trips-summary/revenues', { query: { period: '30d' } })
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/trips-summary/kg-sold', { query: { period: '30d' } })
    expect(s.summary.value).toEqual(summary)
    expect(s.revenues.value?.groups[0]?.currency).toBe('XOF')
    expect(s.kgSold.value?.totalKg).toBe(14.5)
    expect(s.error.value).toBeNull()
    expect(s.isLoading.value).toBe(false)
  })

  it('setPeriod recharge avec la nouvelle période', async () => {
    mockApi.mockImplementation(route)
    const s = await load()
    await s.setPeriod('12m')
    expect(s.period.value).toBe('12m')
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/trips-summary', { query: { period: '12m' } })
  })

  it('garde le reste quand un détail échoue', async () => {
    mockApi.mockImplementation((url: string) =>
      url.endsWith('/revenues') ? Promise.reject(new Error('500')) : route(url))
    const s = await load()
    await s.fetchAll()
    expect(s.summary.value).toEqual(summary)
    expect(s.revenues.value).toBeNull()
    expect(s.kgSold.value).not.toBeNull()
    expect(s.error.value).toBeNull()
  })

  it('signale une erreur quand les trois appels échouent', async () => {
    mockApi.mockRejectedValue(new Error('down'))
    const s = await load()
    await s.fetchAll()
    expect(s.error.value).toMatch(/Impossible de charger/)
    expect(s.summary.value).toBeNull()
  })

  it('ignore la réponse périmée quand la période change entre-temps', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => { release = r })
    mockApi.mockImplementation(async (url: string, opts: { query: { period: string } }) => {
      if (opts.query.period === '30d') await gate
      return { ...(await route(url)), period: opts.query.period }
    })
    const s = await load()
    const slow = s.fetchAll()
    const fast = s.setPeriod('7d')
    await fast
    release()
    await slow
    expect((s.summary.value as { period: string }).period).toBe('7d')
  })
})
