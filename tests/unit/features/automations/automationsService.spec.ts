// tests/unit/features/automations/automationsService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockApiFn = vi.fn()

vi.mock('@/composables/useApi', () => ({
  useApi: () => mockApiFn,
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

const fakePreset = {
  id: 'auto_accept_trusted',
  ruleType: 'PRESET' as const,
  enabled: false,
  label: 'Acceptation automatique (expéditeurs de confiance)',
  description: 'Desc.',
  isConfigurable: true,
  config: { minRating: 4.5 },
}

const fakeCustom = {
  id: 'rule-custom-1',
  ruleType: 'CUSTOM' as const,
  enabled: true,
  name: 'Ma règle personnalisée',
  conditions: [{ field: 'sender_rating' as const, operator: 'gte' as const, value: '4' }],
  action: { type: 'send_alert' as const },
  createdAt: '2026-05-15T10:00:00Z',
}

describe('automationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
  })

  it('listRules calls GET /travelers/me/automation-rules and returns the list', async () => {
    mockApiFn.mockResolvedValue([fakePreset, fakeCustom])
    const { automationsService } = await import('@/features/automations/services/automationsService')
    const svc = automationsService()
    const result = await svc.listRules()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/automation-rules')
    expect(result).toHaveLength(2)
    expect(result[0].ruleType).toBe('PRESET')
    expect(result[1].ruleType).toBe('CUSTOM')
  })

  it('createRule calls POST /travelers/me/automation-rules with the payload as body', async () => {
    const payload = {
      ruleType: 'CUSTOM' as const,
      name: 'Nouvelle règle',
      conditions: [{ field: 'weight_kg' as const, operator: 'lte' as const, value: '10' }],
      action: { type: 'auto_accept' as const },
    }
    mockApiFn.mockResolvedValue({ ...fakeCustom, ...payload, id: 'new-id' })
    const { automationsService } = await import('@/features/automations/services/automationsService')
    const svc = automationsService()
    const result = await svc.createRule(payload)
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/automation-rules', {
      method: 'POST',
      body: payload,
    })
    expect(result).toMatchObject({ id: 'new-id', name: 'Nouvelle règle' })
  })

  it('updateRule calls PUT /travelers/me/automation-rules/{id} with the payload as body', async () => {
    const payload = { enabled: true, config: { minRating: 4.8 } }
    mockApiFn.mockResolvedValue({ ...fakePreset, ...payload })
    const { automationsService } = await import('@/features/automations/services/automationsService')
    const svc = automationsService()
    await svc.updateRule('auto_accept_trusted', payload)
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/automation-rules/auto_accept_trusted', {
      method: 'PUT',
      body: payload,
    })
  })

  it('deleteRule calls DELETE /travelers/me/automation-rules/{id}', async () => {
    mockApiFn.mockResolvedValue(undefined)
    const { automationsService } = await import('@/features/automations/services/automationsService')
    const svc = automationsService()
    await svc.deleteRule('rule-custom-1')
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/automation-rules/rule-custom-1', {
      method: 'DELETE',
    })
  })

  it('listHistory calls GET /travelers/me/automation-history and returns entries', async () => {
    const fakeEntry = {
      id: 'hist-1',
      triggeredAt: '2026-05-15T09:00:00Z',
      ruleId: 'auto_accept_trusted',
      ruleLabel: 'Acceptation automatique',
      bidId: 'bid-42',
      tripId: 'trip-7',
      actionTaken: 'Bid bid-42 accepté automatiquement',
      result: 'SUCCESS' as const,
    }
    mockApiFn.mockResolvedValue([fakeEntry])
    const { automationsService } = await import('@/features/automations/services/automationsService')
    const svc = automationsService()
    const result = await svc.listHistory()
    expect(mockApiFn).toHaveBeenCalledWith('/travelers/me/automation-history')
    expect(result).toHaveLength(1)
    expect(result[0].result).toBe('SUCCESS')
  })
})
