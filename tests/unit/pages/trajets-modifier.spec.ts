import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const getAnnouncement = vi.fn()
vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({ getAnnouncement }),
}))

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'b1' } }),
  useRouter: () => ({ push }),
}))

const NewAnnouncementForm = {
  name: 'NewAnnouncementForm',
  props: ['prefill', 'editTripId'],
  template: '<div data-test="form-stub" />',
}

const boatTrip = {
  id: 'b1', status: 'ACTIVE', transportMode: 'BOAT',
  departureCity: { placeId: '', label: 'Marseille', lat: 0, lng: 0 },
  arrivalCity: { placeId: '', label: 'Dakar', lat: 0, lng: 0 },
  volumeCapacityM3: 12, pricePerM3: 600,
}

beforeEach(() => {
  vi.resetModules()
  getAnnouncement.mockReset()
  push.mockReset()
  vi.stubGlobal('definePageMeta', () => {})
})

async function mountPage() {
  vi.doMock('@/features/trajets/components/NewAnnouncementForm.vue', () => ({ default: NewAnnouncementForm }))
  const { default: Page } = await import('../../../app/pages/trajets/[id]/modifier.vue')
  const w = mount(Page, { global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } } })
  await flushPromises()
  return w
}

describe('page /trajets/[id]/modifier', () => {
  it('un trajet bateau s’ouvre dans le formulaire, plus d’écran « Modifiable dans l’app »', async () => {
    getAnnouncement.mockResolvedValue(boatTrip)
    const w = await mountPage()
    expect(w.find('[data-test="boat-edit-disabled"]').exists()).toBe(false)
    expect(w.text()).not.toContain("Modifiable dans l'app")
    const form = w.findComponent(NewAnnouncementForm)
    expect(form.exists()).toBe(true)
    expect(form.props('prefill')).toEqual(boatTrip)
    expect(form.props('editTripId')).toBe('b1')
  })

  it('un échec de chargement affiche l’erreur', async () => {
    getAnnouncement.mockRejectedValue(new Error('x'))
    const w = await mountPage()
    expect(w.text()).toContain('Impossible de charger ce trajet.')
  })

  it('le formulaire soumis affiche « Trajet mis à jour »', async () => {
    getAnnouncement.mockResolvedValue(boatTrip)
    const w = await mountPage()
    w.findComponent(NewAnnouncementForm).vm.$emit('submitted', boatTrip)
    await flushPromises()
    expect(w.text()).toContain('Trajet mis à jour')
    await w.get('button.bg-primary').trigger('click')
    expect(push).toHaveBeenCalledWith('/trajets/b1')
  })
})
