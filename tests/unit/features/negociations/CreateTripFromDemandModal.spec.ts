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
    expect(mockStartNegotiation).toHaveBeenCalledWith(
      expect.objectContaining({
        packageRequestId: 'req-1',
        travelerAnnouncementId: 'ann-new',
        proposedPriceEur: 45,
      }),
    )
  })

  it('emits close when cancel is clicked', async () => {
    const Modal = await importModal()
    const { mount } = await import('@vue/test-utils')
    const wrapper = mount(Modal, { props: { request: fakeRequest } })
    await wrapper.find('[data-test="create-trip-cancel"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
