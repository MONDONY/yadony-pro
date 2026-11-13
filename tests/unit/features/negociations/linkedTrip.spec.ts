import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { linkedTripCapacityLabel } from '@/features/negociations/lib/linkedTripCapacity'

vi.mock('lucide-vue-next', () => ({
  Plane: { template: '<svg data-icon="Plane" />' },
  Ship: { template: '<svg data-icon="Ship" />' },
  Car: { template: '<svg data-icon="Car" />' },
  Route: { template: '<svg data-icon="Route" />' },
  ChevronRight: { template: '<svg data-icon="ChevronRight" />' },
}))

const trip = (mode: string | null, extra: Record<string, unknown> = {}) => ({
  announcementId: 'a1',
  departureCity: 'Paris',
  arrivalCity: 'Dakar',
  departureDate: '2026-12-01',
  departureTime: null,
  transportMode: mode,
  pickupAddressLabel: null,
  deliveryAddressLabel: null,
  availableKg: 12,
  description: null,
  ...extra,
})

describe('linkedTripCapacityLabel', () => {
  it('kilos, m³ ou rien', () => {
    expect(linkedTripCapacityLabel({ availableKg: 12 })).toBe('12 kg')
    expect(linkedTripCapacityLabel({ availableKg: null, availableVolumeM3: 7.5 })).toBe('7,5 m³')
    expect(linkedTripCapacityLabel({})).toBeNull()
  })
})

describe('NegotiationLinkedTripBanner', () => {
  async function banner(mode: string | null, extra = {}) {
    const { default: C } = await import('@/features/negociations/components/NegotiationLinkedTripBanner.vue')
    return mount(C, { props: { trip: trip(mode, extra) } })
  }

  it('BUS = Car, BOAT = Ship, inconnu = Route', async () => {
    expect((await banner('BUS')).find('[data-icon="Car"]').exists()).toBe(true)
    expect((await banner('BOAT')).find('[data-icon="Ship"]').exists()).toBe(true)
    expect((await banner(null)).find('[data-icon="Route"]').exists()).toBe(true)
    expect((await banner(null)).find('[data-icon="Plane"]').exists()).toBe(false)
  })

  it('trajet bateau sans kilos : affiche le volume, pas de « null kg »', async () => {
    const w = await banner('BOAT', { availableKg: null, availableVolumeM3: 7.5 })
    expect(w.text()).toContain('7,5 m³')
    expect(w.text()).not.toContain('null')
  })
})

describe('NegotiationTripDetailModal', () => {
  async function modal(mode: string | null, extra = {}) {
    const { default: C } = await import('@/features/negociations/components/NegotiationTripDetailModal.vue')
    return mount(C, { props: { open: true, trip: trip(mode, extra) }, global: { stubs: { Transition: false } } })
  }

  it('BOAT = Bateau, BUS = Route', async () => {
    expect((await modal('BOAT')).text()).toContain('Bateau')
    expect((await modal('BUS')).text()).toContain('Route')
  })

  it('volume pour un trajet bateau', async () => {
    const w = await modal('BOAT', { availableKg: null, availableVolumeM3: 3 })
    expect(w.text()).toContain('Volume dispo')
    expect(w.text()).toContain('3 m³')
  })
})

describe('NegotiationCard', () => {
  it('la date du fil porte un calendrier, jamais un avion', async () => {
    vi.doMock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
    vi.doMock('lucide-vue-next', () => ({
      CalendarDays: { template: '<svg data-icon="CalendarDays" />' },
      AlertTriangle: { template: '<svg data-icon="AlertTriangle" />' },
      Plane: { template: '<svg data-icon="Plane" />' },
    }))
    vi.resetModules()
    const { default: C } = await import('@/features/negociations/components/NegotiationCard.vue')
    const w = mount(C, {
      props: {
        thread: {
          id: 't1', packageRequestId: 'r1', travelerId: 'u1', travelerAnnouncementId: null,
          travelerTravelDate: '2026-12-01', travelerAvailableKg: 10, status: 'OPEN', currentPriceEur: 50,
          roundsCount: 1, lastActivityAt: new Date().toISOString(), createdAt: new Date().toISOString(),
          messages: [], paymentIntentClientSecret: null, travelerName: 'A B', travelerRating: null,
          travelerTripsCount: 0, travelerPhotoUrl: null, departureCity: 'Paris', arrivalCity: 'Dakar',
          weightKg: 3, senderName: 'Jean Dupont', isMyTurn: false, canAccept: false, canCounter: false,
          roundsRemaining: 4, linkedTrip: null,
        },
      },
    })
    expect(w.find('[data-icon="CalendarDays"]').exists()).toBe(true)
    expect(w.find('[data-icon="Plane"]').exists()).toBe(false)
  })
})
