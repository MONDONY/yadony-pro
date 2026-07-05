// tests/unit/features/cockpit/KpiCard.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('lucide-vue-next', () => ({
  ArrowUpRight: { template: '<svg class="arrow-up" />' },
  ArrowDownRight: { template: '<svg class="arrow-down" />' },
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
    expect(wrapper.text()).not.toContain('ce mois')
    expect(wrapper.find('.arrow-up').exists()).toBe(false)
  })

  it('renders an up arrow (success) for up trend, with an accessible direction', async () => {
    const wrapper = await mountKpiCard({ id: 'rating', label: 'Note', value: '4.8 / 5', trend: 'up', trendValue: '+12%' })
    expect(wrapper.find('.arrow-up').exists()).toBe(true)
    expect(wrapper.html()).toContain('text-success')
    expect(wrapper.text()).toContain('en hausse')
  })

  it('renders a down arrow (danger) for down trend', async () => {
    const wrapper = await mountKpiCard({ id: 'rating', label: 'Note', value: '3.5 / 5', trend: 'down' })
    expect(wrapper.find('.arrow-down').exists()).toBe(true)
    expect(wrapper.html()).toContain('text-danger')
  })

  it('renders no delta row for neutral trend (calm by design)', async () => {
    const wrapper = await mountKpiCard({ id: 'colis', label: 'Colis', value: '12', trend: 'neutral' })
    expect(wrapper.find('.arrow-up').exists()).toBe(false)
    expect(wrapper.find('.arrow-down').exists()).toBe(false)
  })

  it('renders trendValue when provided', async () => {
    const wrapper = await mountKpiCard({ id: 'revenue', label: 'Revenus', value: '420 €', trend: 'up', trendValue: '+12%' })
    expect(wrapper.text()).toContain('+12%')
  })

  it('does not render trend icon when no trend is set', async () => {
    const wrapper = await mountKpiCard({ id: 'trips', label: 'Trajets', value: '3 / 5' })
    expect(wrapper.find('.arrow-up').exists()).toBe(false)
    expect(wrapper.find('.arrow-down').exists()).toBe(false)
  })
})
