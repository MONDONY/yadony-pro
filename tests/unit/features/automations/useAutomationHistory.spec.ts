// tests/unit/features/automations/useAutomationHistory.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockListHistory = vi.fn()

vi.mock('@/features/automations/services/automationsService', () => ({
  automationsService: () => ({
    listRules: vi.fn().mockResolvedValue([]),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    listHistory: mockListHistory,
  }),
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => vi.fn(),
  _resetApiInstance: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ idToken: 'tok', clear: vi.fn() }),
}))

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

async function importUseAutomationHistory() {
  const mod = await import('@/features/automations/composables/useAutomationHistory')
  return mod.useAutomationHistory
}

describe('useAutomationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
    mockListHistory.mockResolvedValue([fakeEntry])
  })

  it('initializes with empty entries and isLoading false', async () => {
    const useAutomationHistory = await importUseAutomationHistory()
    const { entries, isLoading } = useAutomationHistory()
    expect(entries.value).toEqual([])
    expect(isLoading.value).toBe(false)
  })

  it('fetchHistory populates entries from the API response', async () => {
    const useAutomationHistory = await importUseAutomationHistory()
    const { entries, fetchHistory } = useAutomationHistory()
    await fetchHistory()
    expect(entries.value).toHaveLength(1)
    expect(entries.value[0].id).toBe('hist-1')
    expect(entries.value[0].result).toBe('SUCCESS')
  })

  it('fetchHistory sets isLoading to true during fetch and false after', async () => {
    const useAutomationHistory = await importUseAutomationHistory()
    const { isLoading, fetchHistory } = useAutomationHistory()
    expect(isLoading.value).toBe(false)
    const promise = fetchHistory()
    expect(isLoading.value).toBe(true)
    await promise
    expect(isLoading.value).toBe(false)
  })

  it('fetchHistory sets error message on rejection', async () => {
    mockListHistory.mockRejectedValue(new Error('Network'))
    const useAutomationHistory = await importUseAutomationHistory()
    const { error, fetchHistory } = useAutomationHistory()
    await fetchHistory()
    expect(error.value).toBe("Impossible de charger l'historique. Veuillez réessayer.")
  })

  it('fetchHistory calls listHistory once per invocation', async () => {
    const useAutomationHistory = await importUseAutomationHistory()
    const { fetchHistory } = useAutomationHistory()
    await fetchHistory()
    await fetchHistory()
    expect(mockListHistory).toHaveBeenCalledTimes(2)
  })
})
