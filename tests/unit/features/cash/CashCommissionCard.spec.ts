// tests/unit/features/cash/CashCommissionCard.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const mockSvc = {
  getMethod: vi.fn(),
  detachMethod: vi.fn(),
}

vi.mock('@/features/cash/services/cashCommissionService', () => ({
  cashCommissionService: () => mockSvc,
}))

async function mountCard() {
  const { default: CashCommissionCard } = await import('@/features/cash/components/CashCommissionCard.vue')
  const wrapper = mount(CashCommissionCard)
  await flushPromises()
  return wrapper
}

describe('CashCommissionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche la carte enregistrée (marque + 4 derniers chiffres)', async () => {
    mockSvc.getMethod.mockResolvedValue({ brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027, expirationStatus: 'VALID' })
    const wrapper = await mountCard()
    expect(wrapper.text()).toContain('visa')
    expect(wrapper.text()).toContain('4242')
  })

  it('affiche l’état vide avec renvoi vers l’app mobile quand aucune carte', async () => {
    mockSvc.getMethod.mockResolvedValue(null)
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="cash-empty"]').exists()).toBe(true)
  })

  it('supprimer la carte appelle detachMethod puis recharge (état vide)', async () => {
    mockSvc.getMethod.mockResolvedValueOnce({ brand: 'visa', last4: '4242', expMonth: 12, expYear: 2027, expirationStatus: 'VALID' })
    mockSvc.detachMethod.mockResolvedValue(undefined)
    mockSvc.getMethod.mockResolvedValueOnce(null)
    const wrapper = await mountCard()
    await wrapper.find('[data-test="cash-detach"]').trigger('click')
    await flushPromises()
    expect(mockSvc.detachMethod).toHaveBeenCalled()
    expect(wrapper.find('[data-test="cash-empty"]').exists()).toBe(true)
  })

  it('signale une carte expirée', async () => {
    mockSvc.getMethod.mockResolvedValue({ brand: 'visa', last4: '4242', expMonth: 1, expYear: 2025, expirationStatus: 'EXPIRED' })
    const wrapper = await mountCard()
    expect(wrapper.find('[data-test="cash-expired"]').exists()).toBe(true)
  })
})
