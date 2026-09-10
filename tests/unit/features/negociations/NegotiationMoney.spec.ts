// tests/unit/features/negociations/NegotiationMoney.spec.ts
// Les montants d'un fil s'affichent dans la devise du fil, plus en « € » figé.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NegotiationCard from '@/features/negociations/components/NegotiationCard.vue'
import NegotiationMessageBubble from '@/features/negociations/components/NegotiationMessageBubble.vue'
import NegotiationCounterModal from '@/features/negociations/components/NegotiationCounterModal.vue'
import type { NegotiationThread } from '@/features/negociations/types'

const routerPush = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPush }) }))

const compact = (t: string) => t.replace(/[\s  ]/g, '')

const thread: NegotiationThread = {
  id: 'th-1',
  packageRequestId: 'pr-1',
  travelerId: 'trav-1',
  travelerAnnouncementId: 'ann-1',
  travelerTravelDate: '2026-06-15',
  travelerAvailableKg: 20,
  status: 'PENDING' as NegotiationThread['status'],
  currentPriceEur: 30000,
  currency: 'XOF',
  roundsCount: 1,
  lastActivityAt: '2026-05-16T08:00:00Z',
  createdAt: '2026-05-16T08:00:00Z',
  messages: [],
  paymentIntentClientSecret: null,
  travelerName: 'Moussa',
  travelerRating: 4.5,
  travelerTripsCount: 3,
  travelerPhotoUrl: null,
  departureCity: 'Bamako',
  arrivalCity: 'Abidjan',
  weightKg: 5,
  senderName: 'Fatou',
  isMyTurn: true,
  canAccept: true,
  canCounter: true,
  roundsRemaining: 2,
  linkedTrip: null,
}

describe('NegotiationCard', () => {
  it('affiche le prix courant dans la devise du fil', () => {
    const wrapper = mount(NegotiationCard, { props: { thread } })
    expect(compact(wrapper.text())).toContain('30000FCFA')
    expect(wrapper.text()).not.toContain('€')
  })

  it('retombe sur l’euro quand le fil ne porte pas de devise', () => {
    const wrapper = mount(NegotiationCard, { props: { thread: { ...thread, currency: undefined, currentPriceEur: 45 } } })
    expect(compact(wrapper.text())).toContain('45,00€')
  })
})

describe('NegotiationMessageBubble', () => {
  const message = {
    id: 'm1',
    threadId: 'th-1',
    fromUserId: 'trav-1',
    kind: 'COUNTER' as const,
    proposedPriceEur: 28000,
    body: null,
    createdAt: '2026-05-16T08:00:00Z',
  }

  it('affiche la proposition dans la devise transmise par le fil', () => {
    const wrapper = mount(NegotiationMessageBubble, {
      props: { message, isMine: true, currency: 'XOF' },
    })
    expect(compact(wrapper.text())).toContain('28000FCFA')
  })

  it('affiche en euros sans devise', () => {
    const wrapper = mount(NegotiationMessageBubble, {
      props: { message: { ...message, proposedPriceEur: 42.5 }, isMine: false },
    })
    expect(compact(wrapper.text())).toContain('42,50€')
  })
})

describe('NegotiationCounterModal', () => {
  it('borne la contre-offre au plafond mis à l’échelle et affiche le symbole de la devise', async () => {
    const wrapper = mount(NegotiationCounterModal, {
      props: { open: true, currentPriceEur: 30000, weightKg: 5, isLoading: false, currency: 'XOF' },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.find('[data-test="counter-price-currency"]').text()).toMatch(/F\s?CFA/)
    const input = wrapper.find('[data-test="counter-price-input"]')
    expect(input.attributes('max')).toBe('327979')
    expect(input.attributes('step')).toBe('1')
    expect(compact(wrapper.text())).toContain('6000FCFA/kg')

    await input.setValue(400000)
    expect((wrapper.find('[data-test="counter-submit-btn"]').element as HTMLButtonElement).disabled).toBe(true)
    await input.setValue(300000)
    expect((wrapper.find('[data-test="counter-submit-btn"]').element as HTMLButtonElement).disabled).toBe(false)
    await wrapper.find('[data-test="counter-submit-btn"]').trigger('click')
    expect(wrapper.emitted('submit')?.[0]).toEqual([300000, undefined])
  })

  it('accepte une contre-offre en euros au centime', async () => {
    const wrapper = mount(NegotiationCounterModal, {
      props: { open: true, currentPriceEur: 45, weightKg: 5, isLoading: false },
      global: { stubs: { Teleport: true } },
    })
    const input = wrapper.find('[data-test="counter-price-input"]')
    expect(input.attributes('max')).toBe('500')
    expect(input.attributes('step')).toBe('0.01')
    expect(wrapper.find('[data-test="counter-price-currency"]').text()).toBe('€')
    expect(compact(wrapper.text())).toContain('9,00€/kg')
  })

  it('se ferme, se réinitialise à l’ouverture et envoie le message avec la contre-offre', async () => {
    const wrapper = mount(NegotiationCounterModal, {
      props: { open: false, currentPriceEur: 45, weightKg: 5, isLoading: false },
      global: { stubs: { Teleport: true } },
    })
    expect(wrapper.find('[data-test="counter-price-input"]').exists()).toBe(false)
    await wrapper.setProps({ open: true })
    const input = wrapper.find('[data-test="counter-price-input"]')
    expect((input.element as HTMLInputElement).value).toBe('45')
    await input.setValue(40)
    await wrapper.find('[data-test="counter-message-input"]').setValue('  Ok à 40  ')
    await wrapper.find('[data-test="counter-submit-btn"]').trigger('click')
    expect(wrapper.emitted('submit')?.[0]).toEqual([40, 'Ok à 40'])
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('ne soumet pas pendant le chargement ni sous le plancher', async () => {
    const wrapper = mount(NegotiationCounterModal, {
      props: { open: true, currentPriceEur: 45, weightKg: 5, isLoading: true },
      global: { stubs: { Teleport: true } },
    })
    expect((wrapper.find('[data-test="counter-submit-btn"]').element as HTMLButtonElement).disabled).toBe(true)
    await wrapper.setProps({ isLoading: false })
    await wrapper.find('[data-test="counter-price-input"]').setValue(0)
    expect(wrapper.text()).not.toContain('/kg')
    expect((wrapper.find('[data-test="counter-submit-btn"]').element as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('NegotiationCard — navigation et états', () => {
  it('navigue vers le fil au clic et signale le tour du voyageur', async () => {
    const wrapper = mount(NegotiationCard, { props: { thread } })
    await wrapper.find('[data-test="neg-card-th-1"]').trigger('click')
    expect(routerPush).toHaveBeenCalledWith('/negociations/th-1')
    expect(wrapper.text()).toContain('Fatou')
  })

  it('affiche un fil terminé sans appel à l’action', () => {
    const wrapper = mount(NegotiationCard, {
      props: { thread: { ...thread, status: 'ACCEPTED' as NegotiationThread['status'], isMyTurn: false, canAccept: false, canCounter: false } },
    })
    expect(wrapper.find('[data-test="neg-card-th-1"]').exists()).toBe(true)
  })
})
