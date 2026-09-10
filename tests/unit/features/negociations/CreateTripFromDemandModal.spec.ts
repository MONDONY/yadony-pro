import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateAnnouncement = vi.fn()
const mockStartNegotiation = vi.fn()

vi.mock('@/features/trajets/services/tripsService', () => ({
  tripsService: () => ({ createAnnouncement: mockCreateAnnouncement }),
}))

vi.mock('@/features/negociations/services/negotiationService', () => ({
  negotiationService: () => ({ startNegotiation: mockStartNegotiation }),
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

async function importModal() {
  const { default: Modal } = await import('@/features/demandes/components/CreateTripFromDemandModal.vue')
  return Modal
}

const fakeRequest = {
  id: 'req-1', tripId: 'trip-1', tripCorridor: 'Paris → Dakar',
  tripDepartureDate: '2026-06-15', tripAvailableKg: 20,
  senderName: 'Fatou D.', senderInitials: 'FD', senderRating: 4.8, senderTotalSent: 12,
  weightKg: 5, contentType: 'Vêtements', budgetPerKg: 9,
  messageExcerpt: '...', matchScore: 88, requestedAt: '2026-05-16T08:00:00Z',
}

describe('CreateTripFromDemandModal', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateAnnouncement.mockReset()
    mockStartNegotiation.mockReset()
  })

  it('extracts departureCity and arrivalCity from tripCorridor', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    expect(wrapper.text()).toContain('Paris')
    expect(wrapper.text()).toContain('Dakar')
  })

  it('pre-fills suggested price as budgetPerKg × weightKg', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    // 9 €/kg × 5 kg = 45 €
    expect(wrapper.find('[data-test="create-trip-price"]').text()).toContain('45')
  })

  it('calls createAnnouncement then startNegotiation on submit', async () => {
    mockCreateAnnouncement.mockResolvedValue({ id: 'ann-new', status: 'ACTIVE' })
    mockStartNegotiation.mockResolvedValue({ id: 'thread-1' })
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await wrapper.find('[data-test="create-trip-date"]').setValue('2026-06-20')
    await wrapper.find('[data-test="create-trip-submit"]').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(mockCreateAnnouncement).toHaveBeenCalledOnce()
    expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      capacityUnit: 'KG_FREE',
      pricingMode: 'KG',
      negotiable: true,
      currency: 'EUR',
      acceptedPaymentMethods: ['STRIPE'],
      handoverDeadline: null,
    }))
    expect(mockStartNegotiation).toHaveBeenCalledWith(
      expect.objectContaining({
        packageRequestId: 'req-1',
        travelerAnnouncementId: 'ann-new',
        proposedPriceEur: 45,
      }),
    )
  })

  it('crée le trajet dans la devise de la demande, avec les rails de cette devise', async () => {
    // Régression : « EUR » en dur faisait d'un budget de 20 000 F CFA/kg un trajet
    // à 20 000 €/kg, et la carte était déclarée sur une devise qui l'interdit.
    mockCreateAnnouncement.mockResolvedValue({ id: 'ann-xof', status: 'ACTIVE' })
    mockStartNegotiation.mockResolvedValue({ id: 'thread-xof' })
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, {
      props: { request: { ...fakeRequest, currency: 'XOF', budgetPerKg: 20000, weightKg: 5 } },
    })
    expect(wrapper.find('[data-test="create-trip-price"]').text().replace(/[\s  ]/g, '')).toBe('100000FCFA')
    expect(wrapper.text()).not.toContain('€')
    await wrapper.find('[data-test="create-trip-date"]').setValue('2026-06-20')
    await wrapper.find('[data-test="create-trip-submit"]').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(mockCreateAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      currency: 'XOF',
      pricePerKg: 20000,
      acceptedPaymentMethods: ['MOBILE_MONEY', 'CASH'],
    }))
    expect(mockStartNegotiation).toHaveBeenCalledWith(expect.objectContaining({ proposedPriceEur: 100000 }))
  })

  it('plafonne le prix proposé à 500 € mis à l’échelle de la devise', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    // 20 000 F CFA/kg × 20 kg = 400 000 F CFA, au-dessus du plafond de 327 979 F CFA.
    const wrapper = mount(Modal, {
      props: { request: { ...fakeRequest, currency: 'XOF', budgetPerKg: 20000, weightKg: 20 } },
    })
    expect(wrapper.find('[data-test="create-trip-price"]').text().replace(/[\s  ]/g, '')).toBe('327979FCFA')
    expect(wrapper.text().replace(/[\s  ]/g, '')).toContain('Max327979FCFA')
  })

  it('affiche le message du serveur quand la création du trajet est refusée', async () => {
    mockCreateAnnouncement.mockRejectedValue({
      data: { code: 'stripe-onboarding-incomplete', detail: 'Connectez votre compte bancaire pour accepter la carte.' },
    })
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await wrapper.find('[data-test="create-trip-date"]').setValue('2026-06-20')
    await wrapper.find('[data-test="create-trip-submit"]').trigger('click')
    await new Promise(r => setTimeout(r, 0))
    expect(wrapper.text()).toContain('Connectez votre compte bancaire pour accepter la carte.')
    expect(mockStartNegotiation).not.toHaveBeenCalled()
  })

  it('fait varier le prix par pas de devise entre le plancher et le budget', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    const price = () => wrapper.find('[data-test="create-trip-price"]').text().replace(/[\s  ]/g, '')
    expect(price()).toBe('45,00€')
    const buttons = wrapper.findAll('button')
    const minus = buttons.find((b) => b.html().includes('lucide-minus'))!
    const plus = buttons.find((b) => b.html().includes('lucide-plus'))!
    await minus.trigger('click')
    expect(price()).toBe('44,00€')
    await plus.trigger('click')
    await plus.trigger('click')
    expect(price()).toBe('45,00€') // jamais au-dessus du budget de l'expéditeur
    for (let i = 0; i < 50; i++) await minus.trigger('click')
    expect(price()).toBe('1,00€') // jamais sous le plancher
  })

  it('change le mode de transport et se ferme depuis la croix et le fond', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    const train = wrapper.findAll('button').find((b) => b.text().includes('Train'))!
    await train.trigger('click')
    expect(train.attributes('class')).toContain('primary')
    await wrapper.find('[data-test="create-trip-close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.find('[data-test="create-trip-kg"]').setValue(12)
    expect((wrapper.find('[data-test="create-trip-kg"]').element as HTMLInputElement).value).toBe('12')
  })

  it('ne rend rien sans demande', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: null } })
    expect(wrapper.find('[data-test="create-trip-submit"]').exists()).toBe(false)
  })

  it('emits close when cancel is clicked', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await wrapper.find('[data-test="create-trip-cancel"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
