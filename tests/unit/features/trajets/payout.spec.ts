import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { isDepositPayout, payoutMomentLabel, parcelPayoutLabel, payoutHint } from '@/features/trajets/lib/payout'
import TripDetailOverview from '@/features/trajets/components/TripDetailOverview.vue'
import TripDetailRevenue from '@/features/trajets/components/TripDetailRevenue.vue'
import TripBidDetailPanel from '@/features/trajets/components/TripBidDetailPanel.vue'

describe('payout', () => {
  it('bateau : versé au dépôt ; autres modes : à la livraison', () => {
    expect(payoutMomentLabel({ transportMode: 'BOAT' })).toBe('Versé au dépôt de chaque colis')
    for (const mode of ['CAR', 'BUS', 'PLANE', 'TRAIN', 'OTHER'] as const) {
      expect(payoutMomentLabel({ transportMode: mode })).toBe('Versé à la livraison de chaque colis')
    }
    expect(parcelPayoutLabel('BOAT')).toBe('Versé au transporteur au dépôt du colis')
    expect(parcelPayoutLabel('CAR')).toBe('Versé au transporteur à la livraison du colis')
    expect(parcelPayoutLabel(null)).toBe('Versé au transporteur à la livraison du colis')
    expect(payoutHint({ transportMode: 'BOAT' })).toBe('Les colis déposés déclenchent le virement.')
    expect(payoutHint({ transportMode: 'CAR' })).toBe('Les colis livrés déclenchent le virement.')
  })

  it('un payoutTrigger servi par le back prime sur le mode', () => {
    expect(isDepositPayout({ transportMode: 'CAR' }, 'DEPOSIT')).toBe(true)
    expect(isDepositPayout({ transportMode: 'BOAT' }, 'DELIVERY')).toBe(false)
  })
})

const place = { placeId: '', label: 'Marseille', lat: 0, lng: 0 }
const trip = (over: Record<string, unknown> = {}) => ({
  id: 't1', status: 'ACTIVE', departureCity: place, arrivalCity: place, departureDate: '2030-06-01',
  departureTime: null, arrivalTime: null, arrivalDate: null, transportMode: 'CAR', pickupPlace: place,
  dropoffPlace: place, availableWeightKg: 10, usedWeightKg: 0, pricePerKg: 8, acceptedCategories: [],
  refusedCategories: [], senderNote: null, cashAccepted: false, handoverDeadline: null,
  confirmedParcelCount: 0, pendingBidCount: 0, reservedRevenueEuros: 0, createdAt: '2030-01-01T00:00:00Z', ...over,
}) as never

describe('textes du paiement dans les écrans du trajet', () => {
  it('vue générale : moment du versement selon le mode', () => {
    const boat = mount(TripDetailOverview, { props: { trip: trip({ transportMode: 'BOAT', availableWeightKg: null, volumeCapacityM3: 12, pricePerKg: null, pricePerM3: 600 }) } })
    expect(boat.get('[data-test="payout-moment"]').text()).toBe('Versé au dépôt de chaque colis')
    const car = mount(TripDetailOverview, { props: { trip: trip() } })
    expect(car.get('[data-test="payout-moment"]').text()).toBe('Versé à la livraison de chaque colis')
  })

  it('onglet revenus : ce qui déclenche le virement', () => {
    const kpis = { fillRatePct: 0, grossRevenueEuros: 0, commissionEuros: 0, netRevenueEuros: 0, revenuePerKg: 0 } as never
    const boat = mount(TripDetailRevenue, { props: { trip: trip({ transportMode: 'BOAT', availableWeightKg: null, volumeCapacityM3: 12 }), kpis } })
    expect(boat.get('[data-test="revenue-hint"]').text()).toContain('Les colis déposés déclenchent le virement.')
    const car = mount(TripDetailRevenue, { props: { trip: trip(), kpis } })
    expect(car.get('[data-test="revenue-hint"]').text()).toContain('Les colis livrés déclenchent le virement.')
  })

  it('fiche colis : versé au dépôt en bateau, rien sans mode', () => {
    const bid = { id: 'b1', senderId: 's', senderName: 'A B', senderInitials: 'AB', senderTotalShipments: 1, weightKg: 8, currency: 'EUR',
      contentDescription: 'x', status: 'ACCEPTED', paymentAmountEuros: 64, earningsEuros: 56, paymentMethod: 'STRIPE', createdAt: '2026-07-01T10:00:00' } as never
    const mountPanel = (transportMode?: string) => mount(TripBidDetailPanel, {
      props: { bid, transportMode }, global: { stubs: { teleport: true } },
    })
    expect(mountPanel('BOAT').get('[data-test="detail-payout-moment"]').text()).toBe('Versé au transporteur au dépôt du colis')
    expect(mountPanel('CAR').get('[data-test="detail-payout-moment"]').text()).toBe('Versé au transporteur à la livraison du colis')
    expect(mountPanel().find('[data-test="detail-payout-moment"]').exists()).toBe(false)
  })
})
