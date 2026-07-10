import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TripBidDetailPanel from '@/features/trajets/components/TripBidDetailPanel.vue'
import type { TripBid } from '@/features/trajets/types/index'

function bid(over: Partial<TripBid> = {}): TripBid {
  return {
    id: 'b1',
    senderId: 's1',
    senderName: 'abou DIAKITE',
    senderInitials: 'AD',
    senderTotalShipments: 3,
    weightKg: 8,
    declaredValueEuros: 300,
    contentDescription: 'tee short',
    status: 'ACCEPTED',
    paymentAmountEuros: 64,
    earningsEuros: 56.32,
    paymentMethod: 'STRIPE',
    createdAt: '2026-07-01T10:00:00',
    ...over,
  }
}

// Le composant téléporte dans <body> ; on stub le teleport pour rendre inline
// et pouvoir interroger le contenu via wrapper.find.
function mountPanel(b: TripBid | null) {
  return mount(TripBidDetailPanel, {
    props: { bid: b },
    global: { stubs: { teleport: true } },
  })
}

describe('TripBidDetailPanel', () => {
  it('ne rend rien quand bid est null', () => {
    const wrapper = mountPanel(null)
    expect(wrapper.find('[data-test="trip-bid-detail"]').exists()).toBe(false)
  })

  it('ACCEPTED : montre confirmer présence, refuser, annuler', () => {
    const wrapper = mountPanel(bid({ status: 'ACCEPTED' }))
    expect(wrapper.find('[data-test="detail-confirm-presence"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="detail-refuse-parcel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="detail-cancel"]').exists()).toBe(true)
  })

  it('émet confirm-presence au clic', async () => {
    const wrapper = mountPanel(bid({ status: 'ACCEPTED' }))
    await wrapper.find('[data-test="detail-confirm-presence"]').trigger('click')
    expect(wrapper.emitted('confirm-presence')?.[0]).toEqual(['b1'])
  })

  it('refuser : révèle le champ raison puis émet refuse-parcel avec la raison (photo nulle)', async () => {
    const wrapper = mountPanel(bid({ status: 'ACCEPTED' }))
    await wrapper.find('[data-test="detail-refuse-parcel"]').trigger('click')
    const input = wrapper.find('[data-test="refuse-reason-input"]')
    expect(input.exists()).toBe(true)
    await input.setValue('contenu non conforme')
    await wrapper.find('[data-test="refuse-submit"]').trigger('click')
    expect(wrapper.emitted('refuse-parcel')?.[0]).toEqual(['b1', 'contenu non conforme', null])
  })

  it('refuser : propose un champ photo optionnel et émet le fichier choisi', async () => {
    const wrapper = mountPanel(bid({ status: 'ACCEPTED' }))
    await wrapper.find('[data-test="detail-refuse-parcel"]').trigger('click')
    const photoInput = wrapper.find('[data-test="refuse-photo-input"]')
    expect(photoInput.exists()).toBe(true)
    const file = new File(['x'], 'preuve.jpg', { type: 'image/jpeg' })
    Object.defineProperty(photoInput.element, 'files', { value: [file] })
    await photoInput.trigger('change')
    await wrapper.find('[data-test="refuse-reason-input"]').setValue('colis endommagé')
    await wrapper.find('[data-test="refuse-submit"]').trigger('click')
    expect(wrapper.emitted('refuse-parcel')?.[0]).toEqual(['b1', 'colis endommagé', file])
  })

  it('PAYMENT_ESCROWED : montre accepter et refuser', () => {
    const wrapper = mountPanel(bid({ status: 'PAYMENT_ESCROWED' }))
    expect(wrapper.find('[data-test="detail-accept"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="detail-reject"]').exists()).toBe(true)
  })

  it('IN_TRANSIT : émet request-delivery', async () => {
    const wrapper = mountPanel(bid({ status: 'IN_TRANSIT' }))
    await wrapper.find('[data-test="detail-request-delivery"]').trigger('click')
    expect(wrapper.emitted('request-delivery')).toBeTruthy()
  })

  it('émet close', async () => {
    const wrapper = mountPanel(bid())
    await wrapper.find('[data-test="detail-close"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
