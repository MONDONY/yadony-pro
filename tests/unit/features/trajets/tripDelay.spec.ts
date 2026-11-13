import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AnnounceDelayModal from '@/features/trajets/components/AnnounceDelayModal.vue'
import TripDetailHeader from '@/features/trajets/components/TripDetailHeader.vue'
import TripDetailOverview from '@/features/trajets/components/TripDetailOverview.vue'
import { delayReasons, delayReasonLabel } from '@/features/trajets/lib/delayReasons'

const place = { placeId: '', label: 'Marseille', lat: 0, lng: 0 }
const baseTrip = {
  id: 't1', status: 'IN_PROGRESS', departureCity: place, arrivalCity: { ...place, label: 'Dakar' },
  departureDate: '2030-06-01', departureTime: null, arrivalTime: null, arrivalDate: null,
  transportMode: 'BOAT', pickupPlace: place, dropoffPlace: place, availableWeightKg: null, usedWeightKg: null,
  pricePerKg: null, volumeCapacityM3: 12, availableVolumeM3: 7.5, pricePerM3: 600,
  acceptedCategories: [], refusedCategories: [], senderNote: null, cashAccepted: false,
  handoverDeadline: null, confirmedParcelCount: 0, pendingBidCount: 0, reservedRevenueEuros: 0,
  createdAt: '2030-01-01T00:00:00Z', remainingReschedules: 2,
}
const asTrip = (over: Record<string, unknown> = {}) => ({ ...baseTrip, ...over }) as never

describe('delayReasons', () => {
  it('congestion au port réservée au bateau', () => {
    expect(delayReasons('BOAT')[0]).toEqual({ value: 'PORT_CONGESTION', label: 'Congestion au port' })
    expect(delayReasons('BOAT').map((r) => r.value)).toEqual(
      ['PORT_CONGESTION', 'WEATHER', 'EXTENDED_STOPOVER', 'TRANSPORT_DISRUPTION', 'OTHER'])
    expect(delayReasons('CAR').map((r) => r.value)).not.toContain('PORT_CONGESTION')
    expect(delayReasons('PLANE').map((r) => r.value)).not.toContain('PORT_CONGESTION')
    expect(delayReasons(null)[0]!.value).toBe('WEATHER')
  })

  it('libellé d’un motif, repli neutre pour un motif inconnu', () => {
    expect(delayReasonLabel('WEATHER')).toBe('Météo')
    expect(delayReasonLabel('INCONNU')).toBe('Retard')
    expect(delayReasonLabel(null)).toBe('Retard')
  })
})

describe('AnnounceDelayModal', () => {
  function mountModal(extra: Record<string, unknown> = {}) {
    return mount(AnnounceDelayModal, { props: { trip: asTrip(), isLoading: false, error: null, ...extra } })
  }
  const fill = async (w: ReturnType<typeof mountModal>, v: { min: string; max: string }) => {
    await w.get('[data-test="delay-arrival-min"]').setValue(v.min)
    await w.get('[data-test="delay-arrival-max"]').setValue(v.max)
  }

  it('fin avant début : soumission bloquée avec le message', async () => {
    const w = mountModal()
    await fill(w, { min: '2030-06-25', max: '2030-06-10' })
    expect(w.get('[data-test="delay-submit"]').attributes('disabled')).toBeDefined()
    expect(w.get('[data-test="delay-arrival-error"]').text()).toContain('au plus tard')
  })

  it('au-delà de départ + 120 jours : bloqué', async () => {
    const w = mountModal()
    await fill(w, { min: '2030-06-10', max: '2030-12-30' })
    expect(w.get('[data-test="delay-arrival-error"]').text()).toContain('120 jours')
    expect(w.get('[data-test="delay-submit"]').attributes('disabled')).toBeDefined()
  })

  it('fin déjà passée : bloqué', async () => {
    const w = mountModal({ trip: asTrip({ departureDate: '2020-01-01' }) })
    await fill(w, { min: '2020-01-10', max: '2020-01-20' })
    expect(w.get('[data-test="delay-arrival-error"]').text()).toContain('passée')
  })

  it('champs vides : bouton éteint sans message', () => {
    const w = mountModal()
    expect(w.get('[data-test="delay-submit"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-test="delay-arrival-error"]').exists()).toBe(false)
  })

  it('motifs d’un trajet route : sans congestion au port', () => {
    const w = mountModal({ trip: asTrip({ transportMode: 'CAR' }) })
    const labels = w.findAll('[data-test="delay-reason"] option').map((o) => o.text())
    expect(labels).not.toContain('Congestion au port')
    expect(labels[0]).toBe('Météo')
  })

  it('bateau : congestion au port proposée en premier', () => {
    const w = mountModal()
    expect(w.findAll('[data-test="delay-reason"] option')[0]!.text()).toBe('Congestion au port')
  })

  it('émet le payload complet, message rogné ou nul', async () => {
    const w = mountModal()
    await w.get('[data-test="delay-reason"]').setValue('WEATHER')
    await fill(w, { min: '2030-06-10', max: '2030-06-25' })
    await w.get('[data-test="delay-message"]').setValue('  Tempête  ')
    await w.get('[data-test="delay-submit"]').trigger('click')
    expect(w.emitted('submit')![0]![0]).toEqual({
      reason: 'WEATHER', arrivalDate: '2030-06-10', arrivalDateMax: '2030-06-25', message: 'Tempête',
    })
    await w.get('[data-test="delay-message"]').setValue('   ')
    await w.get('[data-test="delay-submit"]').trigger('click')
    expect((w.emitted('submit')![1]![0] as { message: unknown }).message).toBeNull()
  })

  it('n’émet rien tant que le formulaire est invalide', async () => {
    const w = mountModal()
    await w.get('[data-test="delay-submit"]').trigger('click')
    expect(w.emitted('submit')).toBeUndefined()
  })

  it('montre l’erreur serveur, le chargement et se ferme sur Annuler et le fond', async () => {
    const loading = mountModal({ isLoading: true })
    expect(loading.get('[data-test="delay-submit"]').text()).toBe('Envoi…')
    const w = mountModal({ error: '5 retards au plus par 24 heures. Réessayez plus tard.' })
    expect(w.get('[data-test="delay-error"]').text()).toContain('5 retards au plus')
    await w.get('[data-test="delay-cancel"]').trigger('click')
    await w.get('[data-test="delay-modal-backdrop"]').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(2)
  })
})

describe('TripDetailHeader : bouton de retard', () => {
  const stubs = { NuxtLink: { template: '<a><slot /></a>' } }
  const header = (over: Record<string, unknown>) =>
    mount(TripDetailHeader, { props: { trip: asTrip(over) }, global: { stubs } })

  it('seulement sur un trajet en cours, quel que soit le mode', async () => {
    expect(header({ status: 'ACTIVE' }).find('[data-test="btn-announce-delay"]').exists()).toBe(false)
    expect(header({ status: 'COMPLETED' }).find('[data-test="btn-announce-delay"]').exists()).toBe(false)
    for (const mode of ['BOAT', 'CAR', 'PLANE']) {
      const w = header({ status: 'IN_PROGRESS', transportMode: mode })
      expect(w.get('[data-test="btn-announce-delay"]').text()).toBe('Annoncer un retard')
    }
    const w = header({ status: 'IN_PROGRESS' })
    await w.get('[data-test="btn-announce-delay"]').trigger('click')
    expect(w.emitted('announce-delay')).toHaveLength(1)
  })
})

describe('TripDetailOverview : dernier retard', () => {
  it('affiche la nouvelle fourchette et le message', () => {
    const w = mount(TripDetailOverview, {
      props: {
        trip: asTrip({
          latestTripDelay: {
            id: 'd1', reason: 'PORT_CONGESTION', arrivalDate: '2027-01-10', arrivalDateMax: '2027-01-25',
            message: 'Quai saturé', announcedAt: '2027-01-02T10:00:00Z',
          },
        }),
      },
    })
    const block = w.get('[data-test="trip-latest-delay"]')
    expect(block.text()).toContain('Congestion au port. Nouvelle arrivée estimée : du 10 janvier 2027 au 25 janvier 2027.')
    expect(w.get('[data-test="trip-latest-delay-message"]').text()).toBe('Quai saturé')
  })

  it('rien sans retard ou sur un ancien back', () => {
    expect(mount(TripDetailOverview, { props: { trip: asTrip() } }).find('[data-test="trip-latest-delay"]').exists()).toBe(false)
    expect(mount(TripDetailOverview, { props: { trip: asTrip({ latestTripDelay: null }) } }).find('[data-test="trip-latest-delay"]').exists()).toBe(false)
  })
})
