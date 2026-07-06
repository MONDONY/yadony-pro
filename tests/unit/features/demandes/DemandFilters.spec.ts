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

  it('emits update:filters with contentType when a type option is selected', async () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 5, availableContentTypes: ['Vêtements'], viewMode: 'card' },
    })
    await wrapper.find('[data-test="filter-type"]').trigger('click')
    await wrapper.find('[data-test="type-option-Vêtements"]').trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect((emitted![0][0] as FilterState).contentType).toBe('Vêtements')
  })

  it('shows an "Effacer" button in the weight picker that resets maxWeightKg to null', async () => {
    const active: FilterState = { ...defaultFilters, maxWeightKg: 10 }
    const wrapper = mount(DemandFilters, {
      props: { filters: active, resultCount: 5, availableContentTypes: [], viewMode: 'card' },
    })
    await wrapper.find('[data-test="filter-weight"]').trigger('click')
    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Effacer')
    expect(clearBtn).toBeTruthy()
    await clearBtn!.trigger('click')
    const emitted = wrapper.emitted('update:filters')
    expect((emitted![0][0] as FilterState).maxWeightKg).toBeNull()
  })

  it('emits update:viewMode when the view toggle buttons are clicked', async () => {
    const wrapper = mount(DemandFilters, {
      props: { filters: defaultFilters, resultCount: 5, availableContentTypes: [], viewMode: 'card' },
    })
    await wrapper.find('[aria-label="Vue liste"]').trigger('click')
    await wrapper.find('[aria-label="Vue cartes"]').trigger('click')
    const emitted = wrapper.emitted('update:viewMode')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toBe('list')
    expect(emitted![1][0]).toBe('card')
  })

  it('closes the open picker when Escape is pressed', async () => {
    const wrapper = mount(DemandFilters, {
      attachTo: document.body,
      props: { filters: defaultFilters, resultCount: 5, availableContentTypes: [], viewMode: 'card' },
    })
    await wrapper.find('[data-test="filter-weight"]').trigger('click')
    expect(wrapper.find('[data-test="weight-option-5"]').exists()).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="weight-option-5"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes the open picker when clicking outside the container', async () => {
    const wrapper = mount(DemandFilters, {
      attachTo: document.body,
      props: { filters: defaultFilters, resultCount: 5, availableContentTypes: [], viewMode: 'card' },
    })
    await wrapper.find('[data-test="filter-weight"]').trigger('click')
    expect(wrapper.find('[data-test="weight-option-5"]').exists()).toBe(true)
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="weight-option-5"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
