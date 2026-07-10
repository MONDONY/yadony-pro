import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PriceGridList from '@/features/tarifs/components/PriceGridList.vue'

const a = { id: 'a', label: 'A', unitPriceNet: 10, unitPriceDisplay: 11, position: 0 }
const b = { id: 'b', label: 'B', unitPriceNet: 20, unitPriceDisplay: 22, position: 1 }

describe('PriceGridList', () => {
  it('shows an empty state when there are no items', () => {
    const wrapper = mount(PriceGridList, { props: { items: [], isSaving: false } })
    expect(wrapper.find('[data-test="pg-empty"]').exists()).toBe(true)
  })

  it('renders one row per item', () => {
    const wrapper = mount(PriceGridList, { props: { items: [a, b], isSaving: false } })
    expect(wrapper.find('[data-test="pg-row-a"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="pg-row-b"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('A')
  })

  it('disables up on the first row and down on the last row', () => {
    const wrapper = mount(PriceGridList, { props: { items: [a, b], isSaving: false } })
    expect(wrapper.find('[data-test="pg-up-a"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="pg-down-b"]').attributes('disabled')).toBeDefined()
  })

  it('emits edit, remove and move events', async () => {
    const wrapper = mount(PriceGridList, { props: { items: [a, b], isSaving: false } })
    await wrapper.find('[data-test="pg-edit-a"]').trigger('click')
    await wrapper.find('[data-test="pg-delete-a"]').trigger('click')
    await wrapper.find('[data-test="pg-down-a"]').trigger('click')
    expect(wrapper.emitted('edit')![0][0]).toEqual(a)
    expect(wrapper.emitted('remove')![0][0]).toBe('a')
    expect(wrapper.emitted('move')![0][0]).toEqual({ id: 'a', direction: 'down' })
  })
})
