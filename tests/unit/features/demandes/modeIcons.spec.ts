import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('lucide-vue-next', () => {
  const icon = (name: string) => ({ template: `<svg data-icon="${name}" />` })
  return {
    Plane: icon('Plane'), Ship: icon('Ship'), Car: icon('Car'), Route: icon('Route'),
    Layers: icon('Layers'), ChevronDown: icon('ChevronDown'), Plus: icon('Plus'), XCircle: icon('XCircle'),
    Check: icon('Check'), Star: icon('Star'),
  }
})

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/features/negociations/services/negotiationService', () => ({
  negotiationService: () => ({ startNegotiation: vi.fn() }),
}))

const request = (over: Record<string, unknown> = {}) => ({
  id: 'r1', tripId: 't1', tripCorridor: 'Paris → Dakar', tripDepartureDate: '2026-08-01',
  tripAvailableKg: 10, senderId: 's1', senderName: 'Alice Ba', senderInitials: 'AB', senderAvatarUrl: null,
  senderRating: 4, senderTotalSent: 3, weightKg: 5, contentType: 'Vêtements', budgetPerKg: 8,
  packagePhotoUrl: null, messageExcerpt: '', matchScore: 90, requestedAt: '2026-07-01T10:00:00', ...over,
})

describe('TripSelector : icône du mode du trajet', () => {
  async function selector(mode: string | null | undefined, extra: Record<string, unknown> = {}) {
    const { default: C } = await import('@/features/demandes/components/TripSelector.vue')
    return mount(C, {
      props: {
        trips: [{ tripId: 't1', tripCorridor: 'Paris → Dakar', tripDepartureDate: '2026-08-01', tripAvailableKg: 20, tripTransportMode: mode, matchCount: 2, ...extra }],
        modelValue: 't1',
        totalCount: 2,
      },
      global: { stubs: { NuxtLink: true } },
    })
  }

  it('BOAT = Ship, jamais l’avion', async () => {
    const w = await selector('BOAT')
    expect(w.find('[data-icon="Ship"]').exists()).toBe(true)
    expect(w.find('[data-icon="Plane"]').exists()).toBe(false)
  })

  it('mode absent (ancien back) : icône neutre Route', async () => {
    const w = await selector(undefined)
    expect(w.find('[data-icon="Route"]').exists()).toBe(true)
    expect(w.find('[data-icon="Plane"]').exists()).toBe(false)
  })

  it('trajet bateau sans kilos : pas de « kg dispo »', async () => {
    const w = await selector('BOAT', { tripAvailableKg: null })
    expect(w.text()).not.toContain('kg dispo')
    expect(w.text()).not.toContain('null')
  })
})

describe('MatchingRequestGroup', () => {
  async function group(mode: string | null | undefined) {
    const { default: C } = await import('@/features/demandes/components/MatchingRequestGroup.vue')
    return mount(C, {
      props: {
        tripId: 't1', tripCorridor: 'Paris → Dakar',
        requests: [request({ tripTransportMode: mode })],
        negotiatingId: null, negotiatedIds: new Set<string>(),
      },
      global: { stubs: { MatchingRequestCard: true } },
    })
  }

  it('icône du mode du trajet, Route sans mode', async () => {
    expect((await group('CAR')).find('[data-icon="Car"]').exists()).toBe(true)
    const neutral = await group(undefined)
    expect(neutral.find('[data-icon="Route"]').exists()).toBe(true)
    expect(neutral.find('[data-icon="Plane"]').exists()).toBe(false)
  })
})

describe('NegotiationStartModal', () => {
  async function modal(over: Record<string, unknown> = {}) {
    const { default: C } = await import('@/features/negociations/components/NegotiationStartModal.vue')
    return mount(C, { props: { request: request(over) }, global: { stubs: { Teleport: true } } })
  }

  it('icône du mode du trajet', async () => {
    const w = await modal({ tripTransportMode: 'BOAT', tripAvailableKg: null })
    expect(w.find('[data-icon="Ship"]').exists()).toBe(true)
    expect(w.text()).not.toContain('kg dispo')
  })

  it('trajet avion : kilos dispo affichés', async () => {
    const w = await modal({ tripTransportMode: 'PLANE' })
    expect(w.find('[data-icon="Plane"]').exists()).toBe(true)
    expect(w.text()).toContain('kg dispo')
  })
})
