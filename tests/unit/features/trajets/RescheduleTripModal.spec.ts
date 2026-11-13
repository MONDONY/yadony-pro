import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RescheduleTripModal from '@/features/trajets/components/RescheduleTripModal.vue'
import TripDetailHeader from '@/features/trajets/components/TripDetailHeader.vue'
import { rescheduleReasons } from '@/features/trajets/lib/rescheduleReasons'

const place = { placeId: '', label: 'Paris', lat: 0, lng: 0 }
const baseTrip = {
  id: 't1', status: 'ACTIVE', departureCity: place, arrivalCity: { ...place, label: 'Dakar' },
  departureDate: '2030-06-01', departureTime: '10:00', arrivalTime: null, arrivalDate: null,
  transportMode: 'PLANE', pickupPlace: place, dropoffPlace: place, availableWeightKg: 10, usedWeightKg: 0,
  pricePerKg: 8, acceptedCategories: [], refusedCategories: [], senderNote: null, cashAccepted: false,
  handoverDeadline: null, confirmedParcelCount: 0, pendingBidCount: 0, reservedRevenueEuros: 0,
  createdAt: '2030-01-01T00:00:00Z', remainingReschedules: 2,
} as never

function mountModal(extra: Record<string, unknown> = {}) {
  return mount(RescheduleTripModal, { props: { trip: baseTrip, isLoading: false, error: null, ...extra } })
}

describe('rescheduleReasons', () => {
  it('avion : Vol annulé / FLIGHT_CANCELLED', () => {
    expect(rescheduleReasons('PLANE')[0]).toEqual({ value: 'FLIGHT_CANCELLED', label: 'Vol annulé' })
  })

  it('route : Panne ou contretemps / TRANSPORT_CANCELLED', () => {
    expect(rescheduleReasons('BUS')[0]).toEqual({ value: 'TRANSPORT_CANCELLED', label: 'Panne ou contretemps' })
    expect(rescheduleReasons('CAR')[0]).toEqual({ value: 'TRANSPORT_CANCELLED', label: 'Panne ou contretemps' })
  })

  it('bateau et autres : Transport annulé', () => {
    expect(rescheduleReasons('BOAT')[0]).toEqual({ value: 'TRANSPORT_CANCELLED', label: 'Transport annulé' })
    expect(rescheduleReasons('TRAIN')[0].label).toBe('Transport annulé')
    expect(rescheduleReasons(null)[0].label).toBe('Transport annulé')
  })

  it('les deux autres motifs ne changent pas', () => {
    expect(rescheduleReasons('BOAT').slice(1).map((r) => r.value)).toEqual(['POSTPONED', 'OTHER'])
  })
})

describe('RescheduleTripModal', () => {
  it('désactive l\'envoi tant que les champs requis manquent', () => {
    const w = mountModal()
    expect((w.find('[data-test="reschedule-submit"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('affiche les reports restants', () => {
    expect(mountModal().find('[data-test="reschedule-remaining"]').text()).toContain('2 reports restants')
  })

  it('émet le payload complet une fois le formulaire valide', async () => {
    const w = mountModal()
    await w.find('[data-test="reschedule-reason"]').setValue('FLIGHT_CANCELLED')
    await w.find('[data-test="reschedule-departure-date"]').setValue('2030-06-10')
    await w.find('[data-test="reschedule-departure-time"]').setValue('22:00')
    await w.find('[data-test="reschedule-arrival-date"]').setValue('2030-06-11')
    await w.find('[data-test="reschedule-arrival-time"]').setValue('06:30')
    await w.find('[data-test="reschedule-deadline"]').setValue('2030-06-09')
    await w.find('[data-test="reschedule-note"]').setValue('  Vol annulé  ')
    await w.find('[data-test="reschedule-submit"]').trigger('click')
    const payload = w.emitted('submit')![0]![0] as Record<string, unknown>
    expect(payload).toMatchObject({
      departureDate: '2030-06-10', departureTime: '22:00', arrivalDate: '2030-06-11',
      arrivalTime: '06:30', reason: 'FLIGHT_CANCELLED', note: 'Vol annulé',
    })
    expect(typeof payload.handoverDeadline).toBe('string')
  })

  it('refuse la même date et la même heure que le trajet actuel', async () => {
    const w = mountModal()
    await w.find('[data-test="reschedule-departure-date"]').setValue('2030-06-01')
    await w.find('[data-test="reschedule-departure-time"]').setValue('10:00')
    await w.find('[data-test="reschedule-deadline"]').setValue('2030-05-30')
    expect(w.text()).toContain('date ou une heure différente')
    expect((w.find('[data-test="reschedule-submit"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('refuse une arrivée plus de 3 jours après le départ et une limite après le départ', async () => {
    const w = mountModal()
    await w.find('[data-test="reschedule-departure-date"]').setValue('2030-06-10')
    await w.find('[data-test="reschedule-departure-time"]').setValue('22:00')
    await w.find('[data-test="reschedule-arrival-date"]').setValue('2030-06-14')
    await w.find('[data-test="reschedule-deadline"]').setValue('2030-06-11')
    expect(w.text()).toContain('au plus 3 jours')
    expect(w.text()).toContain('doit précéder le départ')
    expect((w.find('[data-test="reschedule-submit"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('montre l\'erreur du serveur et se ferme sur Annuler', async () => {
    const w = mountModal({ error: 'Ce trajet a déjà été reporté deux fois.' })
    expect(w.find('[data-test="reschedule-error"]').text()).toContain('deux fois')
    await w.find('[data-test="reschedule-cancel"]').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })
})

import TripDetailOverview from '@/features/trajets/components/TripDetailOverview.vue'

describe('TripDetailOverview — audience', () => {
  it('affiche les personnes uniques et les vues via lien partagé', () => {
    const w = mount(TripDetailOverview, { props: { trip: baseTrip, insights: { uniqueViewerCount: 12, shareViewCount: 3 } } })
    expect(w.find('[data-test="audience-unique"]').text()).toBe('12')
    expect(w.find('[data-test="audience-share"]').text()).toContain('3')
  })

  it('accorde le singulier et masque le partage à zéro', () => {
    const w = mount(TripDetailOverview, { props: { trip: baseTrip, insights: { uniqueViewerCount: 1, shareViewCount: 0 } } })
    expect(w.find('[data-test="trip-audience"]').text()).toContain('1 personne a vu ce trajet')
    expect(w.find('[data-test="audience-share"]').exists()).toBe(false)
  })

  it('n\'affiche pas le bloc sans données', () => {
    const w = mount(TripDetailOverview, { props: { trip: baseTrip } })
    expect(w.find('[data-test="trip-audience"]').exists()).toBe(false)
  })
})

describe('TripDetailHeader — bouton Reporter', () => {
  const stubs = { NuxtLink: { template: '<a><slot /></a>' } }

  it('apparaît sur un trajet actif avec des reports restants', async () => {
    const w = mount(TripDetailHeader, { props: { trip: baseTrip }, global: { stubs } })
    await w.find('[data-test="btn-reschedule-trip"]').trigger('click')
    expect(w.emitted('reschedule')).toHaveLength(1)
  })

  it.each([
    ['DRAFT', 2],
    ['COMPLETED', 2],
    ['ACTIVE', 0],
  ])('est masqué pour le statut %s avec %s report(s) restant(s)', (status, remaining) => {
    const trip = { ...(baseTrip as object), status, remainingReschedules: remaining } as never
    const w = mount(TripDetailHeader, { props: { trip }, global: { stubs } })
    expect(w.find('[data-test="btn-reschedule-trip"]').exists()).toBe(false)
  })

  it('trajet route : motif adapté, report à J+10 accepté', async () => {
    const w = mountModal({ trip: { ...(baseTrip as object), transportMode: 'CAR' } })
    const options = w.findAll('[data-test="reschedule-reason"] option').map((o) => o.text())
    expect(options[0]).toBe('Panne ou contretemps')
    await w.find('[data-test="reschedule-departure-date"]').setValue('2030-06-10')
    await w.find('[data-test="reschedule-arrival-date"]').setValue('2030-06-20')
    expect(w.find('[data-test="reschedule-arrival-error"]').exists()).toBe(false)
  })

  it('trajet avion : report à J+10 refusé avec le plafond de 3 jours', async () => {
    const w = mountModal()
    await w.find('[data-test="reschedule-departure-date"]').setValue('2030-06-10')
    await w.find('[data-test="reschedule-arrival-date"]').setValue('2030-06-20')
    expect(w.find('[data-test="reschedule-arrival-error"]').text()).toContain('au plus 3 jours')
  })
})
