import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriptionBanner from '@/features/abonnement/components/SubscriptionBanner.vue'
import type { ProSubscription } from '@/features/abonnement/types/index'

const NuxtLink = {
  name: 'NuxtLink',
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

function mountBanner(subscription: ProSubscription | null) {
  return mount(SubscriptionBanner, {
    props: { subscription },
    global: { stubs: { NuxtLink } },
  })
}

const DAY_MS = 24 * 60 * 60 * 1000

function buildSubscription(overrides: Partial<ProSubscription> = {}): ProSubscription {
  return {
    active: true,
    status: 'ACTIVE',
    source: 'STRIPE',
    billingCycle: 'MONTHLY',
    currentPeriodEnd: '2026-09-26T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    graceExpiresAt: null,
    ...overrides,
  }
}

function isoInDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

describe('SubscriptionBanner', () => {
  it('renders nothing when there is no subscription', () => {
    const wrapper = mountBanner(null)
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('renders nothing for an active subscription', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'ACTIVE' }))
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('renders nothing for a canceled or expired subscription', () => {
    const canceled = mountBanner(buildSubscription({ status: 'CANCELED' }))
    const expired = mountBanner(buildSubscription({ status: 'EXPIRED' }))
    expect(canceled.find('[data-test="subscription-banner"]').exists()).toBe(false)
    expect(expired.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('shows a danger banner for a past due subscription', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'PAST_DUE' }))
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.classes().join(' ')).toContain('danger')
  })

  it('shows a warning banner with the days remaining when the legacy grace ends in fewer than 7 days', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(3) }))
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.classes().join(' ')).toContain('warning')
    expect(wrapper.find('[data-test="subscription-banner-days"]').text()).toContain('3')
  })

  it('shows the banner at the boundary of 7 days remaining', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(7) }))
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.exists()).toBe(true)
    expect(wrapper.find('[data-test="subscription-banner-days"]').text()).toContain('7')
  })

  it('hides the banner just past the boundary, at 8 days remaining', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(8) }))
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  it('hides the banner when the legacy grace has no known expiry date', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: null }))
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  // Correctif 8 : la revue a signalé une branche non testée — une grâce déjà
  // expirée (jours négatifs) doit rester silencieuse, protégée par le garde
  // `graceDaysRemaining.value >= 0`. Sans ce test, une régression sur cette
  // condition ferait réapparaître le bandeau, ou pire, le ferait disparaître
  // le jour même où il compte le plus (voir aussi le cas "0 jour" ci-dessous).
  it('hides the banner when the legacy grace has already expired (negative days remaining)', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(-1) }))
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(false)
  })

  // Correctif 6 : "se termine dans 0 jour(s)" est à la fois du jargon
  // (le "(s)") et incorrect en français ("dans 0 jour" ne se dit pas).
  it('says "aujourd\'hui" rather than "dans 0 jour(s)" when the grace ends today', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(0) }))
    expect(wrapper.find('[data-test="subscription-banner"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="subscription-banner-days"]').text()).toBe("aujourd'hui")
  })

  it('says "demain" rather than "dans 1 jour(s)" when the grace ends tomorrow', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(1) }))
    expect(wrapper.find('[data-test="subscription-banner-days"]').text()).toBe('demain')
  })

  it('says "dans N jours" (no dev-facing "(s)") for two or more days remaining', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(3) }))
    expect(wrapper.find('[data-test="subscription-banner-days"]').text()).toBe('dans 3 jours')
  })

  // Correctif 1 : le bandeau était un cul-de-sac visuel — rien n'y était
  // cliquable. Un voyageur en grâce historique n'avait donc physiquement
  // aucun moyen de payer depuis l'endroit même où on le lui dit.
  it('links to /upgrade so a user can actually act on the alert', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'LEGACY_GRACE', graceExpiresAt: isoInDays(3) }))
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.attributes('href')).toBe('/upgrade')
  })

  it('links to /upgrade for the past-due danger banner too', () => {
    const wrapper = mountBanner(buildSubscription({ status: 'PAST_DUE' }))
    const banner = wrapper.find('[data-test="subscription-banner"]')
    expect(banner.attributes('href')).toBe('/upgrade')
  })
})
