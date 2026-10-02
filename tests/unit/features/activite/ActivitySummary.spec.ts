import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockApi = vi.fn()
vi.mock('@/composables/useApi', () => ({ useApi: () => mockApi }))

const NuxtLink = { props: ['to'], template: '<a :href="to"><slot /></a>' }

const payloads: Record<string, unknown> = {
  '/travelers/me/trips-summary': {
    activeTrips: 2, kgSold: 14.5, revenue: 320, tripsPublished: 5, parcelsSent: 1,
    period: '30d', revenueCurrency: 'EUR', revenueConverted: true,
  },
  '/travelers/me/trips-summary/revenues': {
    period: '30d', deliveries: 3,
    groups: [
      { currency: 'EUR', total: 90, deliveries: 1, items: [
        { tripId: 't1', departureCity: 'Paris', arrivalCity: 'Dakar', date: '2026-09-10', weightKg: 5, rail: 'CARD', amount: 90 },
      ] },
      { currency: 'XOF', total: 60000, deliveries: 2, items: [
        { tripId: 't2', departureCity: 'Dakar', arrivalCity: 'Paris', date: '2026-09-12', weightKg: 4, rail: 'MOBILE_MONEY', amount: 35000 },
        { tripId: 't2', departureCity: 'Dakar', arrivalCity: 'Paris', date: '2026-09-12', weightKg: 3, rail: 'CASH', amount: 25000 },
      ] },
    ],
  },
  '/travelers/me/trips-summary/kg-sold': {
    period: '30d', totalKg: 12, parcels: 3,
    trips: [{ tripId: 't2', departureCity: 'Dakar', arrivalCity: 'Paris', date: '2026-09-12', parcels: 2, kg: 7 }],
  },
}

async function mountSummary() {
  const { default: ActivitySummary } = await import('@/features/activite/components/ActivitySummary.vue')
  const w = mount(ActivitySummary, { global: { stubs: { NuxtLink } } })
  await flushPromises()
  return w
}

const compact = (s: string) => s.replace(/[\s  ]/g, '')

describe('ActivitySummary', () => {
  beforeEach(() => {
    vi.resetModules()
    mockApi.mockReset()
    mockApi.mockImplementation((url: string) => Promise.resolve(payloads[url]))
  })

  it('affiche les chiffres clés, avec « estimation » quand le revenu est converti', async () => {
    const w = await mountSummary()
    const kpis = w.find('[data-test="summary-kpis"]')
    expect(kpis.text()).toContain('Revenus (estimation)')
    expect(compact(kpis.text())).toContain('320,00€')
    expect(kpis.text()).toContain('Trajets actifs')
    expect(compact(kpis.text())).toContain('14,5kg')
  })

  it('sépare les revenus par devise avec le rail de chaque paiement', async () => {
    const w = await mountSummary()
    const xof = w.find('[data-test="revenue-group-XOF"]')
    expect(compact(xof.text())).toContain('60000FCFA')
    expect(xof.text()).toContain('Mobile money')
    expect(xof.text()).toContain('Espèces')
    expect(w.find('[data-test="revenue-group-EUR"]').text()).toContain('Carte')
  })

  it('liste les kilos livrés par trajet avec un lien vers le trajet', async () => {
    const w = await mountSummary()
    const block = w.find('[data-test="summary-kg-sold"]')
    expect(block.find('a').attributes('href')).toBe('/trajets/t2')
    expect(compact(block.text())).toContain('7kg')
  })

  it('change de période au clic', async () => {
    const w = await mountSummary()
    await w.find('[data-test="summary-period-7d"]').trigger('click')
    await flushPromises()
    expect(mockApi).toHaveBeenCalledWith('/travelers/me/trips-summary', { query: { period: '7d' } })
  })

  it('montre des états vides sans livraison', async () => {
    mockApi.mockImplementation((url: string) => Promise.resolve(
      url.endsWith('/revenues') ? { period: '30d', deliveries: 0, groups: [] }
        : url.endsWith('/kg-sold') ? { period: '30d', totalKg: 0, parcels: 0, trips: [] }
          : payloads[url],
    ))
    const w = await mountSummary()
    expect(w.find('[data-test="summary-revenues-empty"]').exists()).toBe(true)
    expect(w.find('[data-test="summary-kg-empty"]').exists()).toBe(true)
  })

  it('propose de réessayer quand tout échoue', async () => {
    mockApi.mockRejectedValue(new Error('down'))
    const w = await mountSummary()
    expect(w.find('[data-test="summary-error"]').text()).toContain('Impossible de charger')
  })
})
