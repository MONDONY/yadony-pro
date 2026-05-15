// tests/unit/features/colis/BidFilters.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('lucide-vue-next', () => ({
  Search: { template: '<svg />' },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}))

const defaultFilters = {
  statusFilter: 'TOUS' as const,
  tripId: null,
  senderSearch: '',
  dateFrom: null,
  dateTo: null,
}

async function mountBidFilters(props = {}) {
  const { default: BidFilters } = await import('@/features/colis/components/BidFilters.vue')
  return mount(BidFilters, {
    props: {
      modelValue: defaultFilters,
      availableTrips: [],
      ...props,
    },
  })
}

describe('BidFilters', () => {
  it('renders all status filter tabs', async () => {
    const wrapper = await mountBidFilters()
    expect(wrapper.find('[data-test="filter-status-TOUS"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-status-PENDING"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-status-ACCEPTED"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-status-IN_TRANSIT"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-status-DELIVERED"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-status-REFUSED"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="filter-status-DISPUTE"]').exists()).toBe(true)
  })

  it('emits update:statusFilter when a tab is clicked', async () => {
    const wrapper = await mountBidFilters()
    await wrapper.find('[data-test="filter-status-PENDING"]').trigger('click')
    expect(wrapper.emitted('update:statusFilter')?.[0]).toEqual(['PENDING'])
  })

  it('emits update:statusFilter with ACCEPTED when Acceptés tab is clicked', async () => {
    const wrapper = await mountBidFilters()
    await wrapper.find('[data-test="filter-status-ACCEPTED"]').trigger('click')
    expect(wrapper.emitted('update:statusFilter')?.[0]).toEqual(['ACCEPTED'])
  })

  it('emits update:senderSearch on input', async () => {
    const wrapper = await mountBidFilters()
    const input = wrapper.find('[data-test="filter-sender-search"]')
    await input.setValue('Alice')
    expect(wrapper.emitted('update:senderSearch')?.[0]).toEqual(['Alice'])
  })

  it('renders trip options when availableTrips is provided', async () => {
    const wrapper = await mountBidFilters({
      availableTrips: [
        { id: 'trip-1', tripCorridor: 'Paris → Dakar' },
        { id: 'trip-2', tripCorridor: 'Lyon → Abidjan' },
      ],
    })
    const select = wrapper.find('[data-test="filter-trip"]')
    expect(select.exists()).toBe(true)
    // 2 trips + "Tous les trajets" option = 3 options
    expect(select.findAll('option')).toHaveLength(3)
    expect(select.text()).toContain('Paris → Dakar')
    expect(select.text()).toContain('Lyon → Abidjan')
  })

  it('emits update:tripId when trip is selected', async () => {
    const wrapper = await mountBidFilters({
      availableTrips: [{ id: 'trip-1', tripCorridor: 'Paris → Dakar' }],
    })
    const select = wrapper.find('[data-test="filter-trip"]')
    await select.setValue('trip-1')
    expect(wrapper.emitted('update:tripId')).toBeTruthy()
  })

  it('emits update:dateFrom on date input change', async () => {
    const wrapper = await mountBidFilters()
    const input = wrapper.find('[data-test="filter-date-from"]')
    await input.setValue('2026-06-01')
    expect(wrapper.emitted('update:dateFrom')).toBeTruthy()
  })

  it('emits update:dateTo on date input change', async () => {
    const wrapper = await mountBidFilters()
    const input = wrapper.find('[data-test="filter-date-to"]')
    await input.setValue('2026-06-30')
    expect(wrapper.emitted('update:dateTo')).toBeTruthy()
  })

  it('applies active styling to the currently selected status tab', async () => {
    const wrapper = await mountBidFilters({
      modelValue: { ...defaultFilters, statusFilter: 'PENDING' },
    })
    const pendingTab = wrapper.find('[data-test="filter-status-PENDING"]')
    // aria-selected should be true for the active tab
    expect(pendingTab.attributes('aria-selected')).toBe('true')
    const tousTab = wrapper.find('[data-test="filter-status-TOUS"]')
    expect(tousTab.attributes('aria-selected')).toBe('false')
  })
})
