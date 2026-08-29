import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingCard from '@/features/abonnement/components/PricingCard.vue'
import { SUBSCRIPTION_PRICING } from '@/features/abonnement/types/index'

describe('PricingCard', () => {
  it('shows the monthly price and hides the savings mention', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'MONTHLY' },
    })
    expect(wrapper.find('[data-test="pricing-card-price"]').text()).toContain(
      SUBSCRIPTION_PRICING.MONTHLY.label,
    )
    expect(wrapper.find('[data-test="pricing-card-savings"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="pricing-card-featured-badge"]').exists()).toBe(false)
  })

  it('shows the yearly price and the savings mention', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'YEARLY' },
    })
    expect(wrapper.find('[data-test="pricing-card-price"]').text()).toContain(
      SUBSCRIPTION_PRICING.YEARLY.label,
    )
    expect(wrapper.find('[data-test="pricing-card-savings"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="pricing-card-savings"]').text()).toMatch(/mois/i)
  })

  // Correctif 5 : la phrase se contredisait elle-même — 11,98 € par an
  // représente 2,4 mois de tarif mensuel, pas "2 mois offerts" écrit en dur.
  // Le nombre de mois doit être DÉRIVÉ des constantes, jamais hardcodé.
  it('derives the savings amount and the equivalent number of months from the pricing constants, never a hardcoded figure', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'YEARLY' },
    })
    const { MONTHLY, YEARLY } = SUBSCRIPTION_PRICING
    const expectedSavings = MONTHLY.amount * 12 - YEARLY.amount
    const expectedMonths = expectedSavings / MONTHLY.amount
    const formattedSavings = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: YEARLY.currency }).format(
      expectedSavings,
    )
    const formattedMonths = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(expectedMonths)

    const text = wrapper.find('[data-test="pricing-card-savings"]').text()
    expect(text).toContain(formattedSavings)
    expect(text).toContain(formattedMonths)
    // La phrase ne doit plus affirmer "2 mois" quand le nombre réel n'est pas 2.
    expect(text).not.toMatch(/\b2 mois\b/)
  })

  it('shows the featured badge only when featured is true', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'YEARLY', featured: true },
    })
    expect(wrapper.find('[data-test="pricing-card-featured-badge"]').exists()).toBe(true)
  })

  it('emits subscribe with the cycle when the button is clicked', async () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'MONTHLY' },
    })
    await wrapper.find('[data-test="pricing-card-subscribe-button"]').trigger('click')
    expect(wrapper.emitted('subscribe')).toEqual([['MONTHLY']])
  })

  it('disables the button while loading', () => {
    const wrapper = mount(PricingCard, {
      props: { cycle: 'MONTHLY', isLoading: true },
    })
    expect(wrapper.find('[data-test="pricing-card-subscribe-button"]').attributes('disabled')).toBeDefined()
  })

  // L'essai vient du backend, jamais d'un calcul local : la carte se contente de
  // l'afficher. Sans essai, elle doit se comporter exactement comme avant.
  describe('essai gratuit', () => {
    it("annonce les jours offerts et le tarif qui suit", () => {
      const wrapper = mount(PricingCard, { props: { cycle: 'MONTHLY', trialDays: 7 } })
      const trial = wrapper.find('[data-test="pricing-card-trial"]')
      expect(trial.exists()).toBe(true)
      expect(trial.text()).toContain('7 jours offerts')
      expect(trial.text()).toContain(SUBSCRIPTION_PRICING.MONTHLY.label)
    })

    // Le bouton doit dire ce que fait le clic. Promettre « S'abonner » là où rien n'est
    // prélevé pendant sept jours est une imprécision découverte trop tard.
    it("le bouton annonce l'essai plutôt qu'un abonnement immédiat", () => {
      const wrapper = mount(PricingCard, { props: { cycle: 'YEARLY', trialDays: 7 } })
      expect(wrapper.find('[data-test="pricing-card-subscribe-button"]').text())
        .toContain("Commencer l'essai de 7 jours")
    })

    it("sans essai, la carte ne l'évoque pas et le bouton reste « S'abonner »", () => {
      const wrapper = mount(PricingCard, { props: { cycle: 'MONTHLY' } })
      expect(wrapper.find('[data-test="pricing-card-trial"]').exists()).toBe(false)
      expect(wrapper.find('[data-test="pricing-card-subscribe-button"]').text()).toContain("S'abonner")
    })

    it("le chargement l'emporte sur le libellé d'essai", () => {
      const wrapper = mount(PricingCard, { props: { cycle: 'MONTHLY', trialDays: 7, isLoading: true } })
      expect(wrapper.find('[data-test="pricing-card-subscribe-button"]').text()).toContain('Chargement')
    })
  })
})