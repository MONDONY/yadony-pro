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

  it('picker closes after selecting a weight option', async () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 14, availableContentTypes: [] },
    })
    await wrapper.find('[data-test="filter-weight"]').trigger('click')
    await wrapper.find('[data-test="weight-option-5"]').trigger('click')
    // picker should be closed
    expect(wrapper.find('[data-test="weight-option-10"]').exists()).toBe(false)
  })

  it('emits update:filters with sortBy when a sort option is selected', async () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 14, availableContentTypes: [] },
    })
    await wrapper.find('[data-test="filter-sort"]').trigger('click')
    await wrapper.find('[data-test="sort-option-date"]').trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect((emitted![0][0] as FilterState).sortBy).toBe('date')
  })

  it('chip "Tous" appears inactive when sortBy is not score', () => {
    const sortedFilters: FilterState = { ...defaultFilters, sortBy: 'date' }
    const wrapper = mount(DemandFilters, {
      props: { filters: sortedFilters, resultCount: 14, availableContentTypes: [] },
    })
    const allChip = wrapper.find('[data-test="filter-all"]')
    // hasActiveFilter = true → chip NOT bg-text (it should be border variant)
    expect(allChip.classes()).not.toContain('bg-text')
  })

  it('emits update:filters with minBudgetPerKg when a budget chip is clicked', async () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 14, availableContentTypes: [] },
    })
    await wrapper.find('[data-test="filter-budget"]').trigger('click')
    await wrapper.find('[data-test="budget-option-8"]').trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect((emitted![0][0] as FilterState).minBudgetPerKg).toBe(8)
  })
})
