// tests/unit/features/colis/BulkActions.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('lucide-vue-next', () => ({
  CheckCircle: { template: '<svg />' },
  XCircle: { template: '<svg />' },
  Download: { template: '<svg />' },
  X: { template: '<svg />' },
}))

async function mountBulkActions(props: object) {
  const { default: BulkActions } = await import('@/features/colis/components/BulkActions.vue')
  return mount(BulkActions, { props })
}

describe('BulkActions', () => {
  it('renders bar when count > 0', async () => {
    const wrapper = await mountBulkActions({ count: 3, isLoading: false })
    expect(wrapper.find('[data-test="bulk-actions-bar"]').exists()).toBe(true)
  })

  it('does not render bar when count is 0', async () => {
    const wrapper = await mountBulkActions({ count: 0, isLoading: false })
    expect(wrapper.find('[data-test="bulk-actions-bar"]').exists()).toBe(false)
  })

  it('shows correct count label for singular', async () => {
    const wrapper = await mountBulkActions({ count: 1, isLoading: false })
    expect(wrapper.text()).toContain('1')
    // Should show "sélectionné" without trailing 's'
    expect(wrapper.html()).not.toContain('sélectionnés')
  })

  it('shows correct count label for plural', async () => {
    const wrapper = await mountBulkActions({ count: 3, isLoading: false })
    expect(wrapper.text()).toContain('3')
    expect(wrapper.html()).toContain('sélectionnés')
  })

  it('emits accept on button click', async () => {
    const wrapper = await mountBulkActions({ count: 2, isLoading: false })
    await wrapper.find('[data-test="bulk-accept"]').trigger('click')
    expect(wrapper.emitted('accept')).toBeTruthy()
  })

  it('emits reject on button click', async () => {
    const wrapper = await mountBulkActions({ count: 2, isLoading: false })
    await wrapper.find('[data-test="bulk-reject"]').trigger('click')
    expect(wrapper.emitted('reject')).toBeTruthy()
  })

  it('emits export on button click', async () => {
    const wrapper = await mountBulkActions({ count: 2, isLoading: false })
    await wrapper.find('[data-test="bulk-export"]').trigger('click')
    expect(wrapper.emitted('export')).toBeTruthy()
  })

  it('emits clear on X button click', async () => {
    const wrapper = await mountBulkActions({ count: 2, isLoading: false })
    await wrapper.find('[data-test="bulk-clear"]').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('disables accept and reject buttons when isLoading is true', async () => {
    const wrapper = await mountBulkActions({ count: 2, isLoading: true })
    expect((wrapper.find('[data-test="bulk-accept"]').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.find('[data-test="bulk-reject"]').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('export button is not disabled when isLoading is true', async () => {
    const wrapper = await mountBulkActions({ count: 2, isLoading: true })
    expect((wrapper.find('[data-test="bulk-export"]').element as HTMLButtonElement).disabled).toBe(false)
  })
})
