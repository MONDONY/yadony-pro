import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const NuxtLink = {
  name: 'NuxtLink',
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

vi.mock('lucide-vue-next', () => ({
  Plane: { template: '<svg data-icon="Plane" />' },
  Car: { template: '<svg data-icon="Car" />' },
  Bus: { template: '<svg data-icon="Bus" />' },
  Bike: { template: '<svg data-icon="Bike" />' },
  Footprints: { template: '<svg data-icon="Footprints" />' },
  Package: { template: '<svg data-icon="Package" />' },
  Clock: { template: '<svg data-icon="Clock" />' },
  Euro: { template: '<svg data-icon="Euro" />' },
  ChevronRight: { template: '<svg data-icon="ChevronRight" />' },
}))

async function mountTripCard(props: object) {
  const { default: TripCard } = await import('@/features/trajets/components/TripCard.vue')
  return mount(TripCard, { props, global: { stubs: { NuxtLink } } })
}

const baseTripProps = {
  id: 'trip-1',
  status: 'ACTIVE' as const,
  departureCity: { placeId: 'p1', label: 'Paris', lat: 48.85, lng: 2.35 },
  arrivalCity: { placeId: 'p2', label: 'Dakar', lat: 14.69, lng: -17.44 },
  departureDate: '2026-06-01',
  departureTime: null,
  arrivalTime: null,
  transportMode: 'PLANE' as const,
  pickupPlace: { placeId: 'p1', label: '12 rue de la Paix', lat: 48.86, lng: 2.33 },
  dropoffPlace: { placeId: 'p2', label: 'CDG', lat: 49.01, lng: 2.55 },
  availableWeightKg: 20,
  usedWeightKg: 15,
  pricePerKg: 7,
  acceptedCategories: [],
  refusedCategories: [],
  senderNote: null,
  cashAccepted: false,
  handoverDeadline: null,
  confirmedParcelCount: 3,
  pendingBidCount: 2,
  reservedRevenueEuros: 105,
  createdAt: '2026-05-01T00:00:00Z',
}

describe('TripCard', () => {
  it('renders corridor (departure → arrival)', async () => {
    const wrapper = await mountTripCard(baseTripProps)
    expect(wrapper.text()).toContain('Paris')
    expect(wrapper.text()).toContain('Dakar')
  })

  it('shows capacity bar with correct fill percentage', async () => {
    const wrapper = await mountTripCard(baseTripProps) // 15/20 = 75%
    const bar = wrapper.find('[data-test="capacity-bar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('style')).toContain('75%')
  })

  it('capacity bar is success when fill >= 70%', async () => {
    const wrapper = await mountTripCard(baseTripProps) // 75%
    const bar = wrapper.find('[data-test="capacity-bar"]')
    expect(bar.classes().join(' ')).toContain('success')
  })

  it('capacity bar is warning when fill is 30-69%', async () => {
    const wrapper = await mountTripCard({ ...baseTripProps, usedWeightKg: 10 }) // 50%
    const bar = wrapper.find('[data-test="capacity-bar"]')
    expect(bar.classes().join(' ')).toContain('warning')
  })

  it('capacity bar is danger when fill < 30%', async () => {
    const wrapper = await mountTripCard({ ...baseTripProps, usedWeightKg: 2 }) // 10%
    const bar = wrapper.find('[data-test="capacity-bar"]')
    expect(bar.classes().join(' ')).toContain('danger')
  })

  it('shows confirmed parcels, pending bids, reserved revenue', async () => {
    const wrapper = await mountTripCard(baseTripProps)
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('105')
  })

  it('shows price per kg', async () => {
    const wrapper = await mountTripCard(baseTripProps)
    expect(wrapper.text()).toContain('7')
    expect(wrapper.text()).toContain('/kg')
  })

  it('renders voir-bids link with correct URL', async () => {
    const wrapper = await mountTripCard(baseTripProps)
    const link = wrapper.find('[data-test="btn-voir-bids"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/trajets/trip-1?tab=bids')
  })

  it('renders modifier link with correct URL', async () => {
    const wrapper = await mountTripCard(baseTripProps)
    const link = wrapper.find('[data-test="btn-modifier"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('/trajets/trip-1/modifier')
  })

  it('shows "1 valise 23 kg" label when capacityUnit is SUITCASE_23KG', async () => {
    const wrapper = await mountTripCard({ ...baseTripProps, capacityUnit: 'SUITCASE_23KG' })
    expect(wrapper.text()).toContain('1 valise 23 kg')
  })

  it('shows "1 valise 32 kg" label when capacityUnit is SUITCASE_32KG', async () => {
    const wrapper = await mountTripCard({ ...baseTripProps, capacityUnit: 'SUITCASE_32KG' })
    expect(wrapper.text()).toContain('1 valise 32 kg')
  })

  it('does not show a valise label when capacityUnit is KG_FREE', async () => {
    const wrapper = await mountTripCard({ ...baseTripProps, capacityUnit: 'KG_FREE' })
    expect(wrapper.text()).not.toContain('valise')
  })

  it('does not show a valise label when capacityUnit is absent', async () => {
    const wrapper = await mountTripCard(baseTripProps)
    expect(wrapper.text()).not.toContain('valise')
  })

  it('affiche le badge Brouillon en variante warning pour un trajet DRAFT', async () => {
    const wrapper = await mountTripCard({ ...baseTripProps, status: 'DRAFT' })
    expect(wrapper.text()).toContain('Brouillon')
  })
})
