// tests/unit/features/cockpit/KpiCard.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('lucide-vue-next', () => ({
  TrendingUp: { template: '<svg class="trending-up" />' },
  TrendingDown: { template: '<svg class="trending-down" />' },
  Minus: { template: '<svg class="minus" />' },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}))

async function mountKpiCard(props: object) {
  const { default: KpiCard } = await import('@/features/cockpit/components/KpiCard.vue')
  return mount(KpiCard, { props })
}

describe('KpiCard', () => {
  it('renders label and value', async () => {
    const wrapper = await mountKpiCard({ id: 'revenue', label: 'Revenus', value: '420 €' })
    expect(wrapper.text()).toContain('Revenus')
    expect(wrapper.text()).toContain('420 €')
    expect(wrapper.find('[data-test="kpi-card-revenue"]').exists()).toBe(true)
  })

  it('renders subLabel when provided', async () => {
    const wrapper = await mountKpiCard({ id: 'trips', label: 'Trajets', value: '3 / 5', subLabel: 'ce mois' })
    expect(wrapper.text()).toContain('ce mois')
  })

  it('does not render subLabel or trend row when neither is provided', async () => {
    const wrapper = await mountKpiCard({ id: 'colis', label: 'Colis', value: '12' })
    // No div with sub/trend content should appear
    const text = wrapper.text()
    expect(text).not.toContain('ce mois')
  })

  it('renders TrendingUp icon for up trend', async () => {
    const wrapper = await mountKpiCard({ id: 'rating', label: 'Note', value: '4.8 / 5', trend: 'up' })
    expect(wrapper.find('.trending-up').exists()).toBe(true)
  })

  it('renders TrendingDown icon for down trend', async () => {
    const wrapper = await mountKpiCard({ id: 'rating', label: 'Note', value: '3.5 / 5', trend: 'down' })
    expect(wrapper.find('.trending-down').exists()).toBe(true)
  })

  it('renders Minus icon for neutral trend', async () => {
    const wrapper = await mountKpiCard({ id: 'colis', label: 'Colis', value: '12', trend: 'neutral' })
    expect(wrapper.find('.minus').exists()).toBe(true)
  })

  it('renders trendValue when provided', async () => {
    const wrapper = await mountKpiCard({ id: 'revenue', label: 'Revenus', value: '420 €', trend: 'up', trendValue: '+12%' })
    expect(wrapper.text()).toContain('+12%')
  })

  it('does not render trend icon when no trend is set', async () => {
    const wrapper = await mountKpiCard({ id: 'trips', label: 'Trajets', value: '3 / 5' })
    expect(wrapper.find('.trending-up').exists()).toBe(false)
    expect(wrapper.find('.trending-down').exists()).toBe(false)
    expect(wrapper.find('.minus').exists()).toBe(false)
  })
})
