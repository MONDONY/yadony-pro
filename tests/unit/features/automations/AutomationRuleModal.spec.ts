import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('lucide-vue-next', () => ({
  X: { template: '<svg data-icon="X" />' },
  Plus: { template: '<svg data-icon="Plus" />' },
  Trash2: { template: '<svg data-icon="Trash2" />' },
}))

const fakeCustomRule = {
  id: 'rule-1',
  ruleType: 'CUSTOM' as const,
  enabled: true,
  name: 'Règle existante',
  conditions: [{ field: 'sender_rating' as const, operator: 'gte' as const, value: '4.5' }],
  action: { type: 'auto_accept' as const },
  createdAt: '2026-05-15T10:00:00Z',
}

async function mountModal(props: Record<string, unknown> = {}) {
  const { default: AutomationRuleModal } = await import(
    '@/features/automations/components/AutomationRuleModal.vue'
  )
  return mount(AutomationRuleModal, {
    props,
    attachTo: document.body,
    global: { stubs: { Teleport: true } },
  })
}

describe('AutomationRuleModal', () => {
  it('renders with empty name when no rule prop is provided', async () => {
    const wrapper = await mountModal({ modelValue: true })
    const nameInput = wrapper.find('[data-test="rule-name-input"]')
    expect(nameInput.exists()).toBe(true)
    expect((nameInput.element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('pre-fills name and conditions when a rule prop is provided', async () => {
    const wrapper = await mountModal({ modelValue: true, rule: fakeCustomRule })
    const nameInput = wrapper.find('[data-test="rule-name-input"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Règle existante')
    expect(wrapper.findAll('[data-test="condition-row"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('clicking add-condition-btn appends a new condition row', async () => {
    const wrapper = await mountModal({ modelValue: true })
    expect(wrapper.findAll('[data-test="condition-row"]')).toHaveLength(0)
    await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
    expect(wrapper.findAll('[data-test="condition-row"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('clicking delete-condition-0 removes the first condition row', async () => {
    const wrapper = await mountModal({ modelValue: true })
    await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
    await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
    expect(wrapper.findAll('[data-test="condition-row"]')).toHaveLength(2)
    await wrapper.find('[data-test="delete-condition-0"]').trigger('click')
    expect(wrapper.findAll('[data-test="condition-row"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits cancel when modal-cancel-btn is clicked', async () => {
    const wrapper = await mountModal({ modelValue: true })
    await wrapper.find('[data-test="modal-cancel-btn"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
    wrapper.unmount()
  })

  it('does not emit save and shows validation-error when name is empty on submit', async () => {
    const wrapper = await mountModal({ modelValue: true })
    await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
    await wrapper.find('[data-test="modal-save-btn"]').trigger('click')
    expect(wrapper.emitted('save')).toBeFalsy()
    expect(wrapper.find('[data-test="validation-error"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not emit save and shows validation-error when no conditions exist on submit', async () => {
    const wrapper = await mountModal({ modelValue: true })
    await wrapper.find('[data-test="rule-name-input"]').setValue('Ma règle')
    await wrapper.find('[data-test="modal-save-btn"]').trigger('click')
    expect(wrapper.emitted('save')).toBeFalsy()
    expect(wrapper.find('[data-test="validation-error"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('emits save with correct CreateCustomRulePayload when form is valid', async () => {
    const wrapper = await mountModal({ modelValue: true })
    await wrapper.find('[data-test="rule-name-input"]').setValue('Ma nouvelle règle')
    await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
    await wrapper.find('[data-test="modal-save-btn"]').trigger('click')
    const emitted = wrapper.emitted('save')
    expect(emitted).toBeTruthy()
    const [payload] = (emitted as unknown[][])[0] as [Record<string, unknown>]
    expect(payload.ruleType).toBe('CUSTOM')
    expect(payload.name).toBe('Ma nouvelle règle')
    expect(Array.isArray(payload.conditions)).toBe(true)
    expect((payload.conditions as unknown[]).length).toBeGreaterThan(0)
    expect(payload.action).toBeDefined()
    wrapper.unmount()
  })

  it('shows action-message-input when action type is auto_reject', async () => {
    const wrapper = await mountModal({ modelValue: true })
    await wrapper.find('[data-test="action-type-select"]').setValue('auto_reject')
    expect(wrapper.find('[data-test="action-message-input"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not show action-message-input when action type is auto_accept', async () => {
    const wrapper = await mountModal({ modelValue: true })
    const actionSelect = wrapper.find('[data-test="action-type-select"]')
    await actionSelect.setValue('auto_accept')
    expect(wrapper.find('[data-test="action-message-input"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
