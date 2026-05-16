import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DemandFilters from '@/features/demandes/components/DemandFilters.vue'
import type { FilterState } from '@/features/demandes/types/index'

const defaultFilters: FilterState = {
  maxWeightKg: null,
  minBudgetPerKg: null,
  contentType: null,
  sortBy: 'score',
}

describe('DemandFilters', () => {
  it('renders "Tous" chip as active when no filters are set', () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 14, availableContentTypes: ['Vêtements', 'Électronique'] },
    })
    const allChip = wrapper.find('[data-test="filter-all"]')
    expect(allChip.classes()).toContain('bg-text')
  })

  it('emits update:filters with maxWeightKg when a weight chip is clicked', async () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 14, availableContentTypes: [] },
    })
    await wrapper.find('[data-test="filter-weight"]').trigger('click')
    await wrapper.find('[data-test="weight-option-5"]').trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as FilterState).maxWeightKg).toBe(5)
  })

  it('emits update:filters resetting all when "Tous" chip is clicked', async () => {
    const activeFilters: FilterState = { maxWeightKg: 5, minBudgetPerKg: null, contentType: null, sortBy: 'score' }
    const wrapper = mount(DemandFilters, {
      props: { filters: activeFilters, resultCount: 3, availableContentTypes: [] },
    })
    await wrapper.find('[data-test="filter-all"]').trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect((emitted![0][0] as FilterState).maxWeightKg).toBeNull()
  })

  it('shows result count', () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 7, availableContentTypes: [] },
    })
    expect(wrapper.text()).toContain('7')
  })
})
