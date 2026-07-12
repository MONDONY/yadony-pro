import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('lucide-vue-next', () => ({
  X: { template: '<svg data-icon="X" />' },
  Plus: { template: '<svg data-icon="Plus" />' },
  Trash2: { template: '<svg data-icon="Trash2" />' },
}))

const catalogSample = [
  { code: 'DOCUMENTS', label: 'Documents & administratif', emoji: '📄' },
  { code: 'ALIMENTATION_SECHE', label: 'Alimentation sèche', emoji: '🍚' },
  { code: 'PRODUITS_FRAIS', label: 'Produits frais / périssables', emoji: '🐟' },
  { code: 'COSMETIQUES', label: 'Cosmétiques & parfums', emoji: '💄' },
  { code: 'VETEMENTS', label: 'Vêtements & tissus', emoji: '👗' },
  { code: 'CHAUSSURES', label: 'Chaussures', emoji: '👟' },
  { code: 'MEDICAMENTS_TRADITIONNELS', label: 'Médicaments traditionnels', emoji: '🌿' },
  { code: 'ELECTRONIQUE', label: 'Téléphone & électronique', emoji: '📱' },
  { code: 'LIVRES', label: 'Livres', emoji: '📚' },
  { code: 'CADEAUX', label: 'Cadeaux & jouets', emoji: '🎁' },
  { code: 'AUTRE', label: 'Autre', emoji: '📦' },
]

const mockFetchContentCategories = vi.fn()

vi.mock('@/features/trajets/services/configService', () => ({
  configService: () => ({ fetchContentCategories: mockFetchContentCategories }),
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
  const wrapper = mount(AutomationRuleModal, {
    props,
    attachTo: document.body,
    global: { stubs: { Teleport: true } },
  })
  await flushPromises()
  return wrapper
}

describe('AutomationRuleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchContentCategories.mockResolvedValue(catalogSample)
  })

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

  describe('champ value — type de contenu (correctif règle « Poissons »)', () => {
    it('field = content_type affiche un select peuplé par les 11 libellés du catalogue', async () => {
      const wrapper = await mountModal({ modelValue: true })
      await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
      await wrapper.find('[data-test="condition-field-0"]').setValue('content_type')
      const valueField = wrapper.find('[data-test="condition-value-0"]')
      expect(valueField.element.tagName).toBe('SELECT')
      const optionLabels = valueField.findAll('option').map((o) => o.text())
      for (const cat of catalogSample) {
        expect(optionLabels).toContain(cat.label)
      }
      wrapper.unmount()
    })

    it('sélectionner « Produits frais / périssables » émet la condition avec value = le label', async () => {
      const wrapper = await mountModal({ modelValue: true })
      await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
      await wrapper.find('[data-test="condition-field-0"]').setValue('content_type')
      await wrapper.find('[data-test="condition-value-0"]').setValue('Produits frais / périssables')
      await wrapper.find('[data-test="rule-name-input"]').setValue('Refus poisson')
      await wrapper.find('[data-test="modal-save-btn"]').trigger('click')
      const emitted = wrapper.emitted('save')
      expect(emitted).toBeTruthy()
      const [payload] = (emitted as unknown[][])[0] as [{ conditions: Array<{ value: string }> }]
      expect(payload.conditions[0]!.value).toBe('Produits frais / périssables')
      wrapper.unmount()
    })

    it('choisir « Autre valeur… » fait apparaître un input texte libre où saisir « Poissons »', async () => {
      const wrapper = await mountModal({ modelValue: true })
      await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
      await wrapper.find('[data-test="condition-field-0"]').setValue('content_type')
      await wrapper.find('[data-test="condition-value-0"]').setValue('Autre valeur…')
      const valueField = wrapper.find('[data-test="condition-value-0"]')
      expect(valueField.element.tagName).toBe('INPUT')
      await valueField.setValue('Poissons')
      expect((valueField.element as HTMLInputElement).value).toBe('Poissons')
      wrapper.unmount()
    })

    it('field = weight_kg reste un input texte (pas de select)', async () => {
      const wrapper = await mountModal({ modelValue: true })
      await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
      await wrapper.find('[data-test="condition-field-0"]').setValue('weight_kg')
      const valueField = wrapper.find('[data-test="condition-value-0"]')
      expect(valueField.element.tagName).toBe('INPUT')
      wrapper.unmount()
    })

    it('passer de content_type à weight_kg réinitialise value à une chaîne vide', async () => {
      const wrapper = await mountModal({
        modelValue: true,
        rule: {
          id: 'rule-2',
          ruleType: 'CUSTOM' as const,
          enabled: true,
          name: 'Règle contenu',
          conditions: [{ field: 'content_type' as const, operator: 'eq' as const, value: 'Vêtements & tissus' }],
          action: { type: 'auto_reject' as const },
          createdAt: '2026-05-15T10:00:00Z',
        },
      })
      await wrapper.find('[data-test="condition-field-0"]').setValue('weight_kg')
      const valueField = wrapper.find('[data-test="condition-value-0"]')
      expect(valueField.element.tagName).toBe('INPUT')
      expect((valueField.element as HTMLInputElement).value).toBe('')
      wrapper.unmount()
    })

    it('si fetchContentCategories rejette, un input texte libre est rendu pour content_type (pas de blocage)', async () => {
      mockFetchContentCategories.mockRejectedValue(new Error('network down'))
      const wrapper = await mountModal({ modelValue: true })
      await wrapper.find('[data-test="add-condition-btn"]').trigger('click')
      await wrapper.find('[data-test="condition-field-0"]').setValue('content_type')
      const valueField = wrapper.find('[data-test="condition-value-0"]')
      expect(valueField.element.tagName).toBe('INPUT')
      await valueField.setValue('Poissons')
      expect((valueField.element as HTMLInputElement).value).toBe('Poissons')
      wrapper.unmount()
    })
  })
})
