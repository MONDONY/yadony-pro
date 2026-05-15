// tests/unit/features/automations/useAutomations.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockListRules = vi.fn()
const mockCreateRule = vi.fn()
const mockUpdateRule = vi.fn()
const mockDeleteRule = vi.fn()

vi.mock('@/features/automations/services/automationsService', () => ({
  automationsService: () => ({
    listRules: mockListRules,
    createRule: mockCreateRule,
    updateRule: mockUpdateRule,
    deleteRule: mockDeleteRule,
    listHistory: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

const fakePreset = {
  id: 'auto_accept_trusted',
  ruleType: 'PRESET' as const,
  enabled: false,
  label: 'Acceptation auto',
  description: 'Desc',
  isConfigurable: true,
  config: { minRating: 4.5 },
}

const fakeCustom = {
  id: 'rule-custom-1',
  ruleType: 'CUSTOM' as const,
  enabled: true,
  name: 'Ma règle',
  conditions: [{ field: 'sender_rating' as const, operator: 'gte' as const, value: '4' }],
  action: { type: 'send_alert' as const },
  createdAt: '2026-05-15T10:00:00Z',
}

async function importUseAutomations() {
  const mod = await import('@/features/automations/composables/useAutomations')
  return mod.useAutomations
}

describe('useAutomations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
    mockListRules.mockResolvedValue([fakePreset, fakeCustom])
  })

  it('initializes with empty presetRules and customRules, isLoading false', async () => {
    const useAutomations = await importUseAutomations()
    const { presetRules, customRules, isLoading } = useAutomations()
    expect(presetRules.value).toEqual([])
    expect(customRules.value).toEqual([])
    expect(isLoading.value).toBe(false)
  })

  it('fetchRules separates PRESET rules into presetRules and CUSTOM rules into customRules', async () => {
    const useAutomations = await importUseAutomations()
    const { presetRules, customRules, fetchRules } = useAutomations()
    await fetchRules()
    expect(presetRules.value).toHaveLength(1)
    expect(presetRules.value[0].id).toBe('auto_accept_trusted')
    expect(customRules.value).toHaveLength(1)
    expect(customRules.value[0].id).toBe('rule-custom-1')
  })

  it('fetchRules sets isLoading to true during fetch and false after completion', async () => {
    const useAutomations = await importUseAutomations()
    const { isLoading, fetchRules } = useAutomations()
    expect(isLoading.value).toBe(false)
    const promise = fetchRules()
    expect(isLoading.value).toBe(true)
    await promise
    expect(isLoading.value).toBe(false)
  })

  it('fetchRules sets error message when listRules rejects', async () => {
    mockListRules.mockRejectedValue(new Error('Network'))
    const useAutomations = await importUseAutomations()
    const { error, fetchRules } = useAutomations()
    await fetchRules()
    expect(error.value).toBe('Impossible de charger les règles. Veuillez réessayer.')
  })

  it('togglePreset calls updateRule with toggled enabled value and re-fetches rules', async () => {
    mockUpdateRule.mockResolvedValue({ ...fakePreset, enabled: true })
    const useAutomations = await importUseAutomations()
    const { fetchRules, togglePreset } = useAutomations()
    await fetchRules()
    await togglePreset('auto_accept_trusted')
    expect(mockUpdateRule).toHaveBeenCalledWith('auto_accept_trusted', { enabled: true })
    expect(mockListRules).toHaveBeenCalledTimes(2)
  })

  it('togglePreset does nothing when preset id is not found in presetRules', async () => {
    const useAutomations = await importUseAutomations()
    const { fetchRules, togglePreset } = useAutomations()
    await fetchRules()
    await togglePreset('non_existent_id')
    expect(mockUpdateRule).not.toHaveBeenCalled()
  })

  it('saveCustomRule calls createRule when no id is provided and re-fetches', async () => {
    const payload = {
      ruleType: 'CUSTOM' as const,
      name: 'Nouvelle règle',
      conditions: [{ field: 'weight_kg' as const, operator: 'lte' as const, value: '10' }],
      action: { type: 'auto_accept' as const },
    }
    mockCreateRule.mockResolvedValue({ ...fakeCustom, ...payload, id: 'new-rule' })
    const useAutomations = await importUseAutomations()
    const { saveCustomRule } = useAutomations()
    await saveCustomRule(payload)
    expect(mockCreateRule).toHaveBeenCalledWith(payload)
    expect(mockUpdateRule).not.toHaveBeenCalled()
    expect(mockListRules).toHaveBeenCalledTimes(1)
  })

  it('saveCustomRule calls updateRule when an id is provided and re-fetches', async () => {
    const payload = {
      ruleType: 'CUSTOM' as const,
      name: 'Règle modifiée',
      conditions: [{ field: 'weight_kg' as const, operator: 'lte' as const, value: '10' }],
      action: { type: 'auto_accept' as const },
    }
    mockUpdateRule.mockResolvedValue({ ...fakeCustom, ...payload })
    const useAutomations = await importUseAutomations()
    const { saveCustomRule } = useAutomations()
    await saveCustomRule(payload, 'rule-custom-1')
    expect(mockUpdateRule).toHaveBeenCalledWith('rule-custom-1', payload)
    expect(mockCreateRule).not.toHaveBeenCalled()
  })

  it('deleteCustomRule calls deleteRule with the id and re-fetches rules', async () => {
    mockDeleteRule.mockResolvedValue(undefined)
    const useAutomations = await importUseAutomations()
    const { fetchRules, deleteCustomRule } = useAutomations()
    await fetchRules()
    await deleteCustomRule('rule-custom-1')
    expect(mockDeleteRule).toHaveBeenCalledWith('rule-custom-1')
    expect(mockListRules).toHaveBeenCalledTimes(2)
  })
})
