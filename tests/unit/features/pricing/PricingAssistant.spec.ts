import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingAssistant from '@/features/pricing/components/PricingAssistant.vue'
import { PRICING_CORRIDORS } from '@/features/pricing/types/index'

function mountAssistant(props: Record<string, unknown> = {}) {
  return mount(PricingAssistant, {
    props: {
      corridors: PRICING_CORRIDORS,
      marketPrice: null,
      commissionGrid: null,
      isLoading: false,
      ...props,
    },
  })
}

describe('PricingAssistant', () => {
  it('emits select-corridor when a corridor is chosen', async () => {
    const wrapper = mountAssistant()
    await wrapper.find('[data-test="corridor-select"]').setValue('PARIS_DAKAR')
    expect(wrapper.emitted('select-corridor')![0][0]).toBe('PARIS_DAKAR')
  })

  it('shows the market median when provided', () => {
    const wrapper = mountAssistant({ marketPrice: { median: 12.5, currency: 'EUR' } })
    expect(wrapper.find('[data-test="market-median"]').text().replace(/[\s  ]/g, '')).toBe('12,50€/kg')
  })

  it('affiche ce que le voyageur reçoit : le prix saisi, sans déduction', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    await wrapper.find('[data-test="price-input"]').setValue(10)
    expect(wrapper.find('[data-test="net-per-kg"]').text().replace(/[\s  ]/g, '')).toBe('10,00€/kg')
    expect(wrapper.text()).not.toContain('%')
  })

  it('n’affiche rien à recevoir pour un prix négatif', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    await wrapper.find('[data-test="price-input"]').setValue(-3)
    expect(wrapper.find('[data-test="net-per-kg"]').text()).toBe('—')
  })

  it('n’annonce aucun minimum sans grille', () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    expect(wrapper.find('[data-test="fees-note"]').text()).toContain('frais de service yadony s\'ajoutent côté expéditeur')
    expect(wrapper.find('[data-test="minimum-fee"]').exists()).toBe(false)
  })

  it('annonce le minimum de la grille dans la devise du marché', () => {
    const commissionGrid = { tiers: [{ fromEur: 0, rate: 0.07 }], minimums: { EUR: 1, XOF: 650 } }
    const eur = mountAssistant({ commissionGrid, marketPrice: { median: 10, currency: 'EUR' } })
    expect(eur.find('[data-test="minimum-fee"]').text().replace(/[\s  ]/g, '')).toBe('1,00€')
    const xof = mountAssistant({ commissionGrid, marketPrice: { median: 5000, currency: 'XOF' } })
    expect(xof.find('[data-test="minimum-fee"]').text().replace(/[\s  ]/g, '')).toBe('650FCFA')
  })

  it('annonce le minimum en euros tant que le marché n’a pas de devise', () => {
    const commissionGrid = { tiers: [{ fromEur: 0, rate: 0.07 }], minimums: { EUR: 1 } }
    const wrapper = mountAssistant({ commissionGrid })
    expect(wrapper.find('[data-test="minimum-fee"]').text().replace(/[\s  ]/g, '')).toBe('1,00€')
  })

  it('flags a price aligned with the market', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    await wrapper.find('[data-test="price-input"]').setValue(10)
    expect(wrapper.find('[data-test="comparison"]').text()).toContain('Aligné')
  })

  it('flags a price above the market', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 10, currency: 'EUR' } })
    await wrapper.find('[data-test="price-input"]').setValue(13)
    expect(wrapper.find('[data-test="comparison"]').text()).toContain('Au-dessus')
  })

  it('affiche la médiane et ce qui est reçu dans la devise du marché', async () => {
    const wrapper = mountAssistant({ marketPrice: { median: 5000, currency: 'XOF' } })
    expect(wrapper.find('[data-test="market-median"]').text().replace(/[\s  ]/g, '')).toBe('5000FCFA/kg')
    await wrapper.find('[data-test="price-input"]').setValue(5001)
    expect(wrapper.find('[data-test="net-per-kg"]').text().replace(/[\s  ]/g, '')).toBe('5001FCFA/kg')
    expect(wrapper.text()).not.toContain('€')
  })
})
