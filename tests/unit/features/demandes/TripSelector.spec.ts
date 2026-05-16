import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TripSelector from '@/features/demandes/components/TripSelector.vue'
import type { ActiveTrip } from '@/features/demandes/types/index'

const trips: ActiveTrip[] = [
  { tripId: 'trip-1', tripCorridor: 'Paris → Dakar', tripDepartureDate: '2026-06-15', tripAvailableKg: 20, matchCount: 5 },
  { tripId: 'trip-2', tripCorridor: 'Lyon → Abidjan', tripDepartureDate: '2026-07-01', tripAvailableKg: 10, matchCount: 2 },
]

describe('TripSelector', () => {
  it('renders the selected trip corridor', () => {
    const wrapper = mount(TripSelector, {
      props: { trips, modelValue: 'trip-1', totalCount: 5 },
    })
    expect(wrapper.text()).toContain('Paris → Dakar')
  })

  it('shows match count for selected trip', () => {
    const wrapper = mount(TripSelector, {
      props: { trips, modelValue: 'trip-1', totalCount: 5 },
    })
    expect(wrapper.text()).toContain('5')
  })

  it('shows single trip without dropdown toggle when only one trip', () => {
    const wrapper = mount(TripSelector, {
      props: { trips: [trips[0]], modelValue: 'trip-1', totalCount: 5 },
    })
    expect(wrapper.find('[data-test="trip-dropdown-toggle"]').exists()).toBe(false)
  })

  it('shows dropdown toggle when multiple trips', () => {
    const wrapper = mount(TripSelector, {
      props: { trips, modelValue: 'trip-1', totalCount: 5 },
    })
    expect(wrapper.find('[data-test="trip-dropdown-toggle"]').exists()).toBe(true)
  })

  it('emits update:modelValue with tripId when a trip option is clicked', async () => {
    const wrapper = mount(TripSelector, {
      props: { trips, modelValue: 'trip-1', totalCount: 5 },
    })
    await wrapper.find('[data-test="trip-dropdown-toggle"]').trigger('click')
    await wrapper.find('[data-test="trip-option-trip-2"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['trip-2'])
  })

  it('emits update:modelValue with null when "Tous mes trajets" is clicked', async () => {
    const wrapper = mount(TripSelector, {
      props: { trips, modelValue: 'trip-1', totalCount: 5 },
    })
    await wrapper.find('[data-test="trip-dropdown-toggle"]').trigger('click')
    await wrapper.find('[data-test="trip-option-all"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })
})
